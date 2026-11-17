"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AgentMessage } from "@/lib/ai-agent";
import { ChatMessage, BotIcon, PersonIcon } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ChatEmptyState } from "./ChatEmptyState";

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
  // Initialize to empty if no prior messages exist, so ChatEmptyState is shown
  const [messages, setMessages] = useState<AgentMessage[]>(() => {
    if (initialMessages && initialMessages.length > 0) {
      return initialMessages;
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    // Show button if user has scrolled up more than 100px from bottom
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
    setShowScrollBottom(isScrolledUp);
  };

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  };

  useEffect(() => {
    if (messages.length > 0 && !showScrollBottom) {
      scrollToBottom();
    }
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
    setShowScrollBottom(false);
    scrollToBottom();

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

  return (
    <div className="flex flex-col h-full w-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Full-width Top Navigation Header */}
      <header className="w-full h-16 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shrink-0 z-10 shadow-2xs">
        <div className="max-w-7xl mx-auto h-full px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FC8019] text-white flex items-center justify-center shadow-xs shadow-orange-500/20 shrink-0">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 fill-white"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Swiggy"
              >
                <path d="M12.878 5.928a.297.297 0 0 1 .314.335l.003.276c.001.593-.002 1.185.002 1.777c.004.434.08.517.5.57a15 15 0 0 0 3.148-.046a5 5 0 0 0 1.573-.374a.507.507 0 0 0 .344-.603a6.83 6.83 0 0 0-5.343-5.71a6.6 6.6 0 0 0-3.648.242a6.7 6.7 0 0 0-2.694 1.752A6.27 6.27 0 0 0 5.23 8.432a11.2 11.2 0 0 0 1.526 5.517a1.34 1.34 0 0 0 1.33.748c.653-.016 1.307-.004 1.96-.004v-.003h2.084c.25 0 .447.06.445.372c-.005.726 0 1.45-.003 2.176c-.002.22-.064.432-.326.434c-.264.002-.327-.209-.33-.43c-.005-.347 0-.694 0-1.041c0-.451-.073-.557-.523-.64a7.7 7.7 0 0 0-2.348-.02a2.6 2.6 0 0 0-.8.196c-.212.1-.296.245-.193.467c.107.231.206.467.333.688a44 44 0 0 0 3.426 4.956c.154.199.273.203.431.01c.349-.426.715-.839 1.06-1.268a34 34 0 0 0 3.577-5.26a14.2 14.2 0 0 0 1.494-3.871a1.203 1.203 0 0 0-1.012-1.635a7 7 0 0 0-1.67-.162c-.909-.006-1.818-.003-2.727-.002c-.245 0-.427-.07-.427-.358q-.002-1.516.002-3.033c0-.216.104-.349.339-.34" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base leading-tight tracking-tight text-zinc-900 dark:text-zinc-100">
                Swiggy MCP Chatbot
              </h1>
              <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5 flex-wrap font-medium">
                {userName && userName !== "Swiggy User" && (
                  <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                    <PersonIcon className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                    <span>{userName}</span>
                  </span>
                )}
                {userName && userName !== "Swiggy User" && userPhone && (
                  <span className="opacity-40">•</span>
                )}
                {userPhone && (
                  <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                    <svg
                      className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                      <path d="M12 18h.01" />
                    </svg>
                    <span className="font-mono tabular-nums">{userPhone}</span>
                  </span>
                )}
                {(!userName || userName === "Swiggy User") && !userPhone && (
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Swiggy Account
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api/auth/logout"
              className="text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/30 px-3.5 py-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 transition-all duration-150 active:scale-95"
            >
              Disconnect
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto w-full px-4 md:px-8 pt-4 pb-20 flex flex-col"
      >
        {messages.length === 0 ? (
          /* Empty State in Center: Greeting with Logged-in Username + Switching 1-2s Questions */
          <ChatEmptyState
            userName={userName}
            onSelectQuestion={handleSendMessage}
          />
        ) : (
          /* Messages Stream View */
          <div className="max-w-5xl mx-auto w-full space-y-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {isLoading && (
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-8 h-8 rounded-full bg-[#FC8019] text-white flex items-center justify-center shrink-0 shadow-2xs ring-2 ring-orange-500/20"
                  aria-label="Assistant loading"
                >
                  <BotIcon className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="bg-white dark:bg-zinc-900 px-4 py-3 rounded-2xl rounded-tl-xs shadow-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-1 shrink-0" />
          </div>
        )}
      </div>

      {/* Floating Bottom Section Over the Scroll View */}
      <div className="absolute bottom-0 inset-x-0 z-20 pointer-events-none">
        {/* Scroll-to-bottom Floating Button (Centered above the chat input) */}
        {showScrollBottom && (
          <div className="absolute -top-11 left-1/2 -translate-x-1/2 z-30 pointer-events-auto group">
            <button
              type="button"
              onClick={() => scrollToBottom(true)}
              title="Scroll to bottom"
              className="w-9 h-9 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-200 shadow-md hover:shadow-lg hover:border-orange-400 hover:text-orange-600 dark:hover:text-orange-400 active:scale-90 transition-all flex items-center justify-center cursor-pointer"
              aria-label="Scroll to bottom"
            >
              <svg
                className="w-4 h-4 transform group-hover:translate-y-0.5 transition-transform duration-150"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Progressive Blur Layer over the chats scrolling underneath */}
        <div
          className="absolute inset-0 -top-6 backdrop-blur-md"
          style={{
            WebkitMaskImage:
              "linear-gradient(to top, rgba(0, 0, 0, 1) 45%, rgba(0, 0, 0, 0) 100%)",
            maskImage:
              "linear-gradient(to top, rgba(0, 0, 0, 1) 45%, rgba(0, 0, 0, 0) 100%)",
          }}
        />

        {/* Smooth Gradient Tint Layer */}
        <div
          className="absolute inset-0 -top-6 bg-gradient-to-t from-zinc-50/95 via-zinc-50/70 to-transparent dark:from-zinc-950/95 dark:via-zinc-950/70 dark:to-transparent"
          style={{
            WebkitMaskImage:
              "linear-gradient(to top, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 0) 100%)",
            maskImage:
              "linear-gradient(to top, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 0) 100%)",
          }}
        />

        {/* Input Bar (clickable) */}
        <div className="relative pointer-events-auto">
          <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
