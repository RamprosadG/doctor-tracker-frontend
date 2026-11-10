import { NextResponse, type NextRequest } from "next/server";
import { safeRedirectTarget } from "@/lib/safe-redirect";

/**
 * Presence-only gate. Whether the tokens still verify is the API's answer, not
 * this one's — `requireUser()` asks it and bounces to `/login` on a 401. Doing
 * the cheap cookie check here first means an anonymous visitor never even gets
 * a signed-out page's chrome rendered.
 *
 * `src/proxy.ts` is the Next 16 name for what used to be `middleware.ts`.
 */
const SESSION_COOKIES = ["accessToken", "refreshToken"] as const;

/**
 * Continues to the page, telling it which URL was asked for. Server Components
 * have no `pathname` of their own, and a guard that has to bounce an expired
 * session needs that value to put in `?next=`. Whatever the client sent under
 * this name is overwritten here, so it cannot be forged around the gate.
 */
function passThrough(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set(
    "x-request-path",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.next({ request: { headers } });
}

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = SESSION_COOKIES.some(
    (name) => request.cookies.get(name)?.value,
  );

  if (pathname === "/login") {
    if (!hasSession) return passThrough(request);
    const target = safeRedirectTarget(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (hasSession) return passThrough(request);

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = `?next=${encodeURIComponent(`${pathname}${search}`)}`;
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Static assets and the Next internals are public; everything else is the portal.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)"],
};
