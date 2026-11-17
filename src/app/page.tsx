import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getValidAccessToken } from "@/lib/token-manager";
import { LoginButton } from "@/components/LoginButton";

// Marks this route dynamic to allow server-side auth checking and instant redirect
export const instant = false;

export default async function HomePage() {
  // Signal request-time execution to Next.js before dynamic timestamp/cookie checks
  await connection();

  // If user has an active, valid (or refreshable) session, redirect directly to /chat
  const validToken = await getValidAccessToken();

  if (validToken) {
    redirect("/chat");
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6 md:p-12 max-w-5xl mx-auto w-full relative">
      {/* Background Soft Glow */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="w-[500px] h-[500px] bg-orange-500/10 dark:bg-orange-500/15 rounded-full blur-3xl opacity-80" />
      </div>

      {/* Live Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/5 dark:bg-zinc-800/80 border border-zinc-200/90 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-200 text-xs font-semibold tracking-wide mb-8 shadow-2xs backdrop-blur-xs">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span>Model Context Protocol (MCP) • Active</span>
      </div>

      {/* Main Hero */}
      <div className="text-center space-y-4 max-w-2xl">
        {/* Official High-Contrast Swiggy Brand Icon */}
        <div className="w-20 h-20 rounded-3xl bg-[#FC8019] text-white mx-auto flex items-center justify-center shadow-xl shadow-orange-500/30 ring-4 ring-orange-500/15 dark:ring-orange-500/25 transition-transform hover:scale-105 duration-200 mb-3">
          <svg
            viewBox="0 0 24 24"
            className="w-11 h-11 fill-white drop-shadow-xs"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Swiggy Logo"
          >
            <path d="M12.878 5.928a.297.297 0 0 1 .314.335l.003.276c.001.593-.002 1.185.002 1.777c.004.434.08.517.5.57a15 15 0 0 0 3.148-.046a5 5 0 0 0 1.573-.374a.507.507 0 0 0 .344-.603a6.83 6.83 0 0 0-5.343-5.71a6.6 6.6 0 0 0-3.648.242a6.7 6.7 0 0 0-2.694 1.752A6.27 6.27 0 0 0 5.23 8.432a11.2 11.2 0 0 0 1.526 5.517a1.34 1.34 0 0 0 1.33.748c.653-.016 1.307-.004 1.96-.004v-.003h2.084c.25 0 .447.06.445.372c-.005.726 0 1.45-.003 2.176c-.002.22-.064.432-.326.434c-.264.002-.327-.209-.33-.43c-.005-.347 0-.694 0-1.041c0-.451-.073-.557-.523-.64a7.7 7.7 0 0 0-2.348-.02a2.6 2.6 0 0 0-.8.196c-.212.1-.296.245-.193.467c.107.231.206.467.333.688a44 44 0 0 0 3.426 4.956c.154.199.273.203.431.01c.349-.426.715-.839 1.06-1.268a34 34 0 0 0 3.577-5.26a14.2 14.2 0 0 0 1.494-3.871a1.203 1.203 0 0 0-1.012-1.635a7 7 0 0 0-1.67-.162c-.909-.006-1.818-.003-2.727-.002c-.245 0-.427-.07-.427-.358q-.002-1.516.002-3.033c0-.216.104-.349.339-.34" />
          </svg>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 text-balance">
          Swiggy{" "}
          <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
            MCP Assistant
          </span>
        </h1>
        <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 text-pretty max-w-xl mx-auto leading-relaxed">
          Your personal AI dining concierge. Check your saved delivery addresses, discover top-rated dishes, and interact with Swiggy in real-time.
        </p>
      </div>

      {/* Action CTA */}
      <div className="mt-8 flex flex-col items-center gap-3 w-full max-w-sm">
        <LoginButton label="Connect Swiggy with OAuth + PKCE" />
        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          Secure PKCE authentication • Instant popup sign-in
        </span>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-16 w-full text-left">
        <div className="p-5 sm:p-6 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/70 backdrop-blur-md shadow-xs hover:border-orange-500/40 hover:shadow-md transition-all duration-150 group">
          <div className="w-11 h-11 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/20 flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform duration-150 shadow-2xs">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">
            Saved Address Intelligence
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed text-pretty">
            Understands your delivery locations like &quot;Home&quot; or &quot;Office&quot; with 30-minute smart caching.
          </p>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/70 backdrop-blur-md shadow-xs hover:border-amber-500/40 hover:shadow-md transition-all duration-150 group">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform duration-150 shadow-2xs">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m-8.5 6a8.5 8.5 0 0017 0H3.5zM4 17h16a1 1 0 011 1v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-1a1 1 0 011-1z" />
            </svg>
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">
            Smart Food Search
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed text-pretty">
            Search cravings, cuisines, and top-rated restaurants with live ratings, ETA, and price estimates.
          </p>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/70 backdrop-blur-md shadow-xs hover:border-emerald-500/40 hover:shadow-md transition-all duration-150 group">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform duration-150 shadow-2xs">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">
            Secure PKCE OAuth
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed text-pretty">
            Full PKCE Authorization Code flow with HTTP-only cookies and automatic token refresh.
          </p>
        </div>
      </div>
    </main>
  );
}
