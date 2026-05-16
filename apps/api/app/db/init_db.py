from app.db.session import Base, engine
from app.models import ai_summary, chat, commit, generated_doc, repository, user  # noqa: F401


async def create_all() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
