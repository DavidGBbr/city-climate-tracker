"""JWT issuance and verification for the single-admin auth model.

The admin password is a static env var (ADMIN_PASSWORD); on successful match we
mint a short-lived JWT signed with JWT_SECRET. This is intentionally minimal —
production would swap this for an IdP or a users table with bcrypt.
"""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

import jwt

from ..core.config import Settings

ALGORITHM = "HS256"
ADMIN_SUBJECT = "admin"


class InvalidCredentialsError(Exception):
    pass


class InvalidTokenError(Exception):
    pass


def verify_password(candidate: str, settings: Settings) -> None:
    if not settings.admin_password or not secrets.compare_digest(
        candidate, settings.admin_password
    ):
        raise InvalidCredentialsError


def create_access_token(settings: Settings) -> tuple[str, int]:
    expires_in = settings.jwt_expire_minutes * 60
    payload = {
        "sub": ADMIN_SUBJECT,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(seconds=expires_in),
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)
    return token, expires_in


def decode_token(token: str, settings: Settings) -> dict:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
    except jwt.PyJWTError as exc:
        raise InvalidTokenError(str(exc)) from exc
    if payload.get("sub") != ADMIN_SUBJECT:
        raise InvalidTokenError("unexpected subject")
    return payload
