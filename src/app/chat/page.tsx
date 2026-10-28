import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ChatWindow } from "@/components/ChatWindow";

export default async function ChatPage() {
  const session = await getSession();

  // If no active session, redirect to home to login
  if (!session?.accessToken) {
    redirect("/");
  }

  return (
    <main className="flex-1 p-2 md:p-6 flex flex-col justify-center">
      <ChatWindow
        userPhone={session.user?.phone}
      />
    </main>
  );
}

