import { headers } from "next/headers";
import { ApiError, buildUrl, unwrap } from "./api-client";
import type { QueryParams } from "@/types/api";

/**
 * Server-side base URL. Server Components talk to the API over the loopback
 * interface, so the browser never learns or depends on this value.
 */
const SERVER_API_URL =
  process.env.API_SERVER_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5000/api/v1";

const ACCESS_COOKIE = "accessToken";

/**
 * Forwards the browser's access token to the API.
 *
 * Deliberately not the refresh token: the API rotates a session whenever it
 * authorises a call from a stale access token, and a rotation spent during a
 * server render cannot be handed back to the browser — Next only lets Server
 * Actions and route handlers write cookies. The browser would keep a token the
 * API had already spent, and its next call would read as token theft. So server
 * rendering authenticates, and only the browser rotates.
 */
async function forwardHeaders(): Promise<Headers> {
  const incoming = await headers();
  const outgoing = new Headers({ Accept: "application/json" });

  const cookie = incoming.get("cookie");
  if (cookie) {
    const accessToken = cookie
      .split(";")
      .map((pair) => pair.trim())
      .find((pair) => pair.startsWith(`${ACCESS_COOKIE}=`));
    if (accessToken) outgoing.set("cookie", accessToken);
  }

  const authorization = incoming.get("authorization");
  if (authorization) outgoing.set("authorization", authorization);

  return outgoing;
}

async function send<T>(
  method: string,
  path: string,
  { query, body }: { query?: QueryParams; body?: unknown } = {},
): Promise<T> {
  const outgoing = await forwardHeaders();
  if (body !== undefined) outgoing.set("Content-Type", "application/json");

  let response: Response;

  try {
    response = await fetch(buildUrl(SERVER_API_URL, path, query), {
      method,
      headers: outgoing,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "Cannot reach the API from the server. Check that the backend is running.",
      0,
    );
  }

  return unwrap<T>(response);
}

/** Read helper for Server Components. */
export const apiGet = <T>(path: string, query?: QueryParams): Promise<T> =>
  send<T>("GET", path, { query });

/** Mutation helper for Server Actions and route handlers, when they appear. */
export const apiSend = <T>(
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  options: { body?: unknown; query?: QueryParams } = {},
): Promise<T> => send<T>(method, path, options);
