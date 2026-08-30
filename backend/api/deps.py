"""Dependencies shared by every versioned router."""

from fastapi import Header

from core.auth import TokenError, verify_token
from core.exceptions import InvalidTokenError, MissingTokenError
from schemas.user import AuthUser


def current_user(authorization: str | None = Header(default=None)) -> AuthUser:
    """Every data endpoint depends on this. No token, no data.

    401 (not 403) on every failure, because the client's answer is always the
    same: throw the session away and go back to the login page.
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        raise MissingTokenError()

    try:
        payload = verify_token(authorization.split(" ", 1)[1].strip())
    except TokenError as e:
        raise InvalidTokenError() from e

    return AuthUser(id=payload["sub"], username=payload.get("username", ""))
