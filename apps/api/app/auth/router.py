from fastapi import APIRouter, Depends, HTTPException, status

from ..core.config import Settings, get_settings
from .schemas import LoginRequest, TokenResponse
from .service import InvalidCredentialsError, create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, settings: Settings = Depends(get_settings)) -> TokenResponse:
    try:
        verify_password(payload.password, settings)
    except InvalidCredentialsError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        ) from None
    token, expires_in = create_access_token(settings)
    return TokenResponse(access_token=token, expires_in=expires_in)
