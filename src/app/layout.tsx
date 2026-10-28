import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Swiggy MCP Chatbot",
  description: "AI-Powered Swiggy Food Assistant using Model Context Protocol (MCP)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

