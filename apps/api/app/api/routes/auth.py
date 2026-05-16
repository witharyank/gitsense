from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.security import clear_session_cookie, create_session_token, encrypt_token, set_session_cookie
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import AuthUrl, CurrentUser
from app.services.github import GitHubService
from app.core.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/github", response_model=AuthUrl)
async def github_auth_url(response: Response, settings: Settings = Depends(get_settings)) -> AuthUrl:
    state = str(uuid4())
    response.set_cookie(
        "gitsense_oauth_state",
        state,
        max_age=600,
        httponly=True,
        secure=settings.environment == "production",
        samesite="lax",
    )
    return AuthUrl(url=GitHubService(settings).oauth_url(state))


@router.get("/github/callback")
async def github_callback(
    request: Request,
    code: str = Query(...),
    state: str = Query(...),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    expected_state = request.cookies.get("gitsense_oauth_state")
    if not expected_state or expected_state != state:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OAuth state")
    github = GitHubService(settings)
    access_token = await github.exchange_code(code)
    profile = await github.current_user(access_token)
    user = await db.scalar(select(User).where(User.github_id == profile["id"]))
    if not user:
        user = User(github_id=profile["id"], username=profile["login"], access_token_encrypted=encrypt_token(access_token, settings))
    user.username = profile["login"]
    user.name = profile.get("name")
    user.email = profile.get("email")
    user.avatar_url = profile.get("avatar_url")
    user.access_token_encrypted = encrypt_token(access_token, settings)
    db.add(user)
    await db.commit()
    await db.refresh(user)

    response = RedirectResponse(f"{settings.frontend_url}/dashboard")
    set_session_cookie(response, create_session_token(user.id, settings), settings)
    response.delete_cookie("gitsense_oauth_state")
    return response


@router.get("/me", response_model=CurrentUser)
async def me(user: User = Depends(get_current_user)) -> CurrentUser:
    return CurrentUser(id=str(user.id), username=user.username, name=user.name, email=user.email, avatar_url=user.avatar_url)


@router.post("/logout")
async def logout(response: Response, settings: Settings = Depends(get_settings)) -> dict[str, str]:
    clear_session_cookie(response, settings)
    return {"status": "ok"}
