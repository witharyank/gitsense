import json
from collections.abc import AsyncIterator
from typing import Any

from openai import APIConnectionError, APIStatusError, APITimeoutError, AsyncOpenAI, AuthenticationError, BadRequestError, RateLimitError

from app.services.ai.base import AIProvider, AIProviderError, commit_intelligence_fallback, parse_json_object, repository_summary_fallback


class OpenAICompatibleProvider(AIProvider):
    provider_name = "openai-compatible"

    def __init__(self, *, api_key: str, model: str, base_url: str | None = None, timeout_seconds: float = 45.0) -> None:
        self.model = model
        self.client = AsyncOpenAI(api_key=api_key, base_url=base_url, timeout=timeout_seconds)

    async def _completion(self, messages: list[dict[str, str]], *, json_response: bool = False) -> str:
        try:
            kwargs: dict[str, Any] = {
                "model": self.model,
                "messages": messages,
                "temperature": 0.2,
            }
            if json_response:
                kwargs["response_format"] = {"type": "json_object"}
            response = await self.client.chat.completions.create(**kwargs)
            content = response.choices[0].message.content
            if not content:
                raise AIProviderError("AI provider returned an empty response.", status_code=502, provider=self.provider_name)
            return content
        except AuthenticationError as exc:
            raise AIProviderError("Invalid AI provider API key.", status_code=401, provider=self.provider_name) from exc
        except RateLimitError as exc:
            raise AIProviderError("AI provider rate limit exceeded. Try again shortly.", status_code=429, provider=self.provider_name) from exc
        except APITimeoutError as exc:
            raise AIProviderError("AI provider request timed out.", status_code=504, provider=self.provider_name) from exc
        except BadRequestError as exc:
            raise AIProviderError("AI provider rejected the request payload.", status_code=400, provider=self.provider_name) from exc
        except APIConnectionError as exc:
            raise AIProviderError("Could not connect to AI provider.", status_code=503, provider=self.provider_name) from exc
        except APIStatusError as exc:
            status_code = exc.status_code if exc.status_code in {401, 403, 408, 409, 429, 500, 502, 503, 504} else 502
            raise AIProviderError("AI provider returned an error.", status_code=status_code, provider=self.provider_name) from exc
        except (IndexError, AttributeError) as exc:
            raise AIProviderError("AI provider returned an unexpected response shape.", status_code=502, provider=self.provider_name) from exc

    async def _stream_completion(self, messages: list[dict[str, str]]) -> AsyncIterator[str]:
        try:
            stream = await self.client.chat.completions.create(
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
            raise AIProviderError("Invalid AI provider API key.", status_code=401, provider=self.provider_name) from exc
        except RateLimitError as exc:
            raise AIProviderError("AI provider rate limit exceeded. Try again shortly.", status_code=429, provider=self.provider_name) from exc
        except APITimeoutError as exc:
            raise AIProviderError("AI provider request timed out.", status_code=504, provider=self.provider_name) from exc
        except APIConnectionError as exc:
            raise AIProviderError("Could not connect to AI provider.", status_code=503, provider=self.provider_name) from exc
        except APIStatusError as exc:
            raise AIProviderError("AI provider returned an error.", status_code=exc.status_code, provider=self.provider_name) from exc

    async def repository_summary(self, context: dict[str, Any]) -> dict[str, Any]:
        prompt = (
            "Return strict JSON with keys overview, architecture, detected_stack, probable_purpose, "
            f"beginner_explanation for this repository context:\n{json.dumps(context, default=str)[:12000]}"
        )
        parsed = parse_json_object(await self._completion([{"role": "user", "content": prompt}], json_response=True), provider=self.provider_name)
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
        parsed = parse_json_object(await self._completion([{"role": "user", "content": prompt}], json_response=True), provider=self.provider_name)
        return commit_intelligence_fallback(context) | parsed

    async def readme(self, context: dict[str, Any]) -> str:
        prompt = f"Generate a professional README.md with overview, installation, tech stack, usage, contribution guide:\n{json.dumps(context, default=str)[:12000]}"
        return await self._completion([{"role": "user", "content": prompt}])
