from app.core.config import Settings
from app.services.ai.openai_compatible import OpenAICompatibleProvider


class OpenAIService(OpenAICompatibleProvider):
    provider_name = "openai"

    def __init__(self, settings: Settings) -> None:
        super().__init__(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
        )
