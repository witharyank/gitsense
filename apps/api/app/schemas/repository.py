from datetime import datetime
from pydantic import BaseModel


class RepositoryRead(BaseModel):
    id: str
    owner: str
    name: str
    full_name: str
    description: str | None
    language: str | None
    stars: int
    default_branch: str | None
    html_url: str | None
    last_updated_at: datetime | None


class FileNode(BaseModel):
    name: str
    path: str
    type: str
    size: int | None = None


class Contributor(BaseModel):
    login: str
    avatar_url: str | None = None
    html_url: str | None = None
    contributions: int


class CommitRead(BaseModel):
    sha: str
    message: str
    author_name: str | None
    author_avatar_url: str | None
    html_url: str | None
    committed_at: datetime | None
    ai_summary: str | None = None


class RepositoryWorkspace(BaseModel):
    repository: RepositoryRead
    files: list[FileNode]
    contributors: list[Contributor]
    commits: list[CommitRead]
    technologies: list[str]
