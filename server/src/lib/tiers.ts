/**
 * Server-side pricing tier definitions. MUST mirror
 * `src/lib/pricing-tiers.ts` on the frontend — any drift here is a
 * client-side price-manipulation vulnerability.
 *
 * Amounts are in cents, USD.
 */
export interface ServerTier {
  id: string;
  name: string;
  /** Monthly price in cents. */
  price: number;
  /** Full-year price in cents (optional; typically ~20% off). */
  annualPrice?: number;
  /** -1 = unlimited */
  appLimit: number;
}

export const SERVER_TIERS: Record<string, ServerTier> = {
  starter: { id: "starter", name: "Starter", price: 2900, annualPrice: 27840, appLimit: 5 },
  team: { id: "team", name: "Team", price: 9900, annualPrice: 95040, appLimit: -1 },
  enterprise: { id: "enterprise", name: "Enterprise", price: 49900, annualPrice: 478800, appLimit: -1 },
};

/** One-time credit top-up amounts (cents). */
export const VALID_CREDIT_AMOUNTS = new Set([1000, 2500, 5000, 10000]);

/**
 * Given a tier id + billing cycle + amount from the client, verify the
 * amount matches the configured price. Returns the canonical tier or
 * null if the pair is invalid.
 */
export function verifySubscriptionAmount(
  tierId: string | undefined,
  billing: "monthly" | "annual" | undefined,
  amount: number
): ServerTier | null {
  if (!tierId) return null;
  const tier = SERVER_TIERS[tierId];
  if (!tier) return null;
  const expected = billing === "annual" ? tier.annualPrice : tier.price;
  if (!expected || expected !== amount) return null;
  return tier;
}
