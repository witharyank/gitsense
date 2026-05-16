from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.core.config import Settings
from app.core.security import decrypt_token
from app.models.ai_summary import AISummary
from app.models.chat import Chat, ChatMessage
from app.models.commit import Commit
from app.models.generated_doc import GeneratedDoc
from app.models.repository import Repository
from app.models.user import User
from app.services.ai import AIProvider, AIProviderError
from app.services.github import GitHubService


def parse_dt(value: str | None) -> datetime | None:
    return datetime.fromisoformat(value.replace("Z", "+00:00")) if value else None


class RepositoryService:
    def __init__(self, db: AsyncSession, github: GitHubService, ai: AIProvider, settings: Settings) -> None:
        self.db = db
        self.github = github
        self.ai = ai
        self.settings = settings

    async def sync(self, user: User) -> list[Repository]:
        token = decrypt_token(user.access_token_encrypted)
        repos = await self.github.repositories(token)
        saved: list[Repository] = []
        for item in repos:
            existing = await self.db.scalar(select(Repository).where(Repository.user_id == user.id, Repository.github_id == item["id"]))
            repo = existing or Repository(user_id=user.id, github_id=item["id"], owner=item["owner"]["login"], name=item["name"], full_name=item["full_name"])
            repo.description = item.get("description")
            repo.language = item.get("language")
            repo.stars = item.get("stargazers_count", 0)
            repo.default_branch = item.get("default_branch")
            repo.html_url = item.get("html_url")
            repo.last_updated_at = parse_dt(item.get("updated_at"))
            self.db.add(repo)
            saved.append(repo)
        await self.db.commit()
        return saved

    async def list_for_user(self, user: User) -> list[Repository]:
        result = await self.db.scalars(select(Repository).where(Repository.user_id == user.id).order_by(Repository.last_updated_at.desc().nullslast()))
        repos = list(result)
        return repos or await self.sync(user)

    async def get_owned(self, user: User, owner: str, repo_name: str) -> Repository:
        repo = await self.db.scalar(select(Repository).where(Repository.user_id == user.id, Repository.owner == owner, Repository.name == repo_name))
        if repo:
            return repo
        await self.sync(user)
        repo = await self.db.scalar(select(Repository).where(Repository.user_id == user.id, Repository.owner == owner, Repository.name == repo_name))
        if not repo:
            from fastapi import HTTPException

            raise HTTPException(status_code=404, detail="Repository not found")
        return repo

    async def workspace(self, user: User, owner: str, repo_name: str) -> dict:
        repo = await self.get_owned(user, owner, repo_name)
        token = decrypt_token(user.access_token_encrypted)
        files, contributors, commits, languages = await self._github_context(token, owner, repo_name)
        await self._persist_commits(repo.id, commits)
        return {
            "repository": repo,
            "files": [{"name": f["name"], "path": f["path"], "type": f["type"], "size": f.get("size")} for f in files],
            "contributors": [
                {"login": c["login"], "avatar_url": c.get("avatar_url"), "html_url": c.get("html_url"), "contributions": c.get("contributions", 0)}
                for c in contributors
            ],
            "commits": [self._commit_payload(c) for c in commits],
            "technologies": list(languages.keys()),
        }

    async def ai_context(self, user: User, owner: str, repo_name: str, selected_files: list[str] | None = None) -> dict:
        workspace = await self.workspace(user, owner, repo_name)
        token = decrypt_token(user.access_token_encrypted)
        file_contents = {}
        for path in (selected_files or [])[:5]:
            file_contents[path] = await self.github.read_file(token, owner, repo_name, path)
        repo = workspace["repository"]
        return {
            "full_name": repo.full_name,
            "description": repo.description,
            "language": repo.language,
            "stars": repo.stars,
            "files": workspace["files"][:80],
            "contributors": workspace["contributors"][:20],
            "commits": workspace["commits"][:20],
            "technologies": workspace["technologies"],
            "selected_file_contents": file_contents,
        }

    async def summarize(self, user: User, owner: str, repo_name: str) -> AISummary:
        repo = await self.get_owned(user, owner, repo_name)
        context = await self.ai_context(user, owner, repo_name)
        try:
            data = await self.ai.repository_summary(context)
        except AIProviderError as exc:
            raise self._ai_http_exception(exc) from exc
        summary = AISummary(repository_id=repo.id, **data)
        self.db.add(summary)
        await self.db.commit()
        await self.db.refresh(summary)
        return summary

    async def chat(self, user: User, owner: str, repo_name: str, message: str, selected_files: list[str]) -> tuple[Chat, str]:
        repo = await self.get_owned(user, owner, repo_name)
        chat = Chat(repository_id=repo.id, user_id=user.id)
        self.db.add(chat)
        await self.db.flush()
        self.db.add(ChatMessage(chat_id=chat.id, role="user", content=message))
        try:
            answer = await self.ai.chat(await self.ai_context(user, owner, repo_name, selected_files), message)
        except AIProviderError as exc:
            raise self._ai_http_exception(exc) from exc
        self.db.add(ChatMessage(chat_id=chat.id, role="assistant", content=answer))
        await self.db.commit()
        return chat, answer

    async def commits_intelligence(self, user: User, owner: str, repo_name: str) -> dict:
        try:
            return await self.ai.commit_intelligence(await self.ai_context(user, owner, repo_name))
        except AIProviderError as exc:
            raise self._ai_http_exception(exc) from exc

    async def readme(self, user: User, owner: str, repo_name: str) -> GeneratedDoc:
        repo = await self.get_owned(user, owner, repo_name)
        try:
            markdown = await self.ai.readme(await self.ai_context(user, owner, repo_name))
        except AIProviderError as exc:
            raise self._ai_http_exception(exc) from exc
        doc = GeneratedDoc(repository_id=repo.id, kind="readme", title="README.md", content_markdown=markdown)
        self.db.add(doc)
        await self.db.commit()
        await self.db.refresh(doc)
        return doc

    async def _github_context(self, token: str, owner: str, repo_name: str) -> tuple[list[dict], list[dict], list[dict], dict]:
        files = await self.github.contents(token, owner, repo_name)
        contributors = await self.github.contributors(token, owner, repo_name)
        commits = await self.github.commits(token, owner, repo_name)
        languages = await self.github.languages(token, owner, repo_name)
        return files, contributors, commits, languages

    async def _persist_commits(self, repository_id: UUID, commits: list[dict]) -> None:
        for item in commits:
            sha = item["sha"]
            existing = await self.db.scalar(select(Commit).where(Commit.repository_id == repository_id, Commit.sha == sha))
            if existing:
                continue
            payload = self._commit_payload(item)
            self.db.add(Commit(repository_id=repository_id, **payload))
        await self.db.commit()

    def _ai_http_exception(self, exc: AIProviderError) -> HTTPException:
        if exc.status_code == 429 and not self.settings.enable_rate_limiting:
            return HTTPException(status_code=503, detail="AI provider is temporarily unavailable. Try again shortly.")
        return HTTPException(status_code=exc.status_code, detail=exc.message)

    def _commit_payload(self, item: dict) -> dict:
        author = item.get("author") or {}
        commit = item.get("commit") or {}
        commit_author = commit.get("author") or {}
        return {
            "sha": item["sha"],
            "message": commit.get("message", ""),
            "author_name": commit_author.get("name") or author.get("login"),
            "author_avatar_url": author.get("avatar_url"),
            "html_url": item.get("html_url"),
            "committed_at": parse_dt(commit_author.get("date")),
        }
