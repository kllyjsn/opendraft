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
  annualPrice?: number;  // Annual price in cents (total for year)
  appLimit: number;      // Max serviced apps (Infinity = unlimited)
  appLimitLabel: string; // Human-readable limit
  description: string;
  popular?: boolean;
  badge?: string;
  features: string[];
  ctaLabel?: string;     // Override CTA button label
  ctaLink?: string;      // Override CTA to link instead of checkout
}

/** Annual discount percentage */
export const ANNUAL_DISCOUNT = 20;

/** Canonical value proposition — one line used everywhere */
export const VALUE_PROP = "Production-ready apps with full source code. Claim, deploy, and own — forever.";

/** Short CTA taglines by context */
export const CTA_COPY = {
  hero: "Own your software stack. Kill per-seat SaaS fees.",
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
    price: 2900,           // $29/mo
    annualPrice: 27840,    // $232/yr ($19.33/mo effective → ~$23.20/mo)
    appLimit: 5,
    appLimitLabel: "5 apps",
    description: "For individuals replacing SaaS tools with owned software.",
    features: [
      "5 fully serviced apps with source code",
      "Deploy configs for Netlify & Vercel",
      "Direct messaging with builders",
      "Security audits & READMEs",
      "Lifetime access — yours forever",
    ],
  },
  {
    id: "team",
    name: "Team",
    price: 9900,           // $99/mo
    annualPrice: 95040,    // $792/yr ($79.20/mo)
    appLimit: Infinity,
    appLimitLabel: "Unlimited",
    popular: true,
    badge: "Most popular",
    description: "A private app workspace for your team. Like Okta, but for software you own.",
    features: [
      "Unlimited apps with full source code",
      "Team workspace with app launcher",
      "Invite unlimited team members",
      "Compliance tagging (SOC2, HIPAA, GDPR)",
      "Admin approval workflow",
      "Priority builder messaging",
      "White-label & rebrand rights",
    ],
    ctaLabel: "Start team workspace",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 49900,          // $499/mo
    annualPrice: 478800,   // $3990/yr ($399/mo)
    appLimit: Infinity,
    appLimitLabel: "Unlimited",
    badge: "For organizations",
    description: "Company-wide app marketplace with SSO, governance, and dedicated support.",
    features: [
      "Everything in Team",
      "SSO / SAML integration",
      "Custom domain for workspace",
      "Department-level app catalogs",
      "API access for bulk operations",
      "Dedicated account manager",
      "SLA-backed response times",
      "Volume discount on premium apps",
    ],
    ctaLabel: "Talk to sales",
    ctaLink: "/enterprise",
  },
];

/** Paid tiers only (for pricing page subscription cards) */
export const PAID_TIERS = TIERS.filter((t) => t.price > 0);

/** Core paid tiers (shown on main pricing) */
export const CORE_PAID_TIERS = TIERS.filter((t) => t.price > 0);

/** High-ticket tiers (shown separately — empty now since all tiers shown together) */
export const ENTERPRISE_TIERS: PricingTier[] = [];

/** Look up a tier by its Stripe price (cents) */
export function getTierByPrice(priceCents: number): PricingTier | undefined {
  return TIERS.find((t) => t.price === priceCents);
}

/** Look up a tier by its ID */
export function getTierById(id: string): PricingTier | undefined {
  return TIERS.find((t) => t.id === id);
}

/** Get effective price based on billing period */
export function getEffectiveMonthlyPrice(tier: PricingTier, annual: boolean): number {
  if (!annual || !tier.annualPrice) return tier.price;
  return Math.round(tier.annualPrice / 12);
}

/** Get savings amount for annual billing */
export function getAnnualSavings(tier: PricingTier): number {
  if (!tier.annualPrice) return 0;
  return (tier.price * 12) - tier.annualPrice;
}
