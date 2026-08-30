"""Signed session tokens.

PyJWT is not installed and adding a dependency for this is not worth it, so the
token is an HMAC-SHA256 signed payload built from the standard library. The
format is the same idea as a JWT without the algorithm-negotiation footgun:

    base64url(payload_json) "." base64url(hmac_sha256(secret, payload_b64))

The signature covers the payload bytes, comparison is constant time, and there
is no "alg" field to confuse — this only ever verifies HMAC-SHA256.
"""

import base64
import hashlib
import hmac
import json
import logging
import os
import secrets
import time

from dotenv import load_dotenv

# Not left to import order: this module is read at import time, and whether the
# secret is found must not depend on some other module having loaded .env first.
load_dotenv()

# Long enough for a working day, short enough that a leaked token expires.
TOKEN_TTL_SECONDS = 12 * 60 * 60


class TokenError(Exception):
    """Raised when a token is missing, malformed, forged or expired."""


def _load_secret() -> bytes:
    configured = os.getenv("AUTH_SECRET")
    if configured:
        return configured.encode("utf-8")

    # Without a configured secret every restart invalidates every session, and
    # uvicorn --reload restarts constantly. Loud, because it is a misconfig.
    logging.warning(
        "AUTH_SECRET is not set — generating an ephemeral one. Every restart "
        "will sign users out. Set AUTH_SECRET in backend/.env."
    )
    return secrets.token_bytes(32)


_SECRET = _load_secret()


def _b64encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def _sign(payload_b64: str) -> str:
    digest = hmac.new(_SECRET, payload_b64.encode("ascii"), hashlib.sha256).digest()
    return _b64encode(digest)


def issue_token(user_id: str, username: str) -> str:
    payload = {
        "sub": str(user_id),
        "username": username,
        "exp": int(time.time()) + TOKEN_TTL_SECONDS,
    }
    payload_b64 = _b64encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    return f"{payload_b64}.{_sign(payload_b64)}"


def verify_token(token: str) -> dict:
    """Return the payload, or raise TokenError. Never returns for a bad token."""
    if not token or token.count(".") != 1:
        raise TokenError("Malformed token")

    payload_b64, signature = token.split(".")

    # compare_digest, not ==, so a forged signature cannot be found byte by byte.
    if not hmac.compare_digest(signature, _sign(payload_b64)):
        raise TokenError("Bad signature")

    try:
        payload = json.loads(_b64decode(payload_b64))
    except (ValueError, json.JSONDecodeError) as e:
        raise TokenError("Unreadable payload") from e

    if not isinstance(payload, dict) or "sub" not in payload:
        raise TokenError("Unreadable payload")

    if int(payload.get("exp", 0)) <= time.time():
        raise TokenError("Token expired")

    return payload
