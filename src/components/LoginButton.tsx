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

    const loginUrl = "/api/auth/login";

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
      <button
        onClick={openPopup}
        disabled={isOpen}
        className={`w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-semibold text-sm text-white bg-orange-600 hover:bg-orange-500 active:scale-[0.98] transition-all duration-150 shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 cursor-pointer disabled:opacity-75 disabled:cursor-wait ${className}`}
      >
        {isOpen ? (
          <>
            <svg
              className="animate-spin h-4 w-4 text-white"
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
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 fill-white shrink-0 drop-shadow-xs"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M12.878 5.928a.297.297 0 0 1 .314.335l.003.276c.001.593-.002 1.185.002 1.777c.004.434.08.517.5.57a15 15 0 0 0 3.148-.046a5 5 0 0 0 1.573-.374a.507.507 0 0 0 .344-.603a6.83 6.83 0 0 0-5.343-5.71a6.6 6.6 0 0 0-3.648.242a6.7 6.7 0 0 0-2.694 1.752A6.27 6.27 0 0 0 5.23 8.432a11.2 11.2 0 0 0 1.526 5.517a1.34 1.34 0 0 0 1.33.748c.653-.016 1.307-.004 1.96-.004v-.003h2.084c.25 0 .447.06.445.372c-.005.726 0 1.45-.003 2.176c-.002.22-.064.432-.326.434c-.264.002-.327-.209-.33-.43c-.005-.347 0-.694 0-1.041c0-.451-.073-.557-.523-.64a7.7 7.7 0 0 0-2.348-.02a2.6 2.6 0 0 0-.8.196c-.212.1-.296.245-.193.467c.107.231.206.467.333.688a44 44 0 0 0 3.426 4.956c.154.199.273.203.431.01c.349-.426.715-.839 1.06-1.268a34 34 0 0 0 3.577-5.26a14.2 14.2 0 0 0 1.494-3.871a1.203 1.203 0 0 0-1.012-1.635a7 7 0 0 0-1.67-.162c-.909-.006-1.818-.003-2.727-.002c-.245 0-.427-.07-.427-.358q-.002-1.516.002-3.033c0-.216.104-.349.339-.34" />
            </svg>
            <span>{label}</span>
          </>
        )}
      </button>

      {/* Status indicator while popup is open */}
      {isOpen && (
        <div className="flex items-center gap-2 text-xs text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 px-3.5 py-1.5 rounded-full border border-orange-200/80 dark:border-orange-800/60 animate-pulse text-center">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block shrink-0" />
          <span>Swiggy sign-in opened in popup. Enter your OTP in the popup.</span>
        </div>
      )}

      {/* Error display if authentication reported error */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-900/40 w-full text-center justify-center">
          <span>⚠️ {error}</span>
        </div>
      )}
    </div>
  );
}

export default LoginButton;
