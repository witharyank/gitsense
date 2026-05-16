from pydantic import BaseModel


class AuthUrl(BaseModel):
    url: str


class CurrentUser(BaseModel):
    id: str
    username: str
    name: str | None = None
    email: str | None = None
    avatar_url: str | None = None
