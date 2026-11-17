import { ChatGroq } from "@langchain/groq";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { SwiggyToolName } from "./registry";

const FORMATTER_SYSTEM_PROMPT = `
You are a friendly, polished Swiggy Food Assistant response formatter.
Your job is to convert cleaned data returned from Swiggy MCP tools into clear, helpful, engaging Markdown responses for the user.

FORMATTING GUIDELINES:
1. Address List (get_addresses):
   - Present addresses neatly with clear numbering or bullet points.
   - Highlight the label (e.g., "Home", "Work", "Other") in bold.
   - Mention the area/city clearly.
   - If an addressId is present, you may keep it concise or indicate it is ready for ordering.
   - Do NOT display removed technical fields or internal IDs prominently.

2. Restaurant List (search_restaurants):
   - List the top restaurants found matching the user's food query.
   - Include Name, Rating (⭐), Delivery Time, and Cost/Cuisines if available.
   - Add a warm, appetizing tone.

3. General Guidelines:
   - Use Markdown (bolding, bullet points, emoji) tastefully.
   - Keep answers clear and scannable on mobile screens.
   - Never expose raw JSON-RPC structures, errors, or technical jargon.
`;

/**
 * Formats cleaned MCP tool data into a polished human-readable message using the LLM.
 */
export async function formatResponseWithLLM(
  toolName: SwiggyToolName,
  cleanedData: unknown,
  userQuery: string
): Promise<string> {
  const groqApiKey = process.env.GROQ_API_KEY;

  if (groqApiKey) {
    try {
      const groqModelName = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
      const model = new ChatGroq({
        apiKey: groqApiKey,
        model: groqModelName,
        temperature: 0.3,
      });

      const response = await model.invoke([
        new SystemMessage(FORMATTER_SYSTEM_PROMPT),
        new HumanMessage(
          `User Query: "${userQuery}"\nTool executed: "${toolName}"\nCleaned API Data:\n${JSON.stringify(
            cleanedData,
            null,
            2
          )}\n\nPlease provide a friendly, well-formatted response for the user.`
        ),
      ]);

      if (typeof response.content === "string" && response.content.trim()) {
        return response.content.trim();
      }
    } catch (err) {
      console.warn("LLM response formatting error, using fallback formatter:", err);
    }
  }

  // Graceful fallback formatter if LLM is unavailable
  return fallbackFormatResponse(toolName, cleanedData, userQuery);
}

/**
 * Deterministic fallback formatter in case LLM is offline
 */
export function fallbackFormatResponse(
  toolName: SwiggyToolName,
  cleanedData: any,
  userQuery: string
): string {
  if (!cleanedData) {
    return "I couldn't find any results for your request at the moment. Please try again.";
  }

  if (toolName === "get_addresses") {
    const list = Array.isArray(cleanedData)
      ? cleanedData
      : cleanedData.addresses || cleanedData.data || [];

    if (!Array.isArray(list) || list.length === 0) {
      return "You do not have any registered delivery addresses saved on Swiggy.";
    }

    const lines = list.map((addr: any, idx: number) => {
      const title = addr.label || addr.addressType || addr.name || `Address ${idx + 1}`;
      const desc = addr.address || addr.formattedAddress || addr.displayAddress || JSON.stringify(addr);
      return `${idx + 1}. **${title}**: ${desc}`;
    });

    return `Here are your registered delivery addresses:\n\n${lines.join("\n")}`;
  }

  if (toolName === "search_restaurants") {
    const restaurants = Array.isArray(cleanedData)
      ? cleanedData
      : cleanedData.restaurants || cleanedData.data || [];

    if (!Array.isArray(restaurants) || restaurants.length === 0) {
      return `I couldn't find any restaurants matching "${userQuery}" for your selected delivery address.`;
    }

    const cards = restaurants.map((r: any, idx: number) => {
      const name = r.name || r.restaurantName || "Restaurant";
      const rating = r.rating || r.avgRating ? ` ⭐ ${r.rating || r.avgRating}` : "";
      const time = r.deliveryTime || r.slaString ? ` • ⏱️ ${r.deliveryTime || r.slaString}` : "";
      const cost = r.costForTwo ? ` • ${r.costForTwo}` : "";
      return `${idx + 1}. **${name}**${rating}${time}${cost}`;
    });

    return `Here are the top restaurants matching "${userQuery}":\n\n${cards.join("\n")}`;
  }

  return typeof cleanedData === "string" ? cleanedData : JSON.stringify(cleanedData, null, 2);
}

