import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "swiggy_session";
export const STATE_COOKIE_NAME = "swiggy_oauth_state";
export const VERIFIER_COOKIE_NAME = "swiggy_oauth_verifier";

export interface UserSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  tokenType?: string;
  user?: {
    id?: string;
    name?: string;
    phone?: string;
  };
}

/**
 * Retrieves the active user session from cookies
 */
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const raw = Buffer.from(sessionCookie.value, "base64").toString("utf-8");
    const session: UserSession = JSON.parse(raw);

    // Check if session has required fields
    if (!session.accessToken) {
      return null;
    }

    return session;
  } catch (error) {
    console.error("Failed to parse session cookie:", error);
    return null;
  }
}

/**
 * Saves the session into an HTTP-only secure cookie
 */
export async function setSession(session: UserSession): Promise<void> {
  const cookieStore = await cookies();
  const serialized = Buffer.from(JSON.stringify(session)).toString("base64");

  // Max age is aligned with token expiry or 7 days default
  const maxAge = session.expiresAt
    ? Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000))
    : 7 * 24 * 60 * 60;

  cookieStore.set(SESSION_COOKIE_NAME, serialized, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAge || 7 * 24 * 60 * 60,
  });
}

/**
 * Clears the session cookie
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Stores temporary PKCE verifier and state for OAuth flow
 */
export async function setOAuthTempCookies(
  state: string,
  verifier: string
): Promise<void> {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";

  // Expire in 10 minutes
  const maxAge = 10 * 60;

  cookieStore.set(STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  cookieStore.set(VERIFIER_COOKIE_NAME, verifier, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

/**
 * Retrieves and clears temporary PKCE verifier and state
 */
export async function consumeOAuthTempCookies(): Promise<{
  state: string | null;
  verifier: string | null;
}> {
  const cookieStore = await cookies();
  const state = cookieStore.get(STATE_COOKIE_NAME)?.value || null;
  const verifier = cookieStore.get(VERIFIER_COOKIE_NAME)?.value || null;

  cookieStore.delete(STATE_COOKIE_NAME);
  cookieStore.delete(VERIFIER_COOKIE_NAME);

  return { state, verifier };
}

