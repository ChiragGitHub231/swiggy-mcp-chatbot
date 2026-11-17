import { SwiggyOrder } from "./swiggy-mcp";
import { planAndExecuteQuery } from "./planner";

export interface AgentMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  orderData?: SwiggyOrder;
}

/**
 * Orchestrates user query processing using the Planner -> Executor -> Formatter architecture.
 */
export async function processAgentChat(
  userQuery: string,
  history: AgentMessage[] = [],
  accessToken: string = ""
): Promise<AgentMessage> {
  const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const timestamp = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Execute using LangChain Planner -> Executor -> Formatter pipeline
  const responseContent = await planAndExecuteQuery(
    userQuery,
    history.map((h) => ({ role: h.role, content: h.content })),
    accessToken
  );

  return {
    id,
    role: "assistant",
    content: responseContent,
    timestamp,
  };
}
