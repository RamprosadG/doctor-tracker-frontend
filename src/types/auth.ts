/** The signed-in portal user, as returned by `GET /auth/me`. */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "admin";
}

export interface LoginPayload {
  email: string;
  password: string;
}

/** Response of `POST /auth/login` and `POST /auth/refresh`: the cookies carry
 *  the tokens, the body only tells the client who is signed in. */
export interface SessionResponse {
  user: SessionUser;
}
