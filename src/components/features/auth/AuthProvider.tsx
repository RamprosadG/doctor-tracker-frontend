"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./auth-context";
import { onSessionLost } from "@/lib/api-client";
import { fetchSessionUser, postLogin, postLogout } from "@/lib/auth-client";
import type { LoginPayload, SessionUser } from "@/types/auth";

/**
 * A full reload rather than a client redirect: the server guards must re-run,
 * and the Router Cache has to go, or pressing Back replays a signed-out page.
 */
function goToLogin() {
  const { pathname, search } = window.location;
  if (pathname === "/login") return;
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- the reload is the point
  window.location.assign(`/login?next=${encodeURIComponent(`${pathname}${search}`)}`);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // The cookies are httpOnly, so a reload can only learn who is signed in by
  // asking. A 401 here means "nobody is home", not an error to report.
  useEffect(() => {
    let active = true;

    fetchSessionUser()
      .then((sessionUser) => {
        if (active) setUser(sessionUser);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, []);

  // Any call that still answers 401 after a rotation means the session is gone.
  useEffect(
    () =>
      onSessionLost(() => {
        setUser(null);
        goToLogin();
      }),
    [],
  );

  const login = useCallback(async (payload: LoginPayload) => {
    const signedIn = await postLogin(payload);
    setUser(signedIn);
    return signedIn;
  }, []);

  const logout = useCallback(async () => {
    // Clear locally first: if the API is unreachable the user must still end up
    // signed out in this tab rather than stuck inside a dead session.
    setUser(null);
    try {
      await postLogout();
    } finally {
      goToLogin();
    }
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
