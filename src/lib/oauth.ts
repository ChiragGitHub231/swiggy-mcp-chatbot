import crypto from "crypto";

export interface OAuthConfig {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  authUrl: string;
  tokenUrl: string;
}

export function getOAuthConfig(): OAuthConfig {
  return {
    clientId: process.env.SWIGGY_CLIENT_ID || "",
    clientSecret: process.env.SWIGGY_CLIENT_SECRET || "",
    redirectUri:
      process.env.SWIGGY_REDIRECT_URI || "http://localhost:3000/api/auth/callback",
    authUrl:
      process.env.SWIGGY_AUTH_URL || "https://mcp.swiggy.com/auth/authorize",
    tokenUrl:
      process.env.SWIGGY_TOKEN_URL || "https://mcp.swiggy.com/auth/token",
  };
}

/**
 * Generates a cryptographically random string for PKCE code_verifier
 */
export function generateCodeVerifier(length: number = 64): string {
  return crypto
    .randomBytes(length)
    .toString("base64url")
    .slice(0, length);
}

/**
 * Generates SHA-256 base64url-encoded code_challenge from code_verifier
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
}

/**
 * Generates a random state string for CSRF protection
 */
export function generateState(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Constructs the Swiggy OAuth authorization URL with PKCE parameters
 */
export function buildAuthorizationUrl(
  state: string,
  codeChallenge: string,
  scope: string = "openid profile phone read:orders write:orders read:profile",
  loginHint?: string
): string {
  const config = getOAuthConfig();
  const url = new URL(config.authUrl);

  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("scope", scope);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");

  if (loginHint) {
    url.searchParams.set("login_hint", loginHint);
  }

  return url.toString();
}

export interface TokenExchangeResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
  user?: Record<string, unknown>;
  profile?: Record<string, unknown>;
  phone?: string;
  phone_number?: string;
  mobile?: string;
  sub?: string;
  [key: string]: unknown;
}

/**
 * Exchanges the authorization code and PKCE code_verifier for access and refresh tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<TokenExchangeResponse> {
  const config = getOAuthConfig();

  // If in local development and placeholder credentials are used, return mock token for testing
  if (
    !config.clientId ||
    config.clientId === "your_client_id" ||
    process.env.NODE_ENV === "development" && config.clientId.startsWith("mock")
  ) {
    return {
      access_token: `swiggy_mock_token_${Date.now()}`,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: `swiggy_mock_refresh_${Date.now()}`,
      scope: "read:orders write:orders read:profile",
    };
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    code_verifier: codeVerifier,
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
    throw new Error(
      `Failed to exchange code for tokens: ${response.status} - ${errorText}`
    );
  }

  return (await response.json()) as TokenExchangeResponse;
}

