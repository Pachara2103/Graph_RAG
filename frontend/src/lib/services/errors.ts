import { ApiError } from "@/lib/services/http";

/**
 * Turning a failed request into something worth showing the user.
 *
 * The backend raises core.exceptions.AppException, whose `message` is written
 * for this console and arrives as FastAPI's `detail`. When one is there it
 * beats anything we could guess from the status code alone — it names the
 * actual cause ("ไม่พบบริษัทของกลุ่มนี้ในฐานข้อมูล") where a status code can
 * only say that something went wrong.
 */

/** True when the request never got an answer from the API at all. */
export function isNetworkError(error: unknown): boolean {
  return !(error instanceof ApiError);
}

/**
 * A detail is only worth showing if it reads as a sentence. FastAPI's 422 body
 * is an array of validation objects, and a proxy that cannot reach the backend
 * answers with an HTML page — neither belongs in a toast.
 */
function isHumanReadable(detail: string): boolean {
  if (detail.length === 0 || detail.length > 220) return false;
  if (/^[[{<]/.test(detail)) return false;
  return true;
}

/** The message the API sent, or null when there is nothing usable to show. */
export function serverDetail(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const detail = error.detail?.trim() ?? "";
  return isHumanReadable(detail) ? detail : null;
}

/**
 * The full "what failed, and why" sentence.
 *
 * `prefix` names the action from the caller's point of view, because the
 * backend only knows its own half — it can say the graph write failed, not
 * that this was someone binding a company to a group.
 */
export function describeError(
  error: unknown,
  prefix: string,
  fallback: { network: string; unknown: string },
): string {
  if (isNetworkError(error)) return fallback.network;
  const detail = serverDetail(error);
  return detail ? `${prefix}: ${detail}` : fallback.unknown;
}
