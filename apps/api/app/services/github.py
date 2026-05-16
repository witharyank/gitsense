from urllib.parse import urlencode

import httpx
from fastapi import HTTPException, status

from app.core.config import Settings


class GitHubService:
    api_base = "https://api.github.com"

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def oauth_url(self, state: str) -> str:
        query = urlencode(
            {
                "client_id": self.settings.github_client_id,
                "redirect_uri": str(self.settings.github_callback_url),
                "scope": "read:user user:email repo",
                "state": state,
            }
        )
        return f"https://github.com/login/oauth/authorize?{query}"

    async def exchange_code(self, code: str) -> str:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                data={
                    "client_id": self.settings.github_client_id,
                    "client_secret": self.settings.github_client_secret,
                    "code": code,
                    "redirect_uri": str(self.settings.github_callback_url),
                },
            )
        data = response.json()
        token = data.get("access_token")
        if not token:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="GitHub OAuth failed")
        return token

    async def current_user(self, token: str) -> dict:
        return await self._get(token, "/user")

    async def repositories(self, token: str) -> list[dict]:
        return await self._get(token, "/user/repos?sort=updated&per_page=50")

    async def contents(self, token: str, owner: str, repo: str, path: str = "") -> list[dict]:
        result = await self._get(token, f"/repos/{owner}/{repo}/contents/{path}")
        return result if isinstance(result, list) else [result]

    async def contributors(self, token: str, owner: str, repo: str) -> list[dict]:
        return await self._get(token, f"/repos/{owner}/{repo}/contributors?per_page=20")

    async def commits(self, token: str, owner: str, repo: str) -> list[dict]:
        return await self._get(token, f"/repos/{owner}/{repo}/commits?per_page=20")

    async def languages(self, token: str, owner: str, repo: str) -> dict:
        return await self._get(token, f"/repos/{owner}/{repo}/languages")

    async def read_file(self, token: str, owner: str, repo: str, path: str) -> str:
        data = await self._get(token, f"/repos/{owner}/{repo}/contents/{path}")
        download_url = data.get("download_url")
        if not download_url:
            return ""
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(download_url)
            response.raise_for_status()
            return response.text[:20000]

    async def _get(self, token: str, path: str) -> dict | list:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(
                f"{self.api_base}{path}",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            )
        if response.status_code >= 400:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()
