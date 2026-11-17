import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AgentMessage } from "@/lib/ai-agent";
import { OrderStatusCard } from "./OrderStatusCard";

export function PersonIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function BotIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  );
}

interface ChatMessageProps {
  message: AgentMessage;
}

const markdownComponents = {
  table: ({ ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto my-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
      <table className="min-w-full text-xs md:text-sm border-collapse" {...props} />
    </div>
  ),
  thead: ({ ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-zinc-100/90 dark:bg-zinc-800/90 font-semibold text-zinc-800 dark:text-zinc-100 border-b border-zinc-200/80 dark:border-zinc-800" {...props} />
  ),
  th: ({ ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th
      className="px-3.5 py-2.5 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-200 whitespace-nowrap tracking-wide"
      {...props}
    />
  ),
  td: ({ ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td
      className="border-b border-zinc-100 dark:border-zinc-800/50 px-3.5 py-2.5 text-left text-zinc-700 dark:text-zinc-300 tabular-nums"
      {...props}
    />
  ),
  tr: ({ ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr
      className="even:bg-zinc-50/60 dark:even:bg-zinc-800/30 hover:bg-orange-50/50 dark:hover:bg-zinc-800/60 transition-colors"
      {...props}
    />
  ),
  h1: ({ ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="text-lg md:text-xl font-bold mt-3 mb-2 text-zinc-900 dark:text-white tracking-tight" {...props} />
  ),
  h2: ({ ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="text-base md:text-lg font-bold mt-3 mb-2 text-zinc-900 dark:text-white flex items-center gap-1.5 tracking-tight" {...props} />
  ),
  h3: ({ ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="text-sm md:text-base font-semibold mt-2.5 mb-1.5 text-zinc-900 dark:text-zinc-100 tracking-tight" {...props} />
  ),
  p: ({ ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-2 last:mb-0 leading-relaxed text-zinc-800 dark:text-zinc-200 text-pretty" {...props} />
  ),
  ul: ({ ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc pl-5 my-2 space-y-1 text-zinc-800 dark:text-zinc-200" {...props} />
  ),
  ol: ({ ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal pl-5 my-2 space-y-1 text-zinc-800 dark:text-zinc-200 tabular-nums" {...props} />
  ),
  li: ({ ...props }: React.LiHTMLAttributes<HTMLLIElement>) => (
    <li className="leading-relaxed" {...props} />
  ),
  strong: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-zinc-900 dark:text-white" {...props} />
  ),
  code: ({ ...props }: React.HTMLAttributes<HTMLElement>) => (
    <code className="bg-orange-50 dark:bg-orange-950/40 border border-orange-200/50 dark:border-orange-900/40 px-1.5 py-0.5 rounded-md text-xs font-mono text-orange-600 dark:text-orange-400" {...props} />
  ),
  hr: ({ ...props }: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className="my-3 border-zinc-200 dark:border-zinc-800" {...props} />
  ),
};

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex w-full mb-4 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`flex items-start gap-3 max-w-[92%] md:max-w-[80%] ${
          isUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-2xs ${
            isUser
              ? "bg-zinc-800 text-white dark:bg-zinc-700"
              : "bg-[#FC8019] text-white ring-2 ring-orange-500/20"
          }`}
          aria-label={isUser ? "You" : "Assistant"}
        >
          {isUser ? (
            <PersonIcon className="w-4 h-4 text-white" />
          ) : (
            <BotIcon className="w-4.5 h-4.5 text-white" />
          )}
        </div>

        {/* Message Content */}
        <div className="flex flex-col min-w-0">
          <div
            className={`px-4.5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-xs ${
              isUser
                ? "bg-zinc-900 dark:bg-orange-600 text-white rounded-tr-xs whitespace-pre-wrap font-medium"
                : "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-tl-xs border border-zinc-200/80 dark:border-zinc-800"
            }`}
          >
            {isUser ? (
              message.content
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>

          {/* Render OrderStatusCard if present */}
          {message.orderData && (
            <OrderStatusCard order={message.orderData} />
          )}

          {/* Timestamp */}
          <span
            className={`text-[11px] font-mono tabular-nums text-zinc-400 dark:text-zinc-500 mt-1.5 px-1 ${
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
