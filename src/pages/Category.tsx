import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ListingCard } from "@/components/ListingCard";
import { supabase } from "@/integrations/supabase/client";
import { MetaTags } from "@/components/MetaTags";
import { JsonLd } from "@/components/JsonLd";
import { Button } from "@/components/ui/button";

const CATEGORY_META: Record<string, { label: string; dbValue: string; description: string; longDescription: string }> = {
  "saas-tool": {
    label: "SaaS Tools",
    dbValue: "saas_tool",
    description: "Buy ready-to-launch SaaS tools built with AI. Subscribe for ongoing support and updates from the builder.",
    longDescription: "SaaS tools on OpenDraft are fully functional, AI-built software-as-a-service applications ready for you to launch. Each comes with a builder who maintains, updates, and supports the product — so you get a developer on retainer, not just a code download.",
  },
  "ai-app": {
    label: "AI Apps",
    dbValue: "ai_app",
    description: "Buy AI-powered applications ready to deploy. Get ongoing support and feature updates from the builder.",
    longDescription: "AI apps on OpenDraft leverage the latest in artificial intelligence to solve real problems. From chatbots to data analyzers, each project comes with ongoing builder support to keep your AI running smoothly.",
  },
  "landing-page": {
    label: "Landing Pages",
    dbValue: "landing_page",
    description: "Buy conversion-optimized landing pages. Get ongoing tweaks and A/B testing support from the builder.",
    longDescription: "Landing pages on OpenDraft are designed for conversion. Built with modern frameworks and optimized for performance, each comes with a builder who can customize copy, design, and integrations for your specific needs.",
  },
  utility: {
    label: "Utilities",
    dbValue: "utility",
    description: "Buy developer utilities and productivity tools. Get bug fixes and feature updates from the builder.",
    longDescription: "Utility projects on OpenDraft are tools that solve specific developer and business problems. From admin panels to automation scripts, each comes with ongoing maintenance from the builder.",
  },
  game: {
    label: "Games",
    dbValue: "game",
    description: "Buy AI-generated games ready to publish. Get content updates and bug fixes from the builder.",
    longDescription: "Games on OpenDraft range from casual web games to interactive experiences. Each project is AI-built and comes with a builder who can add levels, fix bugs, and ship new features.",
  },
  other: {
    label: "Other Projects",
    dbValue: "other",
    description: "Browse unique AI-built projects that don't fit neatly into a category. Subscribe for ongoing builder support.",
    longDescription: "The 'Other' category on OpenDraft is where you'll find creative, experimental, and unique projects that push the boundaries of what vibe-coded apps can do.",
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
}

export default function Category() {
  const { slug } = useParams<{ slug: string }>();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const meta = slug ? CATEGORY_META[slug] : undefined;

  useEffect(() => {
    if (!meta) return;
    document.title = `${meta.label} — OpenDraft Marketplace`;
    return () => { document.title = "OpenDraft — Buy & Sell Vibe-Coded Projects"; };
  }, [meta]);

  useEffect(() => {
    if (!meta) return;
    setLoading(true);
    supabase
      .from("listings")
      .select("id,title,description,price,completeness_badge,tech_stack,screenshots,sales_count,view_count,built_with,seller_id,security_score")
      .eq("status", "live")
      .eq("category", meta.dbValue as "saas_tool" | "ai_app" | "landing_page" | "utility" | "game" | "other")
      .order("created_at", { ascending: false })
      .limit(48)
      .then(({ data }) => {
        setListings((data as Listing[]) ?? []);
        setLoading(false);
      });
  }, [meta]);

  const faqSchema = useMemo(() => {
    if (!meta) return null;
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `What are ${meta.label} on OpenDraft?`,
          acceptedAnswer: { "@type": "Answer", text: meta.longDescription },
        },
        {
          "@type": "Question",
          name: `How do I buy a ${meta.label.toLowerCase().replace(/s$/, "")} on OpenDraft?`,
          acceptedAnswer: { "@type": "Answer", text: "Browse the listings, click one you like, and subscribe or buy one-time. You get instant access plus direct support from the builder." },
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
      <Navbar />
      <CanonicalTag path={`/category/${slug}`} />
      {faqSchema && <JsonLd data={faqSchema} />}

      <section className="border-b border-border bg-card/50 py-14">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-4xl font-black tracking-tight mb-3">{meta.label}</h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-4">{meta.description}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{meta.longDescription}</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 flex-1">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-5">
          {loading ? "Loading…" : `${listings.length} projects`}
        </h2>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">No {meta.label.toLowerCase()} listed yet.</p>
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
