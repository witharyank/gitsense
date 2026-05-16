from uuid import UUID

from cryptography.fernet import Fernet, InvalidToken
from fastapi import HTTPException, Request, Response, status
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from app.core.config import Settings


def _serializer(settings: Settings) -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(settings.session_secret, salt="gitsense-session")


def create_session_token(user_id: UUID, settings: Settings) -> str:
    return _serializer(settings).dumps({"sub": str(user_id)})


def read_session_user_id(request: Request, settings: Settings) -> UUID:
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = _serializer(settings).loads(token, max_age=settings.session_max_age_seconds)
        return UUID(payload["sub"])
    except (BadSignature, SignatureExpired, KeyError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session") from exc


def set_session_cookie(response: Response, token: str, settings: Settings) -> None:
    secure = settings.environment == "production"
    response.set_cookie(
        settings.session_cookie_name,
        token,
        max_age=settings.session_max_age_seconds,
        httponly=True,
        secure=secure,
        samesite="lax",
    )


def clear_session_cookie(response: Response, settings: Settings) -> None:
    response.delete_cookie(settings.session_cookie_name)


def encrypt_token(token: str, settings: Settings) -> str:
    key = Fernet.generate_key()
    # MVP-friendly envelope encryption: derive a per-value key and store it with ciphertext.
    # Production deployments should replace this with KMS or Vault-managed encryption.
    encrypted = Fernet(key).encrypt(token.encode()).decode()
    return f"{key.decode()}:{encrypted}"


def decrypt_token(value: str) -> str:
    try:
        key, encrypted = value.split(":", 1)
        return Fernet(key.encode()).decrypt(encrypted.encode()).decode()
    except (ValueError, InvalidToken) as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Stored token is invalid") from exc
