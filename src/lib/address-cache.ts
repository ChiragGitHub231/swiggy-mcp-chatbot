/**
 * In-memory Address Cache with 30-minute Time-To-Live (TTL).
 * Caches ALL cleaned delivery addresses for the authenticated user to enable
 * instant partial and semantic address matching without redundant get_addresses API calls.
 */

export interface CleanedAddressItem {
  addressId: string;
  label: string;
  formattedAddress: string;
  isPrimary?: boolean;
}

export interface CachedAddressData {
  addresses: CleanedAddressItem[];
  primaryAddressId: string;
  timestamp: number;
}

// 30 minutes in milliseconds
export const ADDRESS_CACHE_EXPIRY_MS = 30 * 60 * 1000;

// Map of accessToken -> CachedAddressData
const addressCache = new Map<string, CachedAddressData>();

/**
 * Retrieves the cached address data for a token if within the 30-minute validity window.
 */
export function getCachedAddresses(token: string): CachedAddressData | null {
  if (!token) return null;

  const cached = addressCache.get(token);
  if (!cached) return null;

  const age = Date.now() - cached.timestamp;
  if (age > ADDRESS_CACHE_EXPIRY_MS) {
    // Expired (> 30 minutes)
    addressCache.delete(token);
    return null;
  }

  return cached;
}

/**
 * Backward-compatible single address getter (returns the primary address).
 */
export function getCachedAddress(token: string): { addressId: string; label?: string; formattedAddress?: string; timestamp: number } | null {
  const data = getCachedAddresses(token);
  if (!data || data.addresses.length === 0) return null;

  const primary = data.addresses[0];
  return {
    addressId: primary.addressId,
    label: primary.label,
    formattedAddress: primary.formattedAddress,
    timestamp: data.timestamp,
  };
}

/**
 * Extracts and stores ALL cleaned addresses from get_addresses response data
 * with a fresh 30-minute timestamp.
 */
export function updateAddressCacheFromData(token: string, data: unknown): CachedAddressData | null {
  if (!token || !data) return null;

  try {
    const rawList = Array.isArray(data)
      ? data
      : (data as any)?.addresses || (data as any)?.data || [];

    if (!Array.isArray(rawList) || rawList.length === 0) {
      return null;
    }

    const cleanedAddresses: CleanedAddressItem[] = [];

    rawList.forEach((item: any, idx: number) => {
      const addressId = item.id || item.addressId;
      if (addressId) {
        const label = item.label || item.addressType || item.name || (idx === 0 ? "Home" : "Saved Location");
        const formattedAddress =
          item.formattedAddress ||
          item.address ||
          item.displayAddress ||
          item.area ||
          "";

        cleanedAddresses.push({
          addressId: String(addressId),
          label: String(label),
          formattedAddress: String(formattedAddress),
          isPrimary: idx === 0,
        });
      }
    });

    if (cleanedAddresses.length > 0) {
      const cacheEntry: CachedAddressData = {
        addresses: cleanedAddresses,
        primaryAddressId: cleanedAddresses[0].addressId,
        timestamp: Date.now(),
      };
      addressCache.set(token, cacheEntry);
      return cacheEntry;
    }
  } catch (err) {
    console.warn("Failed to extract addresses for cache:", err);
  }

  return null;
}

/**
 * Helper to perform partial string matching on cached addresses.
 * Matches by label ("work", "office", "home") or locality keywords ("bellandur", etc.).
 */
export function findBestMatchingAddress(
  query: string,
  token: string
): CleanedAddressItem | null {
  const cached = getCachedAddresses(token);
  if (!cached || cached.addresses.length === 0) return null;

  const q = query.toLowerCase();

  // 1. Check label match (e.g. "office" -> Work, "home", "work")
  for (const addr of cached.addresses) {
    const label = addr.label.toLowerCase();
    if (q.includes(label)) return addr;
    if (label.includes("work") && q.includes("office")) return addr;
    if (label.includes("home") && (q.includes("house") || q.includes("flat") || q.includes("my place"))) {
      return addr;
    }
  }

  // 2. Check partial word match in formattedAddress (e.g. area/locality name)
  const words = q.split(/[\s,]+/).filter((w) => w.length > 3);
  for (const addr of cached.addresses) {
    const fullAddr = addr.formattedAddress.toLowerCase();
    if (words.some((word) => fullAddr.includes(word))) {
      return addr;
    }
  }

  // 3. Fallback to primary address
  return cached.addresses[0];
}

/**
 * Formats all cached addresses into clear markdown lines for the LLM prompt.
 */
export function formatCachedAddressesForPrompt(cached: CachedAddressData): string {
  const lines = cached.addresses.map((addr, idx) => {
    const tag = idx === 0 ? " (Default / Primary)" : "";
    return `${idx + 1}. [${addr.label}]${tag}\n   - addressId: "${addr.addressId}"\n   - Address: "${addr.formattedAddress}"`;
  });

  return (
    `### USER'S SAVED DELIVERY ADDRESSES (Cached for next 30 min):\n` +
    lines.join("\n") +
    `\n\n### ADDRESS SELECTION INSTRUCTIONS:\n` +
    `- If user specifies a location/label (e.g. "Work", "Office", "Home") or an area/locality, use that specific addressId.\n` +
    `- If user does not specify an address, use the Default/Primary addressId.\n` +
    `- You ALREADY have the addressId available above! When searching for restaurants or food, DO NOT call 'get_addresses' again. Call 'search_restaurants' directly with the food query and the chosen addressId.`
  );
}

/**
 * Clears the cached addresses for a token.
 */
export function clearCachedAddress(token: string): void {
  if (token) {
    addressCache.delete(token);
  }
}
