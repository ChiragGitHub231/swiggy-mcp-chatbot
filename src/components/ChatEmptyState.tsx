"use client";

import React, { useState, useEffect } from "react";

interface ChatEmptyStateProps {
  userName?: string;
  onSelectQuestion: (question: string) => void;
}

export const SUGGESTED_QUESTIONS = [
  "What are my registered delivery addresses?",
  "Find top-rated noodles near my address",
  "Search popular burgers and fast food joints",
  "Craving cheese pizza! Where can I order?",
  "Show best biryani places delivering now",
];

export function ChatEmptyState({
  userName,
  onSelectQuestion,
}: ChatEmptyStateProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  // Transition effect: switches every 2.4 seconds with a smooth fade
  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % SUGGESTED_QUESTIONS.length);
        setIsFading(false);
      }, 300);
    }, 2400);

    return () => clearInterval(interval);
  }, []);

  const activeQuestion = SUGGESTED_QUESTIONS[currentIndex];
  const displayName =
    userName && userName !== "Swiggy User" ? userName : "Foodie";

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 max-w-2xl mx-auto my-auto select-none">
      {/* 1. Greeting Message with Swiggy Brand Icon */}
      <div className="mb-2 flex flex-col items-center">
        <div className="w-16 h-16 rounded-3xl bg-[#FC8019] text-white flex items-center justify-center shadow-lg shadow-orange-500/25 ring-4 ring-orange-500/15 dark:ring-orange-500/25 mb-3 transition-transform hover:scale-105 duration-200">
          <svg
            viewBox="0 0 24 24"
            className="w-9 h-9 fill-white drop-shadow-xs"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Swiggy Logo"
          >
            <path d="M12.878 5.928a.297.297 0 0 1 .314.335l.003.276c.001.593-.002 1.185.002 1.777c.004.434.08.517.5.57a15 15 0 0 0 3.148-.046a5 5 0 0 0 1.573-.374a.507.507 0 0 0 .344-.603a6.83 6.83 0 0 0-5.343-5.71a6.6 6.6 0 0 0-3.648.242a6.7 6.7 0 0 0-2.694 1.752A6.27 6.27 0 0 0 5.23 8.432a11.2 11.2 0 0 0 1.526 5.517a1.34 1.34 0 0 0 1.33.748c.653-.016 1.307-.004 1.96-.004v-.003h2.084c.25 0 .447.06.445.372c-.005.726 0 1.45-.003 2.176c-.002.22-.064.432-.326.434c-.264.002-.327-.209-.33-.43c-.005-.347 0-.694 0-1.041c0-.451-.073-.557-.523-.64a7.7 7.7 0 0 0-2.348-.02a2.6 2.6 0 0 0-.8.196c-.212.1-.296.245-.193.467c.107.231.206.467.333.688a44 44 0 0 0 3.426 4.956c.154.199.273.203.431.01c.349-.426.715-.839 1.06-1.268a34 34 0 0 0 3.577-5.26a14.2 14.2 0 0 0 1.494-3.871a1.203 1.203 0 0 0-1.012-1.635a7 7 0 0 0-1.67-.162c-.909-.006-1.818-.003-2.727-.002c-.245 0-.427-.07-.427-.358q-.002-1.516.002-3.033c0-.216.104-.349.339-.34" />
          </svg>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight text-balance">
          👋 Hi {displayName}!
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm text-pretty">
          What are you craving today?
        </p>
      </div>

      {/* 2. Text-only Chat Message Option with Smooth Transition */}
      <div className="min-h-[48px] flex items-center justify-center mt-1">
        <button
          type="button"
          onClick={() => onSelectQuestion(activeQuestion)}
          className={`text-base sm:text-lg md:text-xl font-medium text-zinc-800 dark:text-zinc-200 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-300 cursor-pointer max-w-xl text-center px-2 py-1 ${
            isFading
              ? "opacity-0 -translate-y-1"
              : "opacity-100 translate-y-0"
          }`}
        >
          {activeQuestion}
        </button>
      </div>
    </div>
  );
}

export default ChatEmptyState;
