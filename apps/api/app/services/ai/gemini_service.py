from app.core.config import Settings
from app.services.ai.openai_compatible import OpenAICompatibleProvider


class GeminiService(OpenAICompatibleProvider):
    provider_name = "gemini"

    def __init__(self, settings: Settings) -> None:
        super().__init__(
            api_key=settings.gemini_api_key,
            model=settings.gemini_model,
            base_url=settings.gemini_base_url,
        )
