from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.repository import Repository
from app.models.user import User
from app.schemas.ai import AISummaryRead, ChatRequest, ChatResponse, CommitIntelligence, GeneratedReadme
from app.schemas.repository import CommitRead, RepositoryRead, RepositoryWorkspace
from app.services.ai import get_ai_service
from app.services.github import GitHubService
from app.services.repositories import RepositoryService

router = APIRouter(prefix="/repositories", tags=["repositories"])


def repo_read(repo: Repository) -> RepositoryRead:
    return RepositoryRead(
        id=str(repo.id),
        owner=repo.owner,
        name=repo.name,
        full_name=repo.full_name,
        description=repo.description,
        language=repo.language,
        stars=repo.stars,
        default_branch=repo.default_branch,
        html_url=repo.html_url,
        last_updated_at=repo.last_updated_at,
    )


def service(db: AsyncSession, settings: Settings) -> RepositoryService:
    return RepositoryService(db, GitHubService(settings), get_ai_service(settings), settings)


@router.post("/sync", response_model=list[RepositoryRead])
async def sync_repositories(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> list[RepositoryRead]:
    repos = await service(db, settings).sync(user)
    return [repo_read(repo) for repo in repos]


@router.get("", response_model=list[RepositoryRead])
async def list_repositories(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> list[RepositoryRead]:
    repos = await service(db, settings).list_for_user(user)
    return [repo_read(repo) for repo in repos]


@router.get("/{owner}/{repo}", response_model=RepositoryWorkspace)
async def workspace(
    owner: str,
    repo: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> RepositoryWorkspace:
    data = await service(db, settings).workspace(user, owner, repo)
    return RepositoryWorkspace(
        repository=repo_read(data["repository"]),
        files=data["files"],
        contributors=data["contributors"],
        commits=[CommitRead(**commit) for commit in data["commits"]],
        technologies=data["technologies"],
    )


@router.post("/{owner}/{repo}/summary", response_model=AISummaryRead)
async def summarize(
    owner: str,
    repo: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AISummaryRead:
    summary = await service(db, settings).summarize(user, owner, repo)
    return AISummaryRead(
        id=str(summary.id),
        overview=summary.overview,
        architecture=summary.architecture,
        detected_stack=summary.detected_stack,
        probable_purpose=summary.probable_purpose,
        beginner_explanation=summary.beginner_explanation,
    )


@router.post("/{owner}/{repo}/chat", response_model=ChatResponse)
async def chat(
    owner: str,
    repo: str,
    payload: ChatRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> ChatResponse:
    chat_model, answer = await service(db, settings).chat(user, owner, repo, payload.message, payload.selected_files)
    return ChatResponse(chat_id=str(chat_model.id), answer=answer)


@router.post("/{owner}/{repo}/commits/intelligence", response_model=CommitIntelligence)
async def commit_intelligence(
    owner: str,
    repo: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> CommitIntelligence:
    return CommitIntelligence(**await service(db, settings).commits_intelligence(user, owner, repo))


@router.post("/{owner}/{repo}/readme", response_model=GeneratedReadme)
async def readme(
    owner: str,
    repo: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> GeneratedReadme:
    doc = await service(db, settings).readme(user, owner, repo)
    return GeneratedReadme(id=str(doc.id), markdown=doc.content_markdown)
