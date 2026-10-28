"use client";

import React, { useState, useRef, useEffect } from "react";
import type { AgentMessage } from "@/lib/ai-agent";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

interface ChatWindowProps {
  initialMessages?: AgentMessage[];
  userPhone?: string;
}

const DEFAULT_WELCOME_MESSAGE: AgentMessage = {
  id: "welcome-1",
  role: "assistant",
  content:
    "👋 Hi! I am your Swiggy MCP Assistant. I can track your orders, browse restaurant menus, or check your order history. How can I help you right now?",
  timestamp: "Just now",
};

function createMessageId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function getCurrentTime(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatWindow({ initialMessages, userPhone }: ChatWindowProps) {
  const [messages, setMessages] = useState<AgentMessage[]>(
    () => initialMessages || [DEFAULT_WELCOME_MESSAGE]
  );
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (query: string) => {
    const userMessage: AgentMessage = {
      id: createMessageId("usr"),
      role: "user",
      content: query,
      timestamp: getCurrentTime(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: query,
          history: newMessages,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat error: ${response.statusText}`);
      }

      const data = await response.json();
      setMessages((prev) => [...prev, data.reply]);
    } catch (err) {
      console.error("Failed to send message:", err);
      const errorMessage: AgentMessage = {
        id: createMessageId("err"),
        role: "assistant",
        content:
          "⚠️ Sorry, I encountered an issue communicating with the Swiggy MCP service. Please try again.",
        timestamp: getCurrentTime(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    "🛵 Track my live order",
    "📜 Show my past orders",
    "🍗 Find top biryani",
    "❓ What can you do?",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto my-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-orange-600 text-white flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
            🛵
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight">Swiggy MCP Chat</h1>
            <p className="text-xs text-orange-100 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse inline-block" />
              Connected via MCP {userPhone ? `• ${userPhone}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/auth/logout"
            className="text-xs bg-black/15 hover:bg-black/25 px-3 py-1.5 rounded-lg font-medium transition-colors border border-white/20"
          >
            Disconnect
          </a>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-zinc-50/50 dark:bg-zinc-950/50 space-y-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0">
              🛵
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-2xl rounded-tl-none border border-zinc-200/60 dark:border-zinc-700/60 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" />
              <span className="text-xs text-zinc-500 ml-2">
                Consulting Swiggy MCP...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2 overflow-x-auto">
        <span className="text-xs text-zinc-400 shrink-0 font-medium">Suggestions:</span>
        {quickActions.map((action) => (
          <button
            key={action}
            onClick={() => handleSendMessage(action.replace(/^[^\w\s]+/, "").trim())}
            disabled={isLoading}
            className="text-xs bg-white dark:bg-zinc-800 hover:bg-orange-50 dark:hover:bg-orange-950/30 text-zinc-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 border border-zinc-200 dark:border-zinc-700 hover:border-orange-200 px-3 py-1.5 rounded-full whitespace-nowrap transition-all shrink-0"
          >
            {action}
          </button>
        ))}
      </div>

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  );
}

export default ChatWindow;
