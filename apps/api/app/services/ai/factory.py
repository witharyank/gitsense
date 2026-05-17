from app.core.config import Settings
from app.services.ai.base import AIProvider, commit_intelligence_fallback, readme_fallback, repository_summary_fallback
from app.services.ai.gemini_service import GeminiService
from app.services.ai.openai_service import OpenAIService


class DisabledAIService(AIProvider):
    provider_name = "disabled"

    async def repository_summary(self, context: dict) -> dict:
        return repository_summary_fallback(context)

    async def chat(self, context: dict, question: str) -> str:
        return "AI is not configured yet. Add an API key for the configured provider to enable repository-aware answers."

    async def commit_intelligence(self, context: dict) -> dict:
        return commit_intelligence_fallback(context)

    async def readme(self, context: dict) -> str:
        return readme_fallback(context)


def get_ai_service(settings: Settings) -> AIProvider:
    provider = settings.ai_provider.lower().strip()
    if provider == "gemini":
        return GeminiService(settings) if settings.gemini_api_key else DisabledAIService()
    if provider == "openai":
        return OpenAIService(settings) if settings.openai_api_key else DisabledAIService()
    return DisabledAIService()
