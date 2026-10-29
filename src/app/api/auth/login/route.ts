import { NextRequest, NextResponse } from "next/server";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  buildAuthorizationUrl,
  getOAuthConfig,
} from "@/lib/oauth";
import { setOAuthTempCookies } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const config = getOAuthConfig();
    const searchParams = request.nextUrl.searchParams;
    const phone = searchParams.get("phone") || undefined;

    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();

    // Store verifier, state, and optional phone in temporary HTTP-only cookies
    await setOAuthTempCookies(state, codeVerifier, phone);

    // If client ID is not configured yet, direct to dev/demo callback immediately
    if (!config.clientId || config.clientId === "your_client_id") {
      const callbackUrl = new URL("/api/auth/callback", request.url);
      callbackUrl.searchParams.set("code", `dev_code_${Date.now()}`);
      callbackUrl.searchParams.set("state", state);
      return NextResponse.redirect(callbackUrl.toString());
    }

    const authUrl = buildAuthorizationUrl(
      state,
      codeChallenge,
      "openid profile phone read:orders write:orders read:profile",
      phone
    );

    // Return JSON if requested, otherwise redirect
    if (request.headers.get("accept")?.includes("application/json")) {
      return NextResponse.json({ url: authUrl });
    }

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("OAuth Login initiation failed:", error);
    return NextResponse.json(
      { error: "Failed to initiate OAuth login" },
      { status: 500 }
    );
  }
}
