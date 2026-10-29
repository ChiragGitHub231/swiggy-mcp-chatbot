"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AgentMessage } from "@/lib/ai-agent";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

interface ChatWindowProps {
  initialMessages?: AgentMessage[];
  userPhone?: string;
  userName?: string;
}

function createMessageId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function getCurrentTime(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatWindow({
  initialMessages,
  userPhone,
  userName,
}: ChatWindowProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<AgentMessage[]>(() => {
    if (initialMessages && initialMessages.length > 0) {
      return initialMessages;
    }
    const welcomeGreeting =
      userName && userName !== "Swiggy User"
        ? `👋 Hi ${userName}! I am your Swiggy MCP Assistant connected to your account${
            userPhone ? ` (${userPhone})` : ""
          }. I can track your live orders, browse restaurant menus, or check your order history. How can I help you today?`
        : `👋 Hi! I am your Swiggy MCP Assistant${
            userPhone ? ` connected to your account (${userPhone})` : ""
          }. I can track your live orders, browse restaurant menus, or check your order history. How can I help you today?`;

    return [
      {
        id: "welcome-1",
        role: "assistant",
        content: welcomeGreeting,
        timestamp: "Just now",
      },
    ];
  });
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

      if (response.status === 401) {
        // Refresh token expired or session invalidated -> redirect to login
        router.push("/");
        return;
      }

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
    "🍕 Craving pizza",
    "❓ What can you do?",
  ];

  return (
    <div className="flex flex-col h-full w-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Full-width Top Navigation Header */}
      <header className="w-full h-16 bg-orange-600 text-white shrink-0 shadow-md z-10">
        <div className="max-w-7xl mx-auto h-full px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl shadow-inner">
              🛵
            </div>
            <div>
              <h1 className="font-bold text-base md:text-lg leading-tight tracking-tight">
                Swiggy MCP Chat
              </h1>
              <div className="text-xs text-orange-100 flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse inline-block shrink-0" />
                <span className="font-medium">Connected via MCP</span>
                {userName && userName !== "Swiggy User" && (
                  <>
                    <span className="opacity-70">•</span>
                    <span className="font-semibold text-white flex items-center gap-1">
                      <span>👤</span>
                      <span>{userName}</span>
                    </span>
                  </>
                )}
                {userPhone && (
                  <>
                    <span className="opacity-70">•</span>
                    <span className="text-[11px] font-mono font-bold bg-white/20 px-2.5 py-0.5 rounded-full text-white border border-white/25 flex items-center gap-1 shadow-2xs">
                      <span>📱</span>
                      <span>{userPhone}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api/auth/logout"
              className="text-xs bg-black/20 hover:bg-black/30 px-3.5 py-2 rounded-xl font-medium transition-all border border-white/20 hover:border-white/40"
            >
              Disconnect
            </a>
          </div>
        </div>
      </header>

      {/* Full-width Messages Scroll View */}
      <div className="flex-1 overflow-y-auto w-full px-4 md:px-8 py-6">
        <div className="max-w-5xl mx-auto space-y-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                🛵
              </div>
              <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl rounded-tl-none border border-zinc-200/80 dark:border-zinc-700/80 shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" />
                <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2 font-medium">
                  Consulting Swiggy MCP...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Full-width Suggestions Toolbar */}
      <div className="w-full bg-zinc-100/90 dark:bg-zinc-900/90 border-t border-zinc-200 dark:border-zinc-800 py-2.5 px-4 md:px-8 shrink-0 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0 font-medium">
            Suggestions:
          </span>
          {quickActions.map((action) => (
            <button
              key={action}
              onClick={() => handleSendMessage(action.replace(/^[^\w\s]+/, "").trim())}
              disabled={isLoading}
              className="text-xs bg-white dark:bg-zinc-800 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-zinc-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 border border-zinc-200 dark:border-zinc-700 hover:border-orange-300 px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all shrink-0 cursor-pointer shadow-2xs"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Full-width Input Bar */}
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  );
}

export default ChatWindow;
