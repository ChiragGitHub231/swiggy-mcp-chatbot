import { cookies } from "next/headers";
import fs from "fs";
import path from "path";

export const SESSION_COOKIE_NAME = "swiggy_session";
export const STATE_COOKIE_NAME = "swiggy_oauth_state";
export const VERIFIER_COOKIE_NAME = "swiggy_oauth_verifier";
export const PHONE_COOKIE_NAME = "swiggy_oauth_phone";

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

export function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      return JSON.parse(
        Buffer.from(parts[1], "base64url").toString("utf-8")
      );
    }
  } catch {
    // Non-JWT token
  }
  return null;
}

// Blacklisted keys that must NEVER be parsed as phone numbers (e.g. UNIX timestamps, tokens)
const IGNORED_KEYS = /^(exp|iat|nbf|auth_time|expires_in|date|time|created_at|updated_at|v|version|nonce|code|state)$/i;

export function cleanPhoneNumber(raw: unknown): string | undefined {
  if (!raw || (typeof raw !== "string" && typeof raw !== "number")) return undefined;
  const str = String(raw).trim();

  // Reject the specific UNIX timestamp that was mistakenly formatted as a phone number
  if (str.includes("1793294256") || str.includes("17932 94256")) {
    return undefined;
  }

  // Reject UNIX epoch timestamps (10-digit numbers starting with 16, 17, 18, 19)
  const allDigits = str.replace(/[^\d]/g, "");
  if (/^1[6-9]\d{8}$/.test(allDigits)) {
    return undefined;
  }

  // Support masked phone numbers from Swiggy API (e.g. +91 •••• ••0900 or ****0900)
  if (str.includes("•") || str.includes("*")) {
    if (allDigits.length >= 3) {
      const suffix = allDigits.slice(-4);
      return `+91 •••• ••${suffix}`;
    }
  }

  const digits = allDigits;

  // Indian mobile numbers MUST start with 6, 7, 8, or 9 and be exactly 10 digits
  if (/^[6-9]\d{9}$/.test(digits)) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  // 12-digit Indian mobile number with 91 prefix (91 followed strictly by 6, 7, 8, or 9)
  if (/^91[6-9]\d{9}$/.test(digits)) {
    const num = digits.slice(2);
    return `+91 ${num.slice(0, 5)} ${num.slice(5)}`;
  }

  // If string explicitly starts with +91, the remaining 10 digits MUST start with 6-9
  if (str.startsWith("+91")) {
    const after91 = digits.startsWith("91") ? digits.slice(2) : digits;
    if (/^[6-9]\d{9}$/.test(after91)) {
      return `+91 ${after91.slice(0, 5)} ${after91.slice(5)}`;
    }
    return undefined; // Invalid Indian number starting with 0-5
  }

  // International format with explicit '+' prefix (non-Indian)
  if (str.startsWith("+") && /^\+[1-8]\d{9,14}$/.test(str.replace(/\s+/g, ""))) {
    return str.replace(/\s+/g, " ");
  }

  return undefined;
}

/**
 * Recursively searches any object, array, or JWT string for a valid mobile number
 * ignoring timestamps and non-phone numeric fields.
 */
export function deepFindPhone(data: unknown, visited = new Set()): string | undefined {
  if (!data || visited.has(data)) return undefined;

  if (typeof data === "string") {
    // If it's a JWT string (3 parts)
    if (data.split(".").length === 3) {
      const jwtPayload = parseJwt(data);
      if (jwtPayload) {
        const found = deepFindPhone(jwtPayload, visited);
        if (found) return found;
      }
    }

    const phone = cleanPhoneNumber(data);
    if (phone) return phone;

    return undefined;
  }

  // Never treat a bare number as a phone to avoid interpreting timestamps as phone numbers
  if (typeof data === "number") {
    return undefined;
  }

  if (typeof data === "object") {
    visited.add(data);

    const entries = Object.entries(data as Record<string, unknown>);

    // 1. First priority: explicit phone, mobile, contact keys
    const phoneKeys = entries.filter(([k]) =>
      /phone|mobile|contact/i.test(k) && !IGNORED_KEYS.test(k)
    );
    for (const [, val] of phoneKeys) {
      const phone = cleanPhoneNumber(val);
      if (phone) return phone;
      const found = deepFindPhone(val, visited);
      if (found) return found;
    }

    // 2. Second priority: identity / subject keys
    const identityKeys = entries.filter(([k]) =>
      /^(sub|user_id|userId|login_id|username)$/i.test(k) && !IGNORED_KEYS.test(k)
    );
    for (const [, val] of identityKeys) {
      const phone = cleanPhoneNumber(val);
      if (phone) return phone;
    }

    // 3. Third priority: nested user/profile objects
    const userObjects = entries.filter(([k]) =>
      /^(user|profile|customer|account)$/i.test(k) && !IGNORED_KEYS.test(k)
    );
    for (const [, val] of userObjects) {
      const found = deepFindPhone(val, visited);
      if (found) return found;
    }

    // 4. Any other non-ignored keys
    for (const [k, val] of entries) {
      if (!IGNORED_KEYS.test(k)) {
        const found = deepFindPhone(val, visited);
        if (found) return found;
      }
    }
  }

  return undefined;
}

