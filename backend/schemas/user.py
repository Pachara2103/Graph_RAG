from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class AuthUser(BaseModel):
    """Who a bearer token says the caller is."""
    id: str
    username: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUser
