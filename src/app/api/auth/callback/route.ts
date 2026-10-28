import { NextRequest, NextResponse } from "next/server";
import { consumeOAuthTempCookies, setSession, UserSession } from "@/lib/auth";
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
    // Consume and validate state and PKCE verifier
    const { state: savedState, verifier } = await consumeOAuthTempCookies();

    // Verify state to protect against CSRF attacks
    if (savedState && state && savedState !== state) {
      const errorRedirect = new URL("/auth/callback", request.url);
      errorRedirect.searchParams.set("error", "Invalid OAuth state parameter");
      return NextResponse.redirect(errorRedirect.toString());
    }

    const codeVerifier = verifier || "dev_verifier_fallback";

    // Exchange authorization code for access and refresh tokens
    const tokens = await exchangeCodeForTokens(code, codeVerifier);

    const session: UserSession = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000,
      tokenType: tokens.token_type || "Bearer",
      user: {
        name: "Swiggy User",
        phone: "+91 98765 43210",
      },
    };

    // Store in secure HTTP-only cookie
    await setSession(session);

    // Redirect to protected chat page
    const chatUrl = new URL("/chat", request.url);
    return NextResponse.redirect(chatUrl.toString());
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