/**
 * Automatically discovers user mobile number from tokens, JWT payloads,
 * userinfo endpoints, or Swiggy MCP address tools.
 */
export async function resolveUserFromTokens(
  tokens: Record<string, unknown>
): Promise<{ phone?: string; name?: string } | undefined> {
  const accessToken =
    (typeof tokens.access_token === "string" && tokens.access_token) ||
    (typeof tokens.accessToken === "string" && tokens.accessToken) ||
    "";

  // Dump debug info for inspection
  try {
    const debugDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\9bc137c3-a4f8-430b-a852-339a168e5a4d\\scratch";
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }
    const tokenPayload = accessToken ? parseJwt(accessToken) : null;
    fs.writeFileSync(
      path.join(debugDir, "token_debug.json"),
      JSON.stringify(
        {
          tokenKeys: Object.keys(tokens),
          accessToken: accessToken,
          accessTokenPayload: tokenPayload,
          tokenUser: tokens.user,
        },
        null,
        2
      )
    );
  } catch (err) {
    console.error("Failed to write token debug file:", err);
  }

  let phone = deepFindPhone(tokens);
  let name: string | undefined;

  if (tokens.user && typeof tokens.user === "object") {
    const u = tokens.user as Record<string, unknown>;
    name = (typeof u.name === "string" ? u.name : undefined);
  }

  // If not found in tokens directly, attempt to fetch from Swiggy userinfo or MCP addresses
  if (!phone && accessToken) {
    try {
      const res = await fetch("https://mcp.swiggy.com/auth/userinfo", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });
      if (res.ok) {
        const info = await res.json();
        console.log("[Swiggy Auth] Userinfo Response:", info);
        phone = deepFindPhone(info);
        name = name || (typeof info.name === "string" ? info.name : undefined);
      }
    } catch {
      // Ignore userinfo failure
    }

    if (!phone) {
      try {
        const mcpUrl = process.env.SWIGGY_MCP_SERVER_URL || "https://mcp.swiggy.com/food";
        const mcpRes = await fetch(mcpUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json, text/event-stream",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "tools/call",
            params: {
              name: "get_addresses",
              arguments: { page: 1, pageSize: 5 },
            },
            id: Date.now(),
          }),
        });

        if (mcpRes.ok) {
          const mcpData = await mcpRes.json();
          const addresses = mcpData?.result?.structuredContent?.addresses;
          if (Array.isArray(addresses) && addresses.length > 0) {
            const firstAddr = addresses[0];
            // Extract user name from "Name: Address..."
            if (firstAddr.addressLine && typeof firstAddr.addressLine === "string") {
              const parts = firstAddr.addressLine.split(":");
              if (parts.length > 1 && parts[0].trim()) {
                name = parts[0].trim();
              }
            }
            // Extract phone number or masked number
            if (firstAddr.phoneNumber && typeof firstAddr.phoneNumber === "string") {
              const rawNum = firstAddr.phoneNumber.trim();
              if (rawNum.includes("*")) {
                phone = `+91 •••• ••${rawNum.replace(/[^\d]/g, "")}`;
              } else {
                phone = cleanPhoneNumber(rawNum);
              }
            }
          }
        }
      } catch (err) {
        console.warn("[Swiggy Auth] Failed to fetch user addresses from MCP:", err);
      }
    }
  }

  console.log("[Swiggy Auth] Final Resolved Phone:", phone || "None");

  if (phone || name) {
    return {
      phone,
      name: name || "Swiggy User",
    };
  }

  return undefined;
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
 * Stores temporary PKCE verifier, state, and optional mobile number for OAuth flow
 */
export async function setOAuthTempCookies(
  state: string,
  verifier: string,
  phone?: string
): Promise<void> {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  const maxAge = 10 * 60; // 10 minutes

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

  if (phone) {
    cookieStore.set(PHONE_COOKIE_NAME, phone, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge,
    });
  }
}

/**
 * Retrieves and clears temporary PKCE verifier, state, and phone
 */
export async function consumeOAuthTempCookies(): Promise<{
  state: string | null;
  verifier: string | null;
  phone: string | null;
}> {
  const cookieStore = await cookies();
  const state = cookieStore.get(STATE_COOKIE_NAME)?.value || null;
  const verifier = cookieStore.get(VERIFIER_COOKIE_NAME)?.value || null;
  const phone = cookieStore.get(PHONE_COOKIE_NAME)?.value || null;

  cookieStore.delete(STATE_COOKIE_NAME);
  cookieStore.delete(VERIFIER_COOKIE_NAME);
  cookieStore.delete(PHONE_COOKIE_NAME);

  return { state, verifier, phone };
}
