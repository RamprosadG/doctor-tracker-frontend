import { createContext } from "react";
import type { LoginPayload, SessionUser } from "@/types/auth";

export interface AuthContextValue {
  user: SessionUser | null;
  /** True only until the first `/auth/me` round trip settles. */
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<SessionUser>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
