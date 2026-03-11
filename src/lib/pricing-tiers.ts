/**
 * Shared pricing tier definitions used across the app.
 * Single source of truth for plan names, limits, and Stripe amounts.
 */

export interface PricingTier {
  id: string;
  name: string;
  price: number;        // Monthly price in cents
  appLimit: number;      // Max serviced apps (Infinity = unlimited)
  appLimitLabel: string; // Human-readable limit
  description: string;
  popular?: boolean;
  features: string[];
}

export const TIERS: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    price: 2000,         // $20/mo
    appLimit: 5,
    appLimitLabel: "5 apps",
    description: "Get started with 5 fully serviced apps plus access to browse every project.",
    features: [
      "5 fully serviced apps with source code",
      "Browse & preview all marketplace apps",
      "Message builders directly",
      "Deploy anywhere — yours forever",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 3000,         // $30/mo
    appLimit: 20,
    appLimitLabel: "20 apps",
    description: "Scale up with 20 serviced apps — perfect for agencies and power users.",
    popular: true,
    features: [
      "20 fully serviced apps with source code",
      "Browse & preview all marketplace apps",
      "Priority builder messaging",
      "Deploy anywhere — yours forever",
    ],
  },
  {
    id: "unlimited",
    name: "Unlimited",
    price: 5000,         // $50/mo
    appLimit: Infinity,
    appLimitLabel: "Unlimited",
    description: "No limits. Claim every app on the platform with full source code.",
    features: [
      "Unlimited fully serviced apps",
      "Full source code on every project",
      "Priority builder messaging",
      "Deploy anywhere — yours forever",
    ],
  },
];

/** Look up a tier by its Stripe price (cents) */
export function getTierByPrice(priceCents: number): PricingTier | undefined {
  return TIERS.find((t) => t.price === priceCents);
}

/** Look up a tier by its ID */
export function getTierById(id: string): PricingTier | undefined {
  return TIERS.find((t) => t.id === id);
}
