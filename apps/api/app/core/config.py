from functools import lru_cache

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "GitSense API"
    environment: str = "development"
    database_url: str = "postgresql+asyncpg://gitsense:gitsense@localhost:5432/gitsense"
    redis_url: str = "redis://localhost:6379/0"
    session_secret: str = Field(default="dev-only-change-me", min_length=12)
    github_client_id: str = ""
    github_client_secret: str = ""
    github_callback_url: AnyHttpUrl | str = "http://localhost:8000/api/auth/github/callback"
    frontend_url: AnyHttpUrl | str = "http://localhost:3000"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    gemini_base_url: str = "https://generativelanguage.googleapis.com/v1beta/openai/"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    ai_provider: str = "gemini"
    enable_rate_limiting: bool = False
    session_cookie_name: str = "gitsense_session"
    session_max_age_seconds: int = 60 * 60 * 24 * 14

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
