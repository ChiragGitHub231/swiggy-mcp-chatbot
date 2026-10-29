import { NextRequest, NextResponse } from "next/server";
import {
  consumeOAuthTempCookies,
  setSession,
  UserSession,
  resolveUserFromTokens,
  cleanPhoneNumber,
} from "@/lib/auth";
import { exchangeCodeForTokens } from "@/lib/oauth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle provider error callback
  if (error) {
    console.error("OAuth error received:", error, errorDescription);
    const errorRedirect = new URL("/auth/callback", request.url);
    errorRedirect.searchParams.set("error", errorDescription || error);
    return NextResponse.redirect(errorRedirect.toString());
  }

  if (!code) {
    const errorRedirect = new URL("/auth/callback", request.url);
    errorRedirect.searchParams.set("error", "Missing authorization code");
    return NextResponse.redirect(errorRedirect.toString());
  }

  try {
    // Consume and validate state, PKCE verifier, and optional phone
    const { state: savedState, verifier, phone: savedPhone } =
      await consumeOAuthTempCookies();

    // Verify state to protect against CSRF attacks
    if (savedState && state && savedState !== state) {
      const errorRedirect = new URL("/auth/callback", request.url);
      errorRedirect.searchParams.set("error", "Invalid OAuth state parameter");
      return NextResponse.redirect(errorRedirect.toString());
    }

    const codeVerifier = verifier || "dev_verifier_fallback";

    // Exchange authorization code for access and refresh tokens
    const tokens = await exchangeCodeForTokens(code, codeVerifier);

    // Automatically resolve user profile & mobile number used during OTP login
    const userProfile = await resolveUserFromTokens(tokens as Record<string, unknown>);

    const finalPhone = cleanPhoneNumber(savedPhone) || userProfile?.phone;

    const session: UserSession = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000,
      tokenType: tokens.token_type || "Bearer",
      user: {
        name: userProfile?.name || "Swiggy User",
        phone: finalPhone,
      },
    };

    // Store in secure HTTP-only cookie
    await setSession(session);

    // Redirect to callback status UI which handles popup closing & parent window notification
    const callbackUrl = new URL("/auth/callback", request.url);
    callbackUrl.searchParams.set("status", "success");
    return NextResponse.redirect(callbackUrl.toString());
  } catch (err) {
    console.error("Token exchange failed:", err);
    const errorRedirect = new URL("/auth/callback", request.url);
    errorRedirect.searchParams.set(
      "error",
      err instanceof Error ? err.message : "Failed to authenticate with Swiggy"
    );
    return NextResponse.redirect(errorRedirect.toString());
  }
}
