/**
 * /apps/:vertical — SEO vertical landing pages
 * e.g. /apps/restaurants, /apps/salons, /apps/fitness
 */
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ListingCard } from "@/components/ListingCard";
import { MetaTags } from "@/components/MetaTags";
import { JsonLd } from "@/components/JsonLd";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Search } from "lucide-react";

interface VerticalConfig {
  title: string;
  headline: string;
  description: string;
  metaDescription: string;
  searchTerms: string[];
  icon: string;
  priceAnchor: string;
}

const VERTICALS: Record<string, VerticalConfig> = {
  restaurants: {
    title: "Restaurant Apps",
    headline: "Apps built for restaurants",
    description: "Online ordering, reservations, loyalty programs, and menu management — ready to launch in minutes, not months.",
    metaDescription: "Production-ready restaurant apps: online ordering, reservations, loyalty programs. Launch your restaurant's digital presence for a fraction of agency costs.",
    searchTerms: ["restaurant", "food", "ordering", "menu", "reservation", "dining"],
    icon: "🍽️",
    priceAnchor: "Agencies charge $5K–$15K. Our apps start at $0.",
  },
  salons: {
    title: "Salon & Spa Apps",
    headline: "Apps built for salons & spas",
    description: "Appointment booking, portfolio showcases, client management, and loyalty programs — designed for beauty professionals.",
    metaDescription: "Production-ready salon and spa apps: appointment booking, portfolios, client management. Launch your beauty business online instantly.",
    searchTerms: ["salon", "spa", "beauty", "booking", "appointment", "hair"],
    icon: "💇",
    priceAnchor: "Skip the $8K agency bill. Launch today.",
  },
  fitness: {
    title: "Fitness & Wellness Apps",
    headline: "Apps built for fitness & wellness",
    description: "Class booking, member portals, workout tracking, and nutrition planning — built for gyms, studios, and wellness coaches.",
    metaDescription: "Production-ready fitness apps: class booking, member portals, workout tracking. Digital tools for gyms, studios, and wellness coaches.",
    searchTerms: ["fitness", "gym", "workout", "health", "wellness", "yoga", "exercise"],
    icon: "💪",
    priceAnchor: "Professional fitness apps from $0. No coding needed.",
  },
  "real-estate": {
    title: "Real Estate Apps",
    headline: "Apps built for real estate",
    description: "Property listings, virtual tours, CRM tools, and lead capture — everything an agent or brokerage needs to go digital.",
    metaDescription: "Production-ready real estate apps: listings, virtual tours, CRM, lead capture. Digital tools for agents and brokerages.",
    searchTerms: ["real estate", "property", "listing", "agent", "home", "housing"],
    icon: "🏠",
    priceAnchor: "Ditch the $10K custom build. Launch in minutes.",
  },
  healthcare: {
    title: "Healthcare Apps",
    headline: "Apps built for healthcare",
    description: "Patient portals, appointment scheduling, telehealth, and intake forms — HIPAA-aware design for clinics and practices.",
    metaDescription: "Production-ready healthcare apps: patient portals, scheduling, telehealth. Digital solutions for clinics and medical practices.",
    searchTerms: ["healthcare", "medical", "clinic", "patient", "doctor", "dental", "health"],
    icon: "🏥",
    priceAnchor: "Modern patient experiences without the $15K agency price tag.",
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

export default function AppsVertical() {
  const { vertical } = useParams<{ vertical: string }>();
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const config = vertical ? VERTICALS[vertical] : null;

  useEffect(() => {
    if (!config) return;
    fetchListings();
  }, [vertical]);

  async function fetchListings() {
    if (!config) return;
    setLoading(true);

    // Search across all terms for this vertical
    const allResults: Listing[] = [];
    const seenIds = new Set<string>();

    for (const term of config.searchTerms.slice(0, 3)) {
      const { data } = await supabase.rpc("search_listings", {
        search_query: term,
        page_limit: 12,
        page_offset: 0,
      });
      if (data) {
        for (const item of data as unknown as Listing[]) {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            allResults.push(item);
          }
        }
      }
    }

    // Also get general live listings as fallback
    if (allResults.length < 6) {
      const { data } = await supabase
        .from("listings")
        .select("id,title,description,price,completeness_badge,tech_stack,screenshots,sales_count,view_count,built_with,seller_id")
        .eq("status", "live")
        .order("sales_count", { ascending: false })
        .limit(12);
      if (data) {
        for (const item of data as Listing[]) {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            allResults.push(item);
          }
        }
      }
    }

    setListings(allResults.slice(0, 12));
    setLoading(false);
  }

  if (!config) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-4xl mb-4">🔍</p>
            <h1 className="text-xl font-bold mb-2">Vertical not found</h1>
            <p className="text-muted-foreground text-sm mb-4">
              Try: <Link to="/apps/restaurants" className="text-primary hover:underline">restaurants</Link>,{" "}
              <Link to="/apps/salons" className="text-primary hover:underline">salons</Link>, or{" "}
              <Link to="/apps/fitness" className="text-primary hover:underline">fitness</Link>
            </p>
            <Link to="/"><Button variant="outline">Back to homepage</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": config.title,
    "description": config.metaDescription,
    "url": `https://opendraft.co/apps/${vertical}`,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": listings.length,
    },
  };

  return (
    <div className="min-h-screen flex flex-col">
      <MetaTags
        title={`${config.title} — Ready to Launch | OpenDraft`}
        description={config.metaDescription}
        path={`/apps/${vertical}`}
      />
      <JsonLd data={[jsonLd]} />
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-12 pb-10 md:pt-20 md:pb-14">
        <div className="absolute -top-40 -right-40 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-4xl md:text-5xl mb-4">{config.icon}</p>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight mb-3">
              {config.headline}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto mb-4 leading-relaxed">
              {config.description}
            </p>
            <p className="text-xs font-semibold text-primary mb-6">{config.priceAnchor}</p>

            {!user && (
              <div className="max-w-xs mx-auto mb-6">
                <GoogleSignInButton label="Get started free" />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-primary/60" />
                Full source code
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-accent/60" />
                Deploy in minutes
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-secondary/60" />
                No coding needed
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Listings grid */}
      <section className="container mx-auto px-4 pb-20">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-5">
          {loading ? "Loading…" : `${listings.length} apps available`}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground animate-pulse">Finding the best apps…</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
            {listings.map((listing) => (
              <ListingCard key={listing.id} {...listing} />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Don't see what you need? Describe it and we'll build it.
          </p>
          <Link to="/">
            <Button className="gap-2">
              <Search className="h-4 w-4" /> Browse all apps <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
