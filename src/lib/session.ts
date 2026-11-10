import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ApiError } from "./api-client";
import { safeRedirectTarget } from "./safe-redirect";
import { apiGet } from "./server-api";
import type { SessionResponse, SessionUser } from "@/types/auth";

/**
 * Server-side session read for Server Components. `server-api` forwards the
 * incoming `cookie` header, so the API authorises this exactly as it would the
 * same call from the browser — including rotating a stale access token.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const data = await apiGet<SessionResponse>("/auth/me");
    return data.user;
  } catch (error) {
    // A rejected session is a signed-out visitor; anything else (an unreachable
    // API, a 500) is a real fault and must not be dressed up as one.
    if (error instanceof ApiError && (error.statusCode === 401 || error.statusCode === 403)) {
      return null;
    }
    throw error;
  }
}

/** The guard every authenticated page calls. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (user) return user;

  // `next` comes from the proxy, because this render does not know the URL it
  // was asked for; a session that lapsed mid-visit resumes on the same page.
  const requested = safeRedirectTarget((await headers()).get("x-request-path"));
  redirect(
    requested === "/" ? "/login" : `/login?next=${encodeURIComponent(requested)}`,
  );
}
