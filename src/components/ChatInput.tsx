"use client";

import React, { useState, FormEvent, KeyboardEvent } from "react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled) return;

    onSendMessage(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full bg-transparent px-4 pt-1 pb-3 sm:pb-3.5 shrink-0 border-none">
      <form
        onSubmit={handleSubmit}
        className="max-w-5xl mx-auto"
      >
        <div className="flex items-center gap-2 bg-zinc-200/50 dark:bg-zinc-800/50 backdrop-blur-md rounded-2xl px-4 py-2 transition-all duration-150 border-none focus-within:ring-2 focus-within:ring-orange-500/40">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={
              disabled
                ? "Waiting for Swiggy assistant..."
                : "Ask anything (e.g. 'What are my addresses?', 'Find biryani near office')..."
            }
            className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 py-1.5 focus:outline-none font-normal text-pretty"
          />

          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-semibold transition-all duration-150 shadow-xs disabled:opacity-30 disabled:hover:bg-orange-600 disabled:active:scale-100 cursor-pointer disabled:cursor-not-allowed shrink-0"
            title="Send message (Enter)"
            aria-label="Send message"
          >
            <svg
              className="w-4 h-4 transform rotate-90"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 19V5m0 0l-7 7m7-7l7 7"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatInput;
