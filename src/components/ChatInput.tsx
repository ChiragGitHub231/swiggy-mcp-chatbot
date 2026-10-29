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
    <div className="w-full bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-4 shrink-0 shadow-sm">
      <form
        onSubmit={handleSubmit}
        className="max-w-5xl mx-auto flex items-center gap-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={
            disabled
              ? "Waiting for Swiggy assistant..."
              : "Ask anything (e.g. 'Track my order', 'Find biryani near me')..."
          }
          className="flex-1 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 px-5 py-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm disabled:opacity-60 shadow-inner"
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="px-6 py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm flex items-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer shrink-0"
        >
          <span>Send</span>
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
      </form>
    </div>
  );
}

export default ChatInput;
