# Swiggy MCP Chatbot

An AI-powered conversational food assistant for Swiggy built with Next.js, Model Context Protocol (MCP), and secure OAuth 2.0 with PKCE.

## Project Structure

```text
swiggy-mcp-chatbot/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Home landing page with login action
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── page.tsx          # Optional callback status UI
│   │   ├── chat/
│   │   │   └── page.tsx              # Protected chatbot page
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   └── route.ts      # Start OAuth + PKCE
│   │   │   │   ├── callback/
│   │   │   │   │   └── route.ts      # Exchange code + set cookie
│   │   │   │   └── logout/
│   │   │   │       └── route.ts      # Clear cookie + revoke if supported
│   │   │   └── chat/
│   │   │       └── route.ts          # Validate cookie + process queries
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── LoginButton.tsx           # Connect Swiggy button
│   │   ├── ChatWindow.tsx            # Main chat interface & suggestions
│   │   ├── ChatMessage.tsx           # User & AI message bubbles
│   │   ├── ChatInput.tsx             # Chat query input field
│   │   └── OrderStatusCard.tsx       # Live delivery tracking card
│   │
│   └── lib/
│       ├── oauth.ts                  # Authorization URL + PKCE
│       ├── auth.ts                   # Cookie creation + validation
│       ├── token-manager.ts          # Swiggy token storage + refresh
│       ├── swiggy-mcp.ts             # MCP client + tool calls
│       └── ai-agent.ts               # LLM + tool orchestration
│
├── .env.example
├── package.json
└── tsconfig.json
```

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Configure your Swiggy developer credentials:

```env
SWIGGY_CLIENT_ID=your_client_id
SWIGGY_CLIENT_SECRET=your_client_secret_if_required
SWIGGY_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.
