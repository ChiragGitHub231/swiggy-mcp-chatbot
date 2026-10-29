import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getValidAccessToken } from "@/lib/token-manager";
import { getSession, resolveUserFromTokens, cleanPhoneNumber } from "@/lib/auth";
import { ChatWindow } from "@/components/ChatWindow";

// Marks this protected route as dynamic/server-blocking for Next.js Cache Components
export const instant = false;

export default async function ChatPage() {
  // Signal request-time execution to Next.js
  await connection();

  // Ensures access token is valid (or auto-refreshed). If refresh token expired, clears cookie & returns null.
  const validToken = await getValidAccessToken();

  // If no active or refreshable session, redirect to home to login
  if (!validToken) {
    redirect("/");
  }

  const session = await getSession();

  let userName = session?.user?.name;
  let userPhone = cleanPhoneNumber(session?.user?.phone);

  // If name or phone is not yet populated, dynamically fetch from Swiggy MCP
  if ((!userName || !userPhone || userName === "Swiggy User") && validToken) {
    try {
      const resolved = await resolveUserFromTokens({
        access_token: validToken,
        user: session?.user,
      });
      if (resolved?.name) {
        userName = resolved.name;
      }
      if (resolved?.phone) {
        userPhone = cleanPhoneNumber(resolved.phone);
      }
    } catch (e) {
      console.warn("Failed to dynamically fetch Swiggy user profile:", e);
    }
  }

  return (
    <main className="h-screen w-full flex flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <ChatWindow
        userName={userName || "Swiggy User"}
        userPhone={userPhone}
      />
    </main>
  );
}
