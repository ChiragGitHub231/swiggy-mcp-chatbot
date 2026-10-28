import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  await clearSession();

  const redirectUrl = new URL("/", request.url);
  return NextResponse.redirect(redirectUrl.toString());
}

export async function POST() {
  await clearSession();
  return NextResponse.json({ success: true, message: "Logged out successfully" });
}

