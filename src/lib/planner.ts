import { ChatGroq } from "@langchain/groq";
import { tool } from "@langchain/core/tools";
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
  ToolMessage,
  BaseMessage,
} from "@langchain/core/messages";

import { SWIGGY_REGISTRY, SwiggyToolName } from "./registry";
import { executeSwiggyApi } from "./executor";
import { formatResponseWithLLM } from "./formatter";
import {
  getCachedAddresses,
  findBestMatchingAddress,
  formatCachedAddressesForPrompt,
  CachedAddressData,
} from "./address-cache";

export interface ChatHistoryItem {
  role: "user" | "assistant" | "system";
  content: string;
}

const PLANNER_BASE_SYSTEM_PROMPT = `
You are the Swiggy Food Assistant Planner.
You assist the user by detecting their query intent and selecting the right Swiggy MCP tool based on the available tool descriptions and parameters.

### AVAILABLE TOOLS (from Registry):
1. get_addresses:
   - Description: Fetches all saved/registered delivery addresses for the logged-in user.
   - Parameters: none.
   - Use this when: User asks "What are my addresses?", "Show my locations", or when an addressId is needed to search restaurants.

2. search_restaurants:
   - Description: Searches restaurants and food items for a query.
   - Parameters: 'query' (string, e.g. "noodles", "biryani"), 'addressId' (string).
   - Use this when: User wants to find food, dishes, cuisines, or restaurants.

### CRITICAL PLANNING & ADDRESS MATCHING RULES:
1. 'search_restaurants' STRICTLY requires an 'addressId'.
   - If SAVED DELIVERY ADDRESSES are provided below in the prompt:
     - Perform partial or semantic matching based on user instructions:
       * If user specifies a label (e.g. "Work", "Office", "Home") or an area/locality, select that specific addressId.
       * If user does not specify a location, use the Default / Primary addressId.
     - Call 'search_restaurants' DIRECTLY with the food query and that addressId.
     - DO NOT call 'get_addresses' again.
   - If NO cached addresses are provided below:
     - STEP 1: Call 'get_addresses' to retrieve the user's delivery addresses.
     - STEP 2: Pick the primary/matching addressId from the returned list.
     - STEP 3: Then call 'search_restaurants' with the user's food query and that addressId.

2. Address Queries:
   - When the user asks "Where can I deliver?", "Show my saved addresses", call 'get_addresses'.

3. General Conversational Queries:
   - For greetings (e.g. "hi", "hello", "what can you do?"), respond politely explaining you can check their saved addresses and search restaurants on Swiggy. No tool call needed.

4. Formatting Rule:
   - When tool results are returned, write a clear, friendly, and structured Markdown response with bullet points or tables.
`;

/**
 * Builds LangChain dynamic tools from the Registry, bound to the provided accessToken.
 */
export function buildLangChainTools(accessToken: string, cachedData?: CachedAddressData | null) {
  const getAddresses = tool(
    async () => {
      const result = await executeSwiggyApi("get_addresses", {}, accessToken);
      if (!result.success) {
        return JSON.stringify({ error: result.error || "Failed to fetch addresses" });
      }
      return JSON.stringify(result.data);
    },
    {
      name: SWIGGY_REGISTRY.get_addresses.name,
      description: SWIGGY_REGISTRY.get_addresses.description,
      schema: SWIGGY_REGISTRY.get_addresses.schema,
    }
  );

  const searchRestaurants = tool(
    async ({ query, addressId }) => {
      let effectiveAddressId: string = addressId || "";

      // Fallback: auto-match from cached addresses if model omitted addressId
      if (!effectiveAddressId && accessToken) {
        const match = findBestMatchingAddress(query, accessToken);
        effectiveAddressId = match?.addressId || "";
      }
      if (!effectiveAddressId) {
        effectiveAddressId = "d1bu54dmjkg6s26hc3r0__AVSXwARcyWwZ8RcH_m9-WH";
      }

      const result = await executeSwiggyApi(
        "search_restaurants",
        { query, addressId: effectiveAddressId },
        accessToken
      );
      if (!result.success) {
        return JSON.stringify({ error: result.error || "Failed to search restaurants" });
      }
      return JSON.stringify(result.data);
    },
    {
      name: SWIGGY_REGISTRY.search_restaurants.name,
      description: SWIGGY_REGISTRY.search_restaurants.description,
      schema: SWIGGY_REGISTRY.search_restaurants.schema,
    }
  );

  return [getAddresses, searchRestaurants];
}

/**
 * Orchestrates planning, tool selection, multi-turn tool calling, and formatting.
 * Optimizations:
 * 1. Checks 30-min cached addresses (all cleaned locations) to enable partial/semantic matching & avoid redundant get_addresses.
 * 2. Uses the turn's generated content directly to eliminate redundant 4th formatting calls.
 */
