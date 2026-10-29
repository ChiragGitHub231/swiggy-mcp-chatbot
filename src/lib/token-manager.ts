import { getSession, setSession, clearSession, UserSession } from "./auth";
import { getOAuthConfig } from "./oauth";

const EXPIRATION_BUFFER_MS = 60 * 1000; // 1 minute safety buffer

/**
 * Checks if a token is expired or close to expiring
 */
export function isTokenExpired(
  expiresAt: number,
  bufferMs: number = EXPIRATION_BUFFER_MS
): boolean {
  return Date.now() + bufferMs >= expiresAt;
}

/**
 * Refreshes an access token using the refresh token
 */
export async function refreshSwiggyToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken?: string; expiresAt: number }> {
  const config = getOAuthConfig();

  // Development/mock fallback
  if (
    !config.clientId ||
    config.clientId === "your_client_id" ||
    (process.env.NODE_ENV === "development" && refreshToken.startsWith("swiggy_mock_"))
  ) {
    return {
      accessToken: `swiggy_mock_token_refreshed_${Date.now()}`,
      refreshToken: `swiggy_mock_refresh_${Date.now()}`,
      expiresAt: Date.now() + 3600 * 1000,
    };
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: config.clientId,
  });

  if (config.clientSecret) {
    body.set("client_secret", config.clientSecret);
  }

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token refresh failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };
}

/**
 * Obtains a valid access token for the current session.
 * - If the access token is expired, automatically generates a new one using the refresh token.
 * - If the refresh token is expired, invalid, or fails, automatically logs the user out by clearing the session cookie.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const session = await getSession();

  if (!session || !session.accessToken) {
    return null;
  }

  // If token is still fresh, return it
  if (!isTokenExpired(session.expiresAt)) {
    return session.accessToken;
  }

  // If access token is expired and we have a refresh token, try refreshing
  if (session.refreshToken) {
    try {
      const refreshed = await refreshSwiggyToken(session.refreshToken);
      const updatedSession: UserSession = {
        ...session,
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken || session.refreshToken,
        expiresAt: refreshed.expiresAt,
      };

      await setSession(updatedSession);
      return refreshed.accessToken;
    } catch (err) {
      console.warn("Refresh token expired or invalid. Logging user out:", err);
      // Refresh token is expired or revoked -> clear cookie to logout
      await clearSession();
      return null;
    }
  }

  // Access token expired and no refresh token available -> clear cookie to logout
  await clearSession();
  return null;
}
