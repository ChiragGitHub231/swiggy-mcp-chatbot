"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface LoginButtonProps {
  className?: string;
  label?: string;
}

export function LoginButton({
  className = "",
  label = "Connect Swiggy Account",
}: LoginButtonProps) {
  const [mobile, setMobile] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin for security
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "SWIGGY_AUTH_SUCCESS") {
        setIsOpen(false);
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.close();
        }
        router.push("/chat");
      } else if (event.data?.type === "SWIGGY_AUTH_ERROR") {
        setIsOpen(false);
        setError(event.data.error || "Authentication failed");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [router]);

  const openPopup = () => {
    setError(null);
    setIsOpen(true);

    const width = 500;
    const height = 660;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const trimmedMobile = mobile.trim().replace(/[^\d]/g, "");
    const loginUrl =
      trimmedMobile.length >= 10
        ? `/api/auth/login?phone=${encodeURIComponent(trimmedMobile)}`
        : "/api/auth/login";

    const popup = window.open(
      loginUrl,
      "SwiggyLoginPopup",
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`
    );

    popupRef.current = popup;

    // Fallback if popup is blocked by the browser
    if (!popup || popup.closed || typeof popup.closed === "undefined") {
      router.push(loginUrl);
      return;
    }

    popup.focus();

    // Check periodically if the user closed the popup manually
    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        setIsOpen(false);
      }
    }, 600);
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-sm">
      {/* Optional phone input to auto-associate the OTP mobile number */}
      <div className="flex items-center gap-2.5 bg-white dark:bg-zinc-800 border-2 border-orange-200 dark:border-zinc-700 focus-within:border-orange-500 rounded-2xl px-4 py-3 w-full shadow-xs transition-all">
        <span className="text-sm font-bold text-orange-600 dark:text-orange-400 shrink-0">
          🇮🇳 +91
        </span>
        <input
          type="tel"
          maxLength={10}
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/[^\d]/g, ""))}
          placeholder="Enter Swiggy mobile number"
          className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none font-mono font-medium"
        />
      </div>

      <button
        onClick={openPopup}
        disabled={isOpen}
        className={`w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 transition-all shadow-md hover:shadow-lg disabled:opacity-75 disabled:cursor-wait cursor-pointer ${className}`}
      >
        {isOpen ? (
          <>
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <span>Waiting for Swiggy OTP sign-in...</span>
          </>
        ) : (
          <>
            <span className="text-xl">🛵</span>
            <span>{label}</span>
          </>
        )}
      </button>

      {/* Status indicator while popup is open */}
      {isOpen && (
        <div className="flex items-center gap-2 text-xs text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-3 py-1.5 rounded-xl border border-orange-200 dark:border-orange-900/50 animate-pulse text-center">
          <span className="w-2 h-2 rounded-full bg-orange-500 inline-block shrink-0" />
          <span>Swiggy sign-in opened in popup. Enter your OTP in the popup.</span>
        </div>
      )}

      {/* Error display if authentication reported error */}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

export default LoginButton;
