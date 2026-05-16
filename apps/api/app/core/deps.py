from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.security import read_session_user_id
from app.db.session import get_db
from app.models.user import User


async def get_current_user(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> User:
    user_id = read_session_user_id(request, settings)
    user = await db.get(User, user_id)
    if not user:
        from fastapi import HTTPException

        raise HTTPException(status_code=401, detail="User no longer exists")
    return user
