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
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800"
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
            : "Ask anything (e.g. 'Track my order', 'Find biryani')..."
        }
        className="flex-1 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm flex items-center gap-1.5 transition-colors shadow-sm"
      >
        <span>Send</span>
        <svg
          className="w-4 h-4 transform rotate-90"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
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
  );
}

export default ChatInput;

