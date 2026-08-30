import logging

import bcrypt

from core.db import pg_db
from core.exceptions import (
    InvalidCredentialsError,
    PasswordHashError,
)

logger = logging.getLogger(__name__)

GET_USER_BY_USERNAME = "SELECT id, username, password FROM users WHERE username = %s;"


def login(username: str, password: str) -> dict:
    """The signed-in user, or an exception saying why not.

    An unknown username and a wrong password raise the same
    InvalidCredentialsError on purpose: answering them differently would let
    anyone enumerate valid usernames. A database failure is a different error
    with a different status, because the caller's response to it is different —
    retry later, not "check what you typed".
    """
    if not username or not password:
        raise InvalidCredentialsError()

    try:
        with pg_db.get_cursor() as cursor:
            cursor.execute(GET_USER_BY_USERNAME, (username,))
            result = cursor.fetchone()
    except Exception as e:
        logger.error("[Login Error] user lookup failed: %s", e)
        raise e

    if not result:
        raise InvalidCredentialsError()

    user_id, found_username, stored_hash = result

    try:
        matched = bcrypt.checkpw(
            password.encode("utf-8"), stored_hash.encode("utf-8")
        )
    except (ValueError, TypeError, AttributeError) as e:
        # A row whose password column is not a bcrypt hash. Not the caller's
        # fault, and not something a retry fixes.
        logger.error("[Login Error] stored hash for %s is unusable: %s", username, e)
        raise PasswordHashError() from e

    if not matched:
        raise InvalidCredentialsError()

    return {"id": str(user_id), "username": found_username}
