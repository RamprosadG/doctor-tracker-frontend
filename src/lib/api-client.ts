import type { ApiEnvelope, FieldErrors, QueryParams } from "@/types/api";

/**
 * Browser-side API base. Inlined by the bundler, so the web app needs no proxy
 * route in front of the Express service.
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

export class ApiError extends Error {
  readonly statusCode: number;
  readonly errors?: FieldErrors;

  constructor(message: string, statusCode: number, errors?: FieldErrors) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

/** Drops empty values so a blank filter box never sends `search=`. */
export function buildUrl(
  baseUrl: string,
  path: string,
  query?: QueryParams,
): string {
  const url = new URL(
    `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`,
  );

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

/**
 * Turns a response into either its `data` or an `ApiError`. Shared with the
 * server wrapper so both faces fail with the same message and field errors.
 */
export async function unwrap<T>(response: Response): Promise<T> {
  let envelope: ApiEnvelope<T> | undefined;

  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError(
      response.status === 401
        ? "Your session has expired. Please sign in again."
        : "The API replied with something this app could not read.",
      response.status,
    );
  }

  if (!response.ok || envelope.success === false) {
    throw new ApiError(
      envelope?.message ?? "The request could not be completed.",
      response.status,
      envelope?.errors,
    );
  }

  return envelope.data;
}

/**
 * A failed call is reported in exactly one place, so a form can hand the API's
 * own field messages to its inputs and a toast can quote the API's own sentence
 * without every caller re-testing the error type.
 */
export const apiMessage = (error: unknown, fallback: string): string =>
  error instanceof ApiError ? error.message : fallback;

export const apiFieldErrors = (error: unknown): FieldErrors | undefined =>
  error instanceof ApiError ? error.errors : undefined;

export interface RequestOptions {
  query?: QueryParams;
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Sign-in endpoints answer 401 as their normal "you are not signed in" reply,
 * so refreshing on their behalf would loop.
 */
const AUTH_ENDPOINTS = new Set([
  "/auth/login",
  "/auth/refresh",
  "/auth/logout",
  "/auth/me",
]);

async function send(
  method: string,
  path: string,
  { query, body, signal }: RequestOptions = {},
): Promise<Response> {
  try {
    return await fetch(buildUrl(API_URL, path, query), {
      method,
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      // The session lives in httpOnly cookies, so every call must carry them.
      credentials: "include",
      // List pages are filtered by URL; a cached response would show stale rows.
      cache: "no-store",
      signal,
    });
  } catch {
    throw new ApiError("Cannot reach the API. Check that the backend is running.", 0);
  }
}

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Rotates the session from the refresh cookie, at most once at a time. Two
 * parallel 401s must not both present the same refresh token: the API reads a
 * replay as theft and revokes the whole family, signing the user out everywhere.
 */
export function refreshSession(): Promise<boolean> {
  refreshInFlight ??= send("POST", "/auth/refresh")
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

type SessionListener = () => void;
const sessionLostListeners = new Set<SessionListener>();

/** Lets the auth provider drop its user state without the transport importing React. */
export function onSessionLost(listener: SessionListener): () => void {
  sessionLostListeners.add(listener);
  return () => sessionLostListeners.delete(listener);
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  let response = await send(method, path, options);

  if (response.status === 401 && !AUTH_ENDPOINTS.has(path)) {
    // A 401 is raised by the auth middleware before any controller runs, so the
    // rejected mutation never happened and replaying it is safe.
    if (await refreshSession()) {
      response = await send(method, path, options);
    }
    if (response.status === 401) {
      for (const listener of sessionLostListeners) listener();
    }
  }

  return unwrap<T>(response);
}

export const apiClient = {
  get: <T>(path: string, query?: QueryParams, signal?: AbortSignal) =>
    request<T>("GET", path, { query, signal }),
  post: <T>(path: string, body?: unknown, query?: QueryParams) =>
    request<T>("POST", path, { body, query }),
  patch: <T>(path: string, body?: unknown, query?: QueryParams) =>
    request<T>("PATCH", path, { body, query }),
  delete: <T>(path: string, query?: QueryParams) =>
    request<T>("DELETE", path, { query }),
} as const;
