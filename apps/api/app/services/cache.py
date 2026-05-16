import json
from typing import Any

from redis.asyncio import Redis

from app.core.config import get_settings


class Cache:
    def __init__(self) -> None:
        self._client = Redis.from_url(get_settings().redis_url, decode_responses=True)

    async def get_json(self, key: str) -> Any | None:
        value = await self._client.get(key)
        return json.loads(value) if value else None

    async def set_json(self, key: str, value: Any, ttl_seconds: int = 300) -> None:
        await self._client.set(key, json.dumps(value, default=str), ex=ttl_seconds)


cache = Cache()
