import { z } from "zod";

export interface SwiggyApiToolConfig<TSchema extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  description: string;
  schema: TSchema;
  fieldsToRemove: string[];
}

/**
 * Swiggy MCP API Registry
 * Declarative catalog containing tool metadata, Zod schemas, and sanitization rules.
 */
export const SWIGGY_REGISTRY = {
  get_addresses: {
    name: "get_addresses",
    description:
      "Fetches all registered delivery addresses for the logged-in user. Use this when the user asks about their addresses, or when you need an addressId before searching restaurants.",
    schema: z.object({}),
    fieldsToRemove: ["_meta", "content", "phoneNumber", "resolution", "jsonrpc"],
  },

  search_restaurants: {
    name: "search_restaurants",
    description:
      "Searches restaurants and food dishes on Swiggy for a user's food query. Requires the user's registered addressId.",
    schema: z.object({
      query: z
        .string()
        .describe("The food dish, cuisine, or restaurant to search for, e.g. 'noodles', 'pizza', 'biryani'"),
      addressId: z
        .string()
        .describe("The user's registered addressId where the delivery should be checked (obtained via get_addresses)"),
    }),
    fieldsToRemove: ["_meta", "content", "nextOffset", "jsonrpc"],
  },
} as const;

export type SwiggyToolName = keyof typeof SWIGGY_REGISTRY;

