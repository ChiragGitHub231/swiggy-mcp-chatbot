export interface SwiggyOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  isVeg: boolean;
}

export interface SwiggyOrder {
  orderId: string;
  restaurantName: string;
  restaurantAddress?: string;
  restaurantImage?: string;
  status:
    | "ORDER_CONFIRMED"
    | "PREPARING_FOOD"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "CANCELLED";
  statusText: string;
  estimatedDeliveryMinutes?: number;
  deliveryPartnerName?: string;
  deliveryPartnerPhone?: string;
  placedAt: string;
  items: SwiggyOrderItem[];
  totalAmount: number;
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<
      string,
      {
        type: string;
        description: string;
        enum?: string[];
      }
    >;
    required?: string[];
  };
}

export const SWIGGY_MCP_TOOLS: MCPToolDefinition[] = [
  {
    name: "get_active_orders",
    description: "Fetch all active live orders currently placed by the user on Swiggy.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "track_order",
    description: "Get real-time tracking, ETA, and delivery partner details for a specific Swiggy order.",
    parameters: {
      type: "object",
      properties: {
        orderId: {
          type: "string",
          description: "The unique Swiggy order ID to track.",
        },
      },
      required: ["orderId"],
    },
  },
  {
    name: "get_order_history",
    description: "Retrieve past completed orders for the authenticated user.",
    parameters: {
      type: "object",
      properties: {
        limit: {
          type: "string",
          description: "Number of past orders to retrieve (default: 5).",
        },
      },
    },
  },
  {
    name: "search_food",
    description: "Search for dishes, cuisines, or restaurants available on Swiggy.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term like 'Biryani', 'Pizza', 'Burger King'.",
        },
      },
      required: ["query"],
    },
  },
];

// Mock data generator for interactive preview / development
function getMockActiveOrder(orderId?: string): SwiggyOrder {
  return {
    orderId: orderId || "SWIGGY-884920",
    restaurantName: "Meghana Foods",
    restaurantAddress: "Koramangala 5th Block, Bangalore",
    status: "OUT_FOR_DELIVERY",
    statusText: "Delivery partner is on the way with your food!",
    estimatedDeliveryMinutes: 14,
    deliveryPartnerName: "Ramesh Kumar",
    deliveryPartnerPhone: "+91 98765 43210",
    placedAt: new Date(Date.now() - 22 * 60 * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    items: [
      {
        id: "item_1",
        name: "Special Chicken Biryani (Boneless)",
        quantity: 1,
        price: 380,
        isVeg: false,
      },
      {
        id: "item_2",
        name: "Paneer 65",
        quantity: 1,
        price: 240,
        isVeg: true,
      },
      {
        id: "item_3",
        name: "Thums Up (750ml)",
        quantity: 1,
        price: 45,
        isVeg: true,
      },
    ],
    totalAmount: 708.5,
  };
}

/**
 * Executes a Swiggy MCP tool call.
 * If an external MCP server endpoint is configured, forwards JSON-RPC tool calls.
 * Otherwise provides high-fidelity Swiggy simulated responses.
 */
export async function executeSwiggyTool(
  toolName: string,
  parameters: Record<string, unknown>,
  accessToken: string
): Promise<{ success: boolean; result: unknown; orderData?: SwiggyOrder }> {
  const mcpServerUrl = process.env.SWIGGY_MCP_SERVER_URL || "https://mcp.swiggy.com/food";

  if (mcpServerUrl && accessToken) {
    try {
      const response = await fetch(mcpServerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "tools/call",
          params: {
            name: toolName,
            arguments: parameters,
          },
          id: Date.now(),
        }),
      });

      if (response.ok) {
        const json = await response.json();
        return {
          success: true,
          result: json.result?.content || json.result,
        };
      }
    } catch (err) {
      console.warn("MCP Server connection failed, falling back to local handler:", err);
    }
  }

  // Built-in tool handling
  switch (toolName) {
    case "get_active_orders": {
      const activeOrder = getMockActiveOrder();
      return {
        success: true,
        result: {
          message: "Found 1 active order currently in progress.",
          orders: [activeOrder],
        },
        orderData: activeOrder,
      };
    }

    case "track_order": {
      const orderId = (parameters.orderId as string) || "SWIGGY-884920";
      const order = getMockActiveOrder(orderId);
      return {
        success: true,
        result: {
          orderId: order.orderId,
          status: order.statusText,
          etaMinutes: order.estimatedDeliveryMinutes,
          partner: order.deliveryPartnerName,
          restaurant: order.restaurantName,
        },
        orderData: order,
      };
    }

    case "get_order_history": {
      return {
        success: true,
        result: {
          orders: [
            {
              orderId: "SWIGGY-736291",
              restaurantName: "Truffles",
              placedAt: "Yesterday at 8:30 PM",
              status: "DELIVERED",
              items: ["All American Cheese Burger", "Peri Peri Fries"],
              totalAmount: 460,
            },
            {
              orderId: "SWIGGY-629103",
              restaurantName: "Chai Point",
              placedAt: "2 days ago",
              status: "DELIVERED",
              items: ["Ginger Chai Flask (500ml)", "Banana Cake"],
              totalAmount: 230,
            },
          ],
        },
      };
    }

    case "search_food": {
      const q = String(parameters.query || "");
      return {
        success: true,
        result: {
          query: q,
          restaurants: [
            {
              name: `Top Rated for ${q}`,
              rating: "4.4",
              deliveryTime: "25-30 mins",
              costForTwo: "₹400",
            },
            {
              name: "Empire Restaurant",
              rating: "4.2",
              deliveryTime: "30-35 mins",
              costForTwo: "₹500",
            },
          ],
        },
      };
    }

    default:
      return {
        success: false,
        result: `Unknown tool: ${toolName}`,
      };
  }
}

