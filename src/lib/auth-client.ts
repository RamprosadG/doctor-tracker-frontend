import { apiClient, refreshSession } from "./api-client";
import type { LoginPayload, SessionResponse, SessionUser } from "@/types/auth";

let sessionUserInFlight: Promise<SessionUser> | null = null;

export function fetchSessionUser(): Promise<SessionUser> {
  // A bootstrap request can rotate cookies, so remounts must share it rather than abort or duplicate it.
  sessionUserInFlight ??= apiClient.get<SessionResponse>("/auth/me")
    .then((data) => data.user)
    .finally(() => {
      sessionUserInFlight = null;
    });
  return sessionUserInFlight;
}

export const postLogin = async (payload: LoginPayload): Promise<SessionUser> => {
  const data = await apiClient.post<SessionResponse>("/auth/login", payload);
  return data.user;
};

export const postRefresh = (): Promise<boolean> => refreshSession();

export const postLogout = async (): Promise<void> => {
  await apiClient.post<null>("/auth/logout");
};
