from fastapi import Depends, HTTPException, Request, status

from ..core.config import Settings, get_settings
from .service import InvalidTokenError, decode_token


def require_admin(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> str:
    header = request.headers.get("Authorization", "")
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_token(token, settings)
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None
    return payload["sub"]
