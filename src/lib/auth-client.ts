import { apiClient, refreshSession } from "./api-client";
import type { LoginPayload, SessionResponse, SessionUser } from "@/types/auth";

/** Browser-side session calls. Tokens stay in httpOnly cookies, so the only
 *  thing these return is who is signed in. */
export const fetchSessionUser = async (
  signal?: AbortSignal,
): Promise<SessionUser> => {
  const data = await apiClient.get<SessionResponse>("/auth/me", undefined, signal);
  return data.user;
};

export const postLogin = async (payload: LoginPayload): Promise<SessionUser> => {
  const data = await apiClient.post<SessionResponse>("/auth/login", payload);
  return data.user;
};

export const postRefresh = (): Promise<boolean> => refreshSession();

export const postLogout = async (): Promise<void> => {
  await apiClient.post<null>("/auth/logout");
};