export async function planAndExecuteQuery(
  userQuery: string,
  history: ChatHistoryItem[] = [],
  accessToken: string = ""
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  // Rule-based heuristic fallback if no Groq API Key is configured
  if (!apiKey) {
    return runHeuristicPlan(userQuery, accessToken);
  }

  try {
    const groqModelName = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
    const model = new ChatGroq({
      apiKey,
      model: groqModelName,
      temperature: 0.1, // Low temperature for deterministic planning
    });

    // Check if user has active cached addresses (< 30 minutes old)
    const cachedData = getCachedAddresses(accessToken);

    const tools = buildLangChainTools(accessToken, cachedData);
    const modelWithTools = model.bindTools(tools);

    // Build dynamic system prompt injecting all cached addresses for partial/semantic matching
    let dynamicSystemPrompt = PLANNER_BASE_SYSTEM_PROMPT;
    if (cachedData && cachedData.addresses.length > 0) {
      dynamicSystemPrompt += `\n\n${formatCachedAddressesForPrompt(cachedData)}`;
    }

    // Convert conversation history into LangChain messages
    const messages: BaseMessage[] = [new SystemMessage(dynamicSystemPrompt)];

    for (const h of history) {
      if (h.role === "user") {
        messages.push(new HumanMessage(h.content));
      } else if (h.role === "assistant") {
        messages.push(new AIMessage(h.content));
      }
    }

    messages.push(new HumanMessage(userQuery));

    // Tool calling execution loop (supports up to 4 iterations for chained tools)
    let maxTurns = 4;
    let lastToolExecuted: SwiggyToolName | null = null;
    let lastCleanedData: unknown = null;

    while (maxTurns > 0) {
      maxTurns--;

      const response = await modelWithTools.invoke(messages);
      messages.push(response);

      // Check if the LLM decided to call any tools
      if (!response.tool_calls || response.tool_calls.length === 0) {
        // Optimization: If the model generated text response in this turn, use it directly!
        // This eliminates the redundant 4th LLM call to formatResponseWithLLM.
        const content = typeof response.content === "string" ? response.content.trim() : "";
        if (content) {
          return content;
        }

        // Only if response content was empty despite executing a tool, fallback to formatter
        if (lastToolExecuted && lastCleanedData) {
          return await formatResponseWithLLM(lastToolExecuted, lastCleanedData, userQuery);
        }

        return "How else can I assist you with your Swiggy order today?";
      }

      // Execute each tool call generated by the planner
      for (const call of response.tool_calls) {
        const toolName = call.name as SwiggyToolName;
        const toolArgs = call.args;

        const result = await executeSwiggyApi(toolName, toolArgs, accessToken);
        lastToolExecuted = toolName;
        lastCleanedData = result.data;

        // Feed cleaned data back to model as ToolMessage
        messages.push(
          new ToolMessage({
            tool_call_id: call.id || `call_${Date.now()}`,
            content: JSON.stringify(result.data),
          })
        );
      }
    }

    // Fallback if loop ended after tool execution without text
    if (lastToolExecuted && lastCleanedData) {
      return await formatResponseWithLLM(lastToolExecuted, lastCleanedData, userQuery);
    }

    return "I processed your request. Let me know if you would like to search for anything else!";
  } catch (error) {
    console.warn("LLM Planner encountered an error, falling back to heuristic planner:", error);
    return runHeuristicPlan(userQuery, accessToken);
  }
}

/**
 * Deterministic fallback planner if LLM call fails or times out
 */
async function runHeuristicPlan(userQuery: string, accessToken: string): Promise<string> {
  const q = userQuery.toLowerCase().trim();

  // 1. Intent: Get Addresses
  if (
    q.includes("address") ||
    q.includes("location") ||
    q.includes("where can i deliver") ||
    q.includes("saved places")
  ) {
    const res = await executeSwiggyApi("get_addresses", {}, accessToken);
    return await formatResponseWithLLM("get_addresses", res.data, userQuery);
  }

  // 2. Intent: Search Restaurants / Food
  const isFoodSearch =
    q.includes("search") ||
    q.includes("find") ||
    q.includes("noodles") ||
    q.includes("biryani") ||
    q.includes("pizza") ||
    q.includes("burger") ||
    q.includes("restaurant") ||
    q.includes("food") ||
    q.includes("hungry") ||
    q.includes("kitchen");

  if (isFoodSearch) {
    // Check partial string matching from cached addresses first
    const matchedAddr = findBestMatchingAddress(userQuery, accessToken);
    let addressId = matchedAddr?.addressId;

    if (!addressId) {
      const addrRes = await executeSwiggyApi("get_addresses", {}, accessToken);
      if (addrRes.success && addrRes.data) {
        const list = Array.isArray(addrRes.data)
          ? addrRes.data
          : (addrRes.data as any).addresses || [];
        if (list.length > 0 && list[0].id) {
          addressId = list[0].id;
        }
      }
    }

    if (!addressId) {
      addressId = "d1bu54dmjkg6s26hc3r0__AVSXwARcyWwZ8RcH_m9-WH";
    }

    // Extract query search term
    const cleanedQuery = userQuery
      .replace(/search|find|order|get|me|for|some|tell|about/gi, "")
      .trim() || "food";

    // Step 2: Search restaurants with extracted query and resolved addressId
    const res = await executeSwiggyApi(
      "search_restaurants",
      { query: cleanedQuery, addressId },
      accessToken
    );

    return await formatResponseWithLLM("search_restaurants", res.data, userQuery);
  }

  return "👋 Hi! I can help you check your registered Swiggy delivery addresses or find restaurants for any dish you are craving. What would you like to do?";
}
