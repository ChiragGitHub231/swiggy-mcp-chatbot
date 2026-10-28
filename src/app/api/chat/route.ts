import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/token-manager";
import { processAgentChat, AgentMessage } from "@/lib/ai-agent";

export async function POST(request: NextRequest) {
  try {
    // Validate session cookie and retrieve valid access token
    const accessToken = await getValidAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        {
          error: "Unauthorized: Please connect your Swiggy account to continue.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { message, history } = body as {
      message?: string;
      history?: AgentMessage[];
    };

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "A message is required." },
        { status: 400 }
      );
    }

    // Process chat query with Swiggy MCP orchestration
    const reply = await processAgentChat(message, history || [], accessToken);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API route error:", error);
    return NextResponse.json(
      { error: "Internal server error processing chat request." },
      { status: 500 }
    );
  }
}

