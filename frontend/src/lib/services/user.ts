import { postJson, getJson } from "@/lib/services/http";

export interface LoginPayload {
  username: string;
  password: string;
}

export interface AuthUser {
  id: string;
  username: string;
}

export interface LoginResult {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export const userService = {
  /**
   * 401 means the credentials are wrong; anything else is a server problem.
   * backend/services/user.py keeps those two apart on purpose, so the
   * login form can say which one happened.
   */
  login: (payload: LoginPayload) =>
    postJson<LoginResult>("/api/v1/auth/login", payload),

  /** Checks a stored token against the API. 401 means it is no longer good. */
  me: () => getJson<AuthUser>("/api/v1/auth/me"),

  /**
   * Tokens are stateless and self-expiring, so dropping the token IS the
   * logout — this just tells the backend, and callers must clear their own
   * session whether or not it resolves.
   */
  logout: () => postJson<{ status: string }>("/api/v1/auth/logout", {}),
};
