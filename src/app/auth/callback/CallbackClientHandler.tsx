"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginButton } from "@/components/LoginButton";

interface CallbackClientHandlerProps {
  error?: string;
  status?: string;
}

export function CallbackClientHandler({
  error,
  status,
}: CallbackClientHandlerProps) {
  const router = useRouter();

  useEffect(() => {
    // If opened as a popup dialog, postMessage to opener and auto-close
    if (window.opener) {
      if (error) {
        window.opener.postMessage(
          { type: "SWIGGY_AUTH_ERROR", error },
          window.location.origin
        );
      } else {
        window.opener.postMessage(
          { type: "SWIGGY_AUTH_SUCCESS" },
          window.location.origin
        );
        setTimeout(() => {
          window.close();
        }, 250);
      }
    } else if (!error) {
      // Direct navigation fallback (non-popup): auto-navigate to /chat
      const timer = setTimeout(() => {
        router.push("/chat");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [error, status, router]);

  if (error) {
    return (
      <div className="w-full max-w-md p-8 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 shadow-md">
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="text-xl font-bold text-red-700 dark:text-red-400">
          Authentication Failed
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 mb-6">
          {decodeURIComponent(error)}
        </p>
        <div className="flex flex-col gap-3">
          <LoginButton label="Try Connecting Again" />
          <Link
            href="/"
            className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 underline"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg">
      <div className="w-12 h-12 bg-orange-100 dark:bg-orange-950/40 text-orange-600 rounded-full mx-auto flex items-center justify-center text-2xl mb-4">
        🛵
      </div>
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
        {status === "success"
          ? "Connected Successfully!"
          : "Completing Swiggy Login..."}
      </h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 mb-6">
        Setting up your secure session with Swiggy MCP.
      </p>

      <Link
        href="/chat"
        className="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-sm"
      >
        Proceed to Chat
      </Link>
    </div>
  );
}

export default CallbackClientHandler;
