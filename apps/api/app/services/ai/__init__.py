from app.services.ai.base import AIProvider, AIProviderError
from app.services.ai.factory import get_ai_service

AIService = AIProvider

__all__ = ["AIProvider", "AIProviderError", "AIService", "get_ai_service"]
