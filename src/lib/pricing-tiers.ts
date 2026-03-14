/**
 * Shared pricing tier definitions used across the app.
 * Single source of truth for plan names, limits, Stripe amounts,
 * and canonical "what you get" entitlements.
 */

export interface ClaimEntitlement {
  label: string;
  icon: "code" | "deploy" | "chat" | "lock" | "refresh" | "zap";
}

/** What every claimed app includes — used on pricing, listing detail, checkout */
export const CLAIM_ENTITLEMENTS: ClaimEntitlement[] = [
  { label: "Full source code (React + TypeScript)", icon: "code" },
  { label: "Netlify / Vercel deploy configs included", icon: "deploy" },
  { label: "Direct messaging with the builder", icon: "chat" },
  { label: "Security-audited & README generated", icon: "lock" },
  { label: "Lifetime access — yours forever", icon: "zap" },
];

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

/** Canonical value proposition — one line used everywhere */
export const VALUE_PROP = "Production-ready apps with full source code. Claim, deploy, and own — forever.";

/** Short CTA taglines by context */
export const CTA_COPY = {
  hero: "Claim & deploy production-ready apps in minutes",
  pricing: "Every plan includes full source code, deploy configs, and builder support",
  sell: "List once. Earn on every claim. Zero infrastructure.",
  card: "Full source · Deploy-ready · Builder support",
} as const;

export const FREE_TIER: PricingTier = {
  id: "free",
  name: "Free",
  price: 0,
  appLimit: 1,
  appLimitLabel: "1 app",
  description: "Claim your first app with complete source code — no card required.",
  features: [
    "1 fully serviced app with source code",
    "Deploy configs for Netlify & Vercel",
    "Direct messaging with the builder",
    "Security audit & auto-generated README",
    "Lifetime access — yours forever",
  ],
};

export const TIERS: PricingTier[] = [
  FREE_TIER,
  {
    id: "starter",
    name: "Starter",
    price: 2000,         // $20/mo
    appLimit: 5,
    appLimitLabel: "5 apps",
    description: "Claim 5 production-ready apps per month with everything included.",
    features: [
      "5 fully serviced apps with source code",
      "Deploy configs for Netlify & Vercel",
      "Direct messaging with builders",
      "Security audits & auto-generated READMEs",
      "Lifetime access — yours forever",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 3000,         // $30/mo
    appLimit: 20,
    appLimitLabel: "20 apps",
    description: "Scale with 20 apps/month — ideal for agencies and power users.",
    popular: true,
    features: [
      "20 fully serviced apps with source code",
      "Deploy configs for Netlify & Vercel",
      "Priority builder messaging",
      "Security audits & auto-generated READMEs",
      "Lifetime access — yours forever",
    ],
  },
  {
    id: "unlimited",
    name: "Unlimited",
    price: 5000,         // $50/mo
    appLimit: Infinity,
    appLimitLabel: "Unlimited",
    description: "No limits. Claim every app on the platform with everything included.",
    features: [
      "Unlimited fully serviced apps",
      "Deploy configs for Netlify & Vercel",
      "Priority builder messaging",
      "Security audits & auto-generated READMEs",
      "Lifetime access — yours forever",
    ],
  },
];

/** Paid tiers only (for pricing page subscription cards) */
export const PAID_TIERS = TIERS.filter((t) => t.price > 0);

/** Look up a tier by its Stripe price (cents) */
export function getTierByPrice(priceCents: number): PricingTier | undefined {
  return TIERS.find((t) => t.price === priceCents);
}

/** Look up a tier by its ID */
export function getTierById(id: string): PricingTier | undefined {
  return TIERS.find((t) => t.id === id);
}
