import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ListingCard } from "@/components/ListingCard";
import { supabase } from "@/integrations/supabase/client";
import { MetaTags } from "@/components/MetaTags";
import { JsonLd } from "@/components/JsonLd";
import { Button } from "@/components/ui/button";
import { CATEGORY_GREMLINS } from "@/components/CategoryGremlins";

import homeKitchenImg from "@/assets/category-home-kitchen.jpg";
import healthFitnessImg from "@/assets/category-health-fitness.jpg";
import personalFinanceImg from "@/assets/category-personal-finance.jpg";
import productivityImg from "@/assets/category-productivity.jpg";
import builtForAgentsImg from "@/assets/category-built-for-agents.jpg";

interface LifestyleCategoryMeta {
  label: string;
  headline: string;
  description: string;
  editorial: string;
  image: string;
  searchTerms: string[];
}

const LIFESTYLE_META: Record<string, LifestyleCategoryMeta> = {
  "home-kitchen": {
    label: "Home & Kitchen",
    headline: "Apps that make home life effortless.",
    description: "Recipe generators, meal planners, grocery lists, smart home dashboards — ready to launch.",
    editorial: "From AI-powered recipe creators to pantry trackers, these apps are built for the modern kitchen. Each one comes with full source code and ongoing builder support.",
    image: homeKitchenImg,
    searchTerms: ["recipe", "cook", "meal", "kitchen", "food", "grocery", "pantry", "restaurant", "menu", "dining", "home"],
  },
  "health-fitness": {
    label: "Health & Fitness",
    headline: "Your wellness journey, powered by code.",
    description: "Workout trackers, habit builders, meditation timers, nutrition calculators — claim and customize.",
    editorial: "Whether you're tracking macros, building a gym routine, or logging your runs — these production-ready apps put wellness at your fingertips. Built by developers, perfected for you.",
    image: healthFitnessImg,
    searchTerms: ["fitness", "workout", "health", "gym", "exercise", "yoga", "meditation", "nutrition", "wellness", "habit", "weight", "golf", "kettle"],
  },
  "personal-finance": {
    label: "Personal Finance",
    headline: "Take control of every dollar.",
    description: "Budget trackers, invoice tools, expense managers, crypto dashboards — production-ready.",
    editorial: "Stop guessing where your money goes. These finance apps give you beautiful dashboards, smart budgeting, and real-time insights — all with source code you own.",
    image: personalFinanceImg,
    searchTerms: ["finance", "budget", "invoice", "expense", "money", "payment", "crypto", "stock", "banking", "accounting", "tax", "payroll"],
  },
  productivity: {
    label: "Productivity & Work",
    headline: "Work smarter. Ship faster.",
    description: "Task managers, note-taking apps, CRM tools, project dashboards — deploy in minutes.",
    editorial: "From Kanban boards to AI-powered note apps, these productivity tools are designed to eliminate busywork. Claim one, customize it, and make it yours.",
    image: productivityImg,
    searchTerms: ["task", "todo", "note", "project", "crm", "dashboard", "planner", "calendar", "schedule", "kanban", "productivity", "workspace", "portfolio"],
  },
  "built-for-agents": {
    label: "Built for Agents",
    headline: "Software that agents want to buy.",
    description: "MCP servers, API gateways, automation pipelines, monitoring tools — built for the agent economy.",
    editorial: "Aaron Levie says all software will have to be built for agents. These tools are designed for autonomous consumption — MCP servers, headless APIs, webhook handlers, and data pipelines that agents can discover, purchase, and deploy without human intervention.",
    image: builtForAgentsImg,
    searchTerms: ["mcp", "api", "agent", "webhook", "automation", "pipeline", "monitor", "bot", "headless", "server", "proxy", "sync", "scraper", "cli", "workflow"],
  },
};

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  completeness_badge: "prototype" | "mvp" | "production_ready";
  tech_stack: string[];
  screenshots: string[];
  sales_count: number;
  view_count: number;
  built_with: string | null;
  seller_id: string;
  security_score: number | null;
  staff_pick: boolean;
}

