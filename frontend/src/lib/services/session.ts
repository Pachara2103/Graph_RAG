/**
 * Where the bearer token lives, kept apart from both the auth store and the
 * fetch helper so those two do not have to import each other.
 */

const STORAGE_KEY = "nextlink.session";

export interface StoredSession {
  token: string;
  userId: string;
  username: string;
}

export function readSession(): StoredSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // A half-written or older-format entry is worse than none.
    if (typeof parsed?.token !== "string" || typeof parsed?.username !== "string") {
      return null;
    }
    return parsed as StoredSession;
  } catch {
    // No storage (private mode), or unparseable leftovers.
    return null;
  }
}

export function writeSession(session: StoredSession): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // A session that cannot be persisted still works for this tab.
  }
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to clear */
  }
}

/**
 * Called when the API rejects our token. The auth store registers the handler
 * that tears the session down, so an expired token anywhere in the app lands
 * the user back on the login page instead of on a console that cannot load.
 */
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

export function notifyUnauthorized(): void {
  onUnauthorized?.();
}
