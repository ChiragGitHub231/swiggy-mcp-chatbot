import React from "react";
import type { AgentMessage } from "@/lib/ai-agent";
import { OrderStatusCard } from "./OrderStatusCard";

interface ChatMessageProps {
  message: AgentMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex w-full mb-4 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`flex items-start gap-3 max-w-[85%] md:max-w-[75%] ${
          isUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Avatar */}
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm shadow-sm ${
            isUser
              ? "bg-zinc-800 text-white dark:bg-zinc-700"
              : "bg-orange-600 text-white"
          }`}
        >
          {isUser ? "👤" : "🛵"}
        </div>

        {/* Message Content */}
        <div className="flex flex-col">
          <div
            className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              isUser
                ? "bg-orange-600 text-white rounded-tr-none"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-none border border-zinc-200/60 dark:border-zinc-700/60"
            }`}
          >
            {message.content}
          </div>

          {/* Render OrderStatusCard if present */}
          {message.orderData && (
            <OrderStatusCard order={message.orderData} />
          )}

          {/* Timestamp */}
          <span
            className={`text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 px-1 ${
              isUser ? "text-right" : "text-left"
            }`}
          >
            {message.timestamp}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;

