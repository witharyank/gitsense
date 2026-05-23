import asyncio
import json
from collections.abc import AsyncIterator
from typing import Any

from openai import APIConnectionError, APIStatusError, APITimeoutError, AsyncOpenAI, AuthenticationError, BadRequestError, RateLimitError

from app.services.ai.base import AIProvider, AIProviderError, commit_intelligence_fallback, parse_json_object, repository_summary_fallback


class OpenAICompatibleProvider(AIProvider):
    provider_name = "openai-compatible"
    temporary_status_codes = {408, 409, 429, 500, 502, 503, 504}

    def __init__(
        self,
        *,
        api_key: str,
        model: str,
        base_url: str | None = None,
        default_headers: dict[str, str] | None = None,
        timeout_seconds: float = 45.0,
        max_retries: int = 2,
        retry_base_delay_seconds: float = 0.5,
    ) -> None:
        self.model = model
        self.max_retries = max(0, max_retries)
        self.retry_base_delay_seconds = retry_base_delay_seconds
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url,
            default_headers=default_headers,
            timeout=timeout_seconds,
            max_retries=0,
        )

    def _provider_error(self, exc: Exception, message: str, *, status_code: int | None = None) -> AIProviderError:
        resolved_status_code = status_code or getattr(exc, "status_code", None) or 502
        response = getattr(exc, "response", None)
        response_body = getattr(response, "text", None) or getattr(exc, "body", None)
        if response_body is not None and not isinstance(response_body, str):
            response_body = json.dumps(response_body, default=str)
        return AIProviderError(
            message,
            status_code=resolved_status_code,
            provider=self.provider_name,
            model=self.model,
            response_body=response_body,
        )

    def _is_temporary_provider_error(self, exc: Exception) -> bool:
        if isinstance(exc, (APIConnectionError, APITimeoutError, RateLimitError)):
            return True
        return isinstance(exc, APIStatusError) and exc.status_code in self.temporary_status_codes

    async def _create_completion(self, **kwargs: Any) -> Any:
        for attempt in range(self.max_retries + 1):
            try:
                return await self.client.chat.completions.create(**kwargs)
            except (APIConnectionError, APITimeoutError, RateLimitError, APIStatusError) as exc:
                if attempt >= self.max_retries or not self._is_temporary_provider_error(exc):
                    raise
                await asyncio.sleep(self.retry_base_delay_seconds * (2**attempt))
        raise AIProviderError("AI provider request failed after retries.", status_code=502, provider=self.provider_name, model=self.model)

    async def _completion(self, messages: list[dict[str, str]], *, json_response: bool = False) -> str:
        try:
            kwargs: dict[str, Any] = {
                "model": self.model,
                "messages": messages,
                "temperature": 0.2,
            }
            if json_response:
                kwargs["response_format"] = {"type": "json_object"}
            response = await self._create_completion(**kwargs)
            content = response.choices[0].message.content
            if not content:
                raise AIProviderError("AI provider returned an empty response.", status_code=502, provider=self.provider_name, model=self.model)
            return content
        except AuthenticationError as exc:
            raise self._provider_error(exc, "Invalid AI provider API key.", status_code=401) from exc
        except RateLimitError as exc:
            raise self._provider_error(exc, "AI provider rate limit exceeded. Try again shortly.", status_code=429) from exc
        except APITimeoutError as exc:
            raise self._provider_error(exc, "AI provider request timed out.", status_code=504) from exc
        except BadRequestError as exc:
            raise self._provider_error(exc, "AI provider rejected the request payload.", status_code=400) from exc
        except APIConnectionError as exc:
            raise self._provider_error(exc, "Could not connect to AI provider.", status_code=503) from exc
        except APIStatusError as exc:
            status_code = exc.status_code if exc.status_code in {401, 403, 408, 409, 429, 500, 502, 503, 504} else 502
            raise self._provider_error(exc, "AI provider returned an error.", status_code=status_code) from exc
        except (IndexError, AttributeError) as exc:
            raise self._provider_error(exc, "AI provider returned an unexpected response shape.", status_code=502) from exc

    async def _stream_completion(self, messages: list[dict[str, str]]) -> AsyncIterator[str]:
        try:
            stream = await self._create_completion(
                model=self.model,
                messages=messages,
                temperature=0.2,
                stream=True,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta
        except AuthenticationError as exc:
            raise self._provider_error(exc, "Invalid AI provider API key.", status_code=401) from exc
        except RateLimitError as exc:
            raise self._provider_error(exc, "AI provider rate limit exceeded. Try again shortly.", status_code=429) from exc
        except APITimeoutError as exc:
            raise self._provider_error(exc, "AI provider request timed out.", status_code=504) from exc
        except APIConnectionError as exc:
            raise self._provider_error(exc, "Could not connect to AI provider.", status_code=503) from exc
        except APIStatusError as exc:
            raise self._provider_error(exc, "AI provider returned an error.", status_code=exc.status_code) from exc

    async def repository_summary(self, context: dict[str, Any]) -> dict[str, Any]:
        prompt = (
            "Return strict JSON with keys overview, architecture, detected_stack, probable_purpose, "
            f"beginner_explanation for this repository context:\n{json.dumps(context, default=str)[:12000]}"
        )
        parsed = parse_json_object(await self._completion([{"role": "user", "content": prompt}], json_response=True), provider=self.provider_name, model=self.model)
        return repository_summary_fallback(context) | parsed

    async def chat(self, context: dict[str, Any], question: str) -> str:
        return await self._completion(
            [
                {"role": "system", "content": "You are GitSense, a concise senior engineer explaining a repository with provided context."},
                {"role": "user", "content": f"Context:\n{json.dumps(context, default=str)[:16000]}\n\nQuestion: {question}"},
            ]
        )

    async def stream_chat(self, context: dict[str, Any], question: str) -> AsyncIterator[str]:
        async for chunk in self._stream_completion(
            [
                {"role": "system", "content": "You are GitSense, a concise senior engineer explaining a repository with provided context."},
                {"role": "user", "content": f"Context:\n{json.dumps(context, default=str)[:16000]}\n\nQuestion: {question}"},
            ]
        ):
            yield chunk

    async def commit_intelligence(self, context: dict[str, Any]) -> dict[str, Any]:
        prompt = (
            "Return strict JSON with commit_summaries array, contributor_insights array, "
            f"weekly_progress_summary string for these commits:\n{json.dumps(context, default=str)[:12000]}"
        )
        parsed = parse_json_object(await self._completion([{"role": "user", "content": prompt}], json_response=True), provider=self.provider_name, model=self.model)
        return commit_intelligence_fallback(context) | parsed

    async def readme(self, context: dict[str, Any]) -> str:
        prompt = f"Generate a professional README.md with overview, installation, tech stack, usage, contribution guide:\n{json.dumps(context, default=str)[:12000]}"
        return await self._completion([{"role": "user", "content": prompt}])
