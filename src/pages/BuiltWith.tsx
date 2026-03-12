import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ListingCard } from "@/components/ListingCard";
import { supabase } from "@/integrations/supabase/client";
import { MetaTags } from "@/components/MetaTags";
import { JsonLd } from "@/components/JsonLd";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";

const TOOL_META: Record<string, { label: string; description: string }> = {
  lovable: {
    label: "Lovable",
    description: "Projects built with Lovable — the AI-powered app builder. Browse ready-to-launch apps with ongoing builder support.",
  },
  cursor: {
    label: "Cursor",
    description: "Projects built with Cursor — the AI code editor. Browse production-ready apps crafted with Cursor's AI pair programming.",
  },
  "claude-code": {
    label: "Claude Code",
    description: "Projects built with Claude Code — Anthropic's AI coding assistant. Browse apps built with Claude's advanced reasoning.",
  },
  bolt: {
    label: "Bolt",
    description: "Projects built with Bolt — the rapid AI app builder. Browse apps built at lightning speed with Bolt's AI stack.",
  },
  replit: {
    label: "Replit",
    description: "Projects built with Replit — the collaborative AI development platform. Browse apps built and deployed on Replit.",
  },
};

const slugToDb: Record<string, string> = {
  lovable: "lovable",
  cursor: "cursor",
  "claude-code": "claude_code",
  bolt: "bolt",
  replit: "replit",
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

export default function BuiltWith() {
  const { tool } = useParams<{ tool: string }>();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const meta = tool ? TOOL_META[tool] : undefined;
  const dbValue = tool ? slugToDb[tool] : undefined;

  // MetaTags handles title dynamically

  useEffect(() => {
    if (!dbValue) return;
    setLoading(true);
    supabase
      .from("listings")
      .select("id,title,description,price,completeness_badge,tech_stack,screenshots,sales_count,view_count,built_with,seller_id,security_score")
      .eq("status", "live")
      .eq("built_with", dbValue)
      .order("created_at", { ascending: false })
      .limit(48)
      .then(({ data }) => {
        setListings((data as Listing[]) ?? []);
        setLoading(false);
      });
  }, [dbValue]);

  if (!meta || !dbValue) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">🤔</div>
            <h2 className="text-xl font-bold mb-2">Tool not found</h2>
            <Link to="/"><Button>Back to marketplace</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Projects Built with ${meta.label}`,
    description: meta.description,
    url: `https://opendraft.co/built-with/${tool}`,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title={`Apps Built with ${meta.label} — Browse & Buy | OpenDraft`}
        description={meta.description}
        path={`/built-with/${tool}`}
      />
      <Navbar />
      <JsonLd data={collectionSchema} />

      <section className="border-b border-border bg-card/50 py-14">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-4xl font-black tracking-tight mb-3">Built with {meta.label}</h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-6">{meta.description}</p>
          <div className="inline-flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-3">
            <Rocket className="h-5 w-5 text-primary" />
            <span className="text-sm">
              Built something with {meta.label}?{" "}
              <Link to="/sell" className="font-semibold text-primary hover:underline underline-offset-4">
                List it here and start earning →
              </Link>
            </span>
          </div>
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
            <p className="text-muted-foreground mb-4">No projects built with {meta.label} yet.</p>
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
