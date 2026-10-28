import { executeSwiggyTool, SwiggyOrder } from "./swiggy-mcp";

export interface AgentMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  orderData?: SwiggyOrder;
}

/**
 * Orchestrates user query processing with Swiggy MCP tools.
 * Handles tool selection, execution, and contextual response formatting.
 */
export async function processAgentChat(
  userQuery: string,
  history: AgentMessage[] = [],
  accessToken: string = ""
): Promise<AgentMessage> {
  const queryLower = userQuery.toLowerCase().trim();
  const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const timestamp = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Check if user is referencing an order ID mentioned earlier in conversation history
  let contextOrderId: string | undefined;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].orderData?.orderId) {
      contextOrderId = history[i].orderData?.orderId;
      break;
    }
  }

  // Intent: Active orders or Live tracking
  if (
    queryLower.includes("track") ||
    queryLower.includes("where is my order") ||
    queryLower.includes("status") ||
    queryLower.includes("active order") ||
    queryLower.includes("eta") ||
    queryLower.includes("delivery")
  ) {
    // Extract potential order ID if mentioned (e.g., SWIGGY-12345 or #12345)
    const orderIdMatch = userQuery.match(/(?:SWIGGY-|\#)?([0-9]{4,8})/i);
    const orderId = orderIdMatch
      ? `SWIGGY-${orderIdMatch[1]}`
      : contextOrderId;

    const toolResult = await executeSwiggyTool(
      "track_order",
      { orderId },
      accessToken
    );

    const order = toolResult.orderData;
    let content = "Here is the real-time status of your Swiggy order:";

    if (order) {
      if (order.status === "OUT_FOR_DELIVERY") {
        content = `Your order from **${order.restaurantName}** is on the way! It is estimated to arrive in **${order.estimatedDeliveryMinutes} minutes**. Delivery partner **${order.deliveryPartnerName}** is assigned.`;
      } else if (order.status === "PREPARING_FOOD") {
        content = `The restaurant **${order.restaurantName}** is currently preparing your food.`;
      } else if (order.status === "DELIVERED") {
        content = `Your order from **${order.restaurantName}** has been delivered. Enjoy your meal!`;
      }
    }

    return {
      id,
      role: "assistant",
      content,
      timestamp,
      orderData: order,
    };
  }

  // Intent: Past Order History
  if (
    queryLower.includes("past order") ||
    queryLower.includes("history") ||
    queryLower.includes("previous order")
  ) {
    const toolResult = await executeSwiggyTool(
      "get_order_history",
      { limit: "3" },
      accessToken
    );

    const result = toolResult.result as { orders: Array<{ restaurantName: string; placedAt: string; totalAmount: number; items: string[] }> };
    const ordersList = result.orders
      .map(
        (o) =>
          `• **${o.restaurantName}** (${o.placedAt}) - ₹${o.totalAmount}\n  Items: ${o.items.join(", ")}`
      )
      .join("\n\n");

    return {
      id,
      role: "assistant",
      content: `Here are your recent completed orders on Swiggy:\n\n${ordersList}`,
      timestamp,
    };
  }

  // Intent: Search Food / Restaurant / Cuisine
  if (
    queryLower.includes("find") ||
    queryLower.includes("search") ||
    queryLower.includes("biryani") ||
    queryLower.includes("pizza") ||
    queryLower.includes("burger") ||
    queryLower.includes("crave")
  ) {
    const searchQuery = queryLower
      .replace(/find|search|where can i get|i want/g, "")
      .trim() || "popular dishes";

    const toolResult = await executeSwiggyTool(
      "search_food",
      { query: searchQuery },
      accessToken
    );

    const result = toolResult.result as { query: string; restaurants: Array<{ name: string; rating: string; deliveryTime: string; costForTwo: string }> };
    const restaurantList = result.restaurants
      .map(
        (r) =>
          `• **${r.name}** ⭐ ${r.rating} | ⏱️ ${r.deliveryTime} | 💵 ${r.costForTwo}`
      )
      .join("\n");

    return {
      id,
      role: "assistant",
      content: `Here are the top Swiggy recommendations for "${result.query}":\n\n${restaurantList}`,
      timestamp,
    };
  }

  // Intent: Help or Default Greeting
  return {
    id,
    role: "assistant",
    content:
      "Hello! I am your Swiggy AI Assistant powered by MCP. I can help you with:\n\n" +
      "1. 🛵 **Tracking live orders**: Ask *'Where is my order?'* or *'Track order #884920'*\n" +
      "2. 📋 **Viewing past orders**: Ask *'Show my order history'*\n" +
      "3. 🔍 **Finding food**: Ask *'Find biryani near me'* or *'Search pizza restaurants'*\n\n" +
      "What would you like to check today?",
    timestamp,
  };
}
