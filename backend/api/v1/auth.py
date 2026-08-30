"""Sign in, identity check, sign out."""

from fastapi import APIRouter, Depends

from api.deps import current_user
from core.auth import issue_token
from schemas.user import AuthUser, LoginRequest, LoginResponse
from services.user import login

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login_api(payload: LoginRequest):
    """Bad credentials and a broken lookup have to stay distinguishable — see
    the docstring on login(). Both leave here as AppException subclasses with
    their own status, so no try/except is needed."""
    user = login(payload.username, payload.password)

    return LoginResponse(
        access_token=issue_token(user["id"], user["username"]),
        user=AuthUser(id=user["id"], username=user["username"]),
    )


@router.get("/me", response_model=AuthUser)
def me_api(user: AuthUser = Depends(current_user)):
    """Lets the console check a stored token before it renders anything."""
    return user


@router.post("/logout")
def logout_api(user: AuthUser = Depends(current_user)):
    """Tokens are stateless and self-expiring, so there is nothing to revoke
    here — the client dropping the token IS the logout. This endpoint exists so
    that stays true from one place, and so a future denylist has a home."""
    return {"status": "success"}
