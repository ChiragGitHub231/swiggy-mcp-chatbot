import { NextRequest, NextResponse } from "next/server";
import { getSession, setSession, cleanPhoneNumber } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    user: session.user || null,
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const formattedPhone = cleanPhoneNumber(body.phone);

    const updatedUser = {
      ...session.user,
      phone: formattedPhone || session.user?.phone,
      name: body.name || session.user?.name || "Swiggy User",
    };

    const updatedSession = {
      ...session,
      user: updatedUser,
    };

    await setSession(updatedSession);

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 400 }
    );
  }
}

