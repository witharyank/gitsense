from app.core.config import Settings
from app.services.ai.openai_compatible import OpenAICompatibleProvider


class OpenAIService(OpenAICompatibleProvider):
    provider_name = "openai"

    def __init__(self, settings: Settings) -> None:
        default_headers = {}
        if settings.openai_http_referer:
            default_headers["HTTP-Referer"] = settings.openai_http_referer
        if settings.openai_title:
            default_headers["X-Title"] = settings.openai_title
        super().__init__(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
            base_url=settings.openai_base_url,
            default_headers=default_headers or None,
            max_retries=settings.ai_max_retries,
            retry_base_delay_seconds=settings.ai_retry_base_delay_seconds,
        )