export default function LifestyleCategory() {
  const { slug } = useParams<{ slug: string }>();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const meta = slug ? LIFESTYLE_META[slug] : undefined;

  useEffect(() => {
    if (!meta) return;
    setLoading(true);

    async function search() {
      // Use search_listings RPC with combined terms for better matching
      const searchQuery = meta!.searchTerms.slice(0, 5).join(" | ");
      
      const { data } = await supabase.rpc("search_listings", {
        search_query: searchQuery,
        page_limit: 48,
        page_offset: 0,
        sort_by: "popular",
      });

      let results = (data ?? []) as unknown as Listing[];

      // Also fetch staff picks for this lifestyle category
      const { data: staffPicks } = await supabase
        .from("listings")
        .select("id,title,description,price,completeness_badge,tech_stack,screenshots,sales_count,view_count,built_with,seller_id,security_score,staff_pick")
        .eq("status", "live")
        .eq("staff_pick", true)
        .eq("staff_pick_category", slug!);

      const staffPickIds = new Set((staffPicks ?? []).map((sp) => sp.id));
      
      // Merge and dedupe
      const existingIds = new Set(results.map((r) => r.id));
      const extraPicks = (staffPicks ?? []).filter((sp) => !existingIds.has(sp.id)) as Listing[];
      results = [...extraPicks, ...results];

      // Sort: staff_pick first, then production_ready, then has screenshots, then sales
      results.sort((a, b) => {
        const aStaff = staffPickIds.has(a.id) ? 1 : 0;
        const bStaff = staffPickIds.has(b.id) ? 1 : 0;
        if (bStaff !== aStaff) return bStaff - aStaff;

        const badgeOrder = { production_ready: 3, mvp: 2, prototype: 1 };
        const aBadge = badgeOrder[a.completeness_badge] ?? 0;
        const bBadge = badgeOrder[b.completeness_badge] ?? 0;
        if (bBadge !== aBadge) return bBadge - aBadge;

        const aImg = a.screenshots?.length > 0 && a.screenshots[0] !== "" ? 1 : 0;
        const bImg = b.screenshots?.length > 0 && b.screenshots[0] !== "" ? 1 : 0;
        if (bImg !== aImg) return bImg - aImg;

        return (b.sales_count ?? 0) - (a.sales_count ?? 0);
      });

      setListings(results);
      setLoading(false);
    }

    search();
  }, [meta, slug]);

  const faqSchema = useMemo(() => {
    if (!meta) return null;
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `What ${meta.label} apps are available on OpenDraft?`,
          acceptedAnswer: { "@type": "Answer", text: meta.editorial },
        },
      ],
    };
  }, [meta]);

  if (!meta) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">🤔</div>
            <h2 className="text-xl font-bold mb-2">Category not found</h2>
            <Link to="/"><Button>Back to marketplace</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title={`${meta.label} Apps — Ready to Launch | OpenDraft`}
        description={meta.description}
        path={`/category/${slug}`}
      />
      <Navbar />
      {faqSchema && <JsonLd data={faqSchema} />}

      {/* Editorial hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={meta.image}
            alt={meta.label}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        </div>

        <div className="relative container mx-auto px-4 pt-20 pb-12 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-start gap-4"
          >
            <div className="flex-1">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-3">
                {meta.label}
              </span>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 leading-[1.05]">
                {meta.headline}
              </h1>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-xl">
                {meta.editorial}
              </p>
            </div>
            {/* Category gremlin */}
            {slug && CATEGORY_GREMLINS[slug] && (() => {
              const Gremlin = CATEGORY_GREMLINS[slug];
              return (
                <motion.div
                  className="hidden md:block shrink-0 drop-shadow-xl"
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1.8, rotate: 0 }}
                  transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Gremlin />
                </motion.div>
              );
            })()}
          </motion.div>
        </div>
      </section>

      {/* Grid */}
      <section className="container mx-auto px-4 py-10 flex-1">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-5">
          {loading ? "Loading…" : `${listings.length} apps`}
        </h2>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">No {meta.label.toLowerCase()} apps listed yet.</p>
            <Link to="/sell"><Button className="gradient-hero text-white border-0">List yours</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
            {listings.map((listing) => (
              <ListingCard key={listing.id} {...listing} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
