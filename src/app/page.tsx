import Link from "next/link";
import { getSession } from "@/lib/auth";
import { LoginButton } from "@/components/LoginButton";

export default async function HomePage() {
  const session = await getSession();
  const isLoggedIn = !!session?.accessToken;

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 max-w-4xl mx-auto w-full">
      {/* Brand Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 text-xs font-semibold uppercase tracking-wider mb-8">
        <span>Powered by Model Context Protocol (MCP)</span>
      </div>

      {/* Main Hero */}
      <div className="text-center space-y-4 max-w-2xl">
        <div className="w-20 h-20 bg-orange-600 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-orange-500/30 text-4xl mb-4">
          🛵
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Swiggy <span className="text-orange-600">MCP Chatbot</span>
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Your personal AI dining concierge. Track live delivery in real-time,
          browse your favorite dishes, and manage past Swiggy orders through natural conversation.
        </p>
      </div>

      {/* Action CTA */}
      <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
        {isLoggedIn ? (
          <>
            <Link
              href="/chat"
              className="px-8 py-3.5 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <span>Open Swiggy Chat</span>
              <span className="text-lg">→</span>
            </Link>
            <a
              href="/api/auth/logout"
              className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 underline"
            >
              Sign out
            </a>
          </>
        ) : (
          <LoginButton label="Connect Swiggy with OAuth + PKCE" />
        )}
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full text-left">
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm">
          <div className="text-2xl mb-2">📍</div>
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
            Live Order Tracking
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time delivery progress, ETA updates, and rider information directly in chat.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm">
          <div className="text-2xl mb-2">🍔</div>
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
            Smart Food Search
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Discover top-rated restaurants, cravings, and cuisine suggestions in your area.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm">
          <div className="text-2xl mb-2">🔐</div>
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
            Secure PKCE OAuth
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Standard PKCE OAuth authorization code flow with HTTP-only session cookies.
          </p>
        </div>
      </div>
    </main>
  );
}

