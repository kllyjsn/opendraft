import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CompletenessBadge } from "@/components/CompletenessBadge";
import { SecurityBadge } from "@/components/SecurityBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { ExternalLink, Github, Star, Crown, ChevronLeft, Download, Eye, Package, Gift, MessageSquare, GitFork, RefreshCw, Wrench, Shield, Infinity, Rocket, Sparkles, Bot, CheckCircle, Pencil, GitCommit } from "lucide-react";
import { MarketingKitPanel } from "@/components/MarketingKitPanel";
import { RequestForkDialog } from "@/components/RequestForkDialog";
import { ImageGallery } from "@/components/ImageGallery";
import { DeployPanel } from "@/components/DeployPanel";
import { useToast } from "@/hooks/use-toast";
import { ChatDrawer } from "@/components/ChatDrawer";
import { RemixChain } from "@/components/RemixChain";
import { ListingImprovementPanel } from "@/components/ListingImprovementPanel";
import { ChangelogFeed } from "@/components/ChangelogFeed";
import { GremlinFloatingCTA } from "@/components/GremlinFloatingCTA";
import { ProjectGoalsEditor } from "@/components/ProjectGoalsEditor";
import { JsonLd } from "@/components/JsonLd";
import { MetaTags } from "@/components/MetaTags";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { FlagListingButton } from "@/components/FlagListingButton";
import { AgentReadyBadge } from "@/components/AgentReadyBadge";
import { PostClaimUpsell } from "@/components/PostClaimUpsell";

import { GoogleSignInButton } from "@/components/GoogleSignInButton";
const BUILT_WITH_LABELS: Record<string, string> = {
  lovable: "Lovable",
  claude_code: "Claude Code",
  cursor: "Cursor",
  bolt: "Bolt",
  replit: "Replit",
  other: "Other",
};

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  pricing_type: "one_time" | "monthly";
  completeness_badge: "prototype" | "mvp" | "production_ready";
  category: string;
  tech_stack: string[];
  github_url: string | null;
  demo_url: string | null;
  file_path: string | null;
  screenshots: string[];
  sales_count: number;
  view_count: number;
  seller_id: string;
  created_at: string;
  built_with: string | null;
  security_score: number | null;
  agent_ready?: boolean;
}

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  buyer_id: string;
}

interface Profile {
  username: string | null;
  avatar_url: string | null;
  total_sales: number;
  verified: boolean;
}

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { isSubscribed, canClaimFree, purchaseCount } = useSubscription();
  const { toast } = useToast();
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [purchased, setPurchased] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);

  // Team context — passed via ?org=slug from OrgAppGrid
  const orgSlug = new URLSearchParams(window.location.search).get("org");

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetchListing(),
      fetchReviews(),
      user ? checkPurchase() : Promise.resolve(),
    ]);
  }, [id, user]);

  // SEO meta tags handled by MetaTags component below

  async function fetchListing() {
    setLoading(true);
    const { data } = await supabase.from("listings").select("*").eq("id", id).single();
    if (data) {
      setListing(data as Listing);
      await supabase.from("listings").update({ view_count: (data.view_count ?? 0) + 1 }).eq("id", id);
      const { data: profile } = await supabase.from("public_profiles").select("username,avatar_url,total_sales,verified").eq("user_id", data.seller_id).single();
      setSeller(profile);
    }
    setLoading(false);
  }

  async function fetchReviews() {
    const { data } = await supabase.from("reviews").select("*").eq("listing_id", id).order("created_at", { ascending: false });
    setReviews((data as Review[]) ?? []);
  }

  async function checkPurchase() {
    if (!user || !id) return;
    // Sellers are treated as owners too
    const { data: listingData } = await supabase.from("listings").select("seller_id").eq("id", id).single();
    if (listingData?.seller_id === user.id) {
      setPurchased(true);
      return;
    }
    const { data } = await supabase.from("purchases").select("id").eq("listing_id", id).eq("buyer_id", user.id).maybeSingle();
    setPurchased(!!data);
  }

  async function handleDownload() {
    if (!user || !listing) return;
    setDownloading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-download-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ listingId: listing.id }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Failed to get download URL");

      if (result.signedUrl) {
        const a = document.createElement("a");
        a.href = result.signedUrl;
        a.download = `${listing.title}.zip`;
        a.click();
      } else if (result.githubUrl) {
        window.open(result.githubUrl, "_blank");
      } else {
        toast({ title: "No file available", description: "The seller hasn't uploaded a file yet." });
      }
    } catch (e) {
      toast({ title: "Download failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  }

  async function handleClaim() {
    if (!user || !listing) return;
    setClaiming(true);
    try {
      // All claims go through the edge function for server-side validation
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claim-free-listing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ listingId: listing.id }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Failed to claim");

      // Auto-create conversation so buyer and builder can chat immediately
      try {
        const { data: existingConvo } = await supabase
          .from("conversations")
          .select("id")
          .eq("buyer_id", user.id)
          .eq("seller_id", listing.seller_id)
          .eq("listing_id", listing.id)
          .maybeSingle();

        if (!existingConvo) {
          const { data: newConvo } = await supabase
            .from("conversations")
            .insert({ buyer_id: user.id, seller_id: listing.seller_id, listing_id: listing.id })
            .select("id")
            .single();

          if (newConvo) {
            await supabase.from("messages").insert({
              conversation_id: newConvo.id,
              sender_id: listing.seller_id,
              content: `Thanks for claiming ${listing.title}! 🎉 I'm your builder — feel free to ask me anything, request features, or set up a support retainer.`,
            } as any);
          }
        }
      } catch (chatErr) {
        console.error("Auto-chat creation failed (non-blocking):", chatErr);
      }

      setPurchased(true);
      toast({ title: "Project claimed! 🎉", description: "You can now download it and chat with your builder." });
      // Show upsell for free-tier users, then open chat
      if (!isSubscribed) {
        setShowUpsell(true);
      }
      setChatOpen(true);
    } catch (e) {
      toast({ title: "Claim failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setClaiming(false);
    }
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null;

  const productSchema = useMemo(() => {
    if (!listing) return null;
    const priceVal = listing.price > 0 ? listing.price.toFixed(2) : "0.00";
    const schema: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: listing.title,
      description: listing.description.slice(0, 300),
      image: listing.screenshots?.[0] || "https://opendraft.co/og-image.png",
      url: `https://opendraft.co/listing/${listing.id}`,
      applicationCategory: "WebApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: priceVal,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        seller: { "@type": "Person", name: seller?.username ?? "Anonymous" },
      },
      brand: { "@type": "Brand", name: "OpenDraft" },
    };
    if (listing.tech_stack?.length) {
      schema.keywords = listing.tech_stack.join(", ");
    }
    if (avgRating !== null && reviews.length > 0) {
      schema.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: avgRating.toFixed(1),
        reviewCount: reviews.length,
        bestRating: "5",
        worstRating: "1",
      };
      schema.review = reviews.slice(0, 5).map((r) => ({
        "@type": "Review",
        reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
        reviewBody: r.review_text ?? "",
        datePublished: r.created_at.split("T")[0],
      }));
    }
    return schema;
  }, [listing, seller, avgRating, reviews]);

  // FAQ schema for SEO
  const faqSchema = useMemo(() => {
    if (!listing) return null;
    const badgeExplain: Record<string, string> = {
      prototype: "an early-stage prototype — great for learning or building upon",
      mvp: "a minimum viable product with core features working end-to-end",
      production_ready: "a production-ready application suitable for real users",
    };
    const faqs = [
      {
        "@type": "Question",
        name: `What do I get when I purchase "${listing.title}"?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `You get instant access to download the full source code${listing.github_url ? " or view the GitHub repository" : ""}. This includes unlimited usage, direct access to the builder for support, and ongoing monthly updates.`,
        },
      },
      {
        "@type": "Question",
        name: `What stage is "${listing.title}" at?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `This project is marked as ${badgeExplain[listing.completeness_badge] ?? listing.completeness_badge}.`,
        },
      },
      {
        "@type": "Question",
        name: `What tech stack does "${listing.title}" use?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: listing.tech_stack.length > 0
            ? `It's built with ${listing.tech_stack.join(", ")}.`
            : "The tech stack details are available on the listing page.",
        },
      },
      {
        "@type": "Question",
        name: "Can I get a refund?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "All sales are final, but you can message the builder directly if you have any issues. We encourage sellers to provide excellent support.",
        },
      },
    ];
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs,
    };
  }, [listing]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-10 w-10 rounded-full gradient-hero animate-spin mx-auto mb-4 opacity-80" />
            <p className="text-muted-foreground text-sm">Loading project…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">🤔</div>
            <h2 className="text-xl font-bold mb-2">Listing not found</h2>
            <p className="text-sm text-muted-foreground mb-5">It may have been removed or the link is incorrect.</p>
            <Link to="/"><Button>Back to marketplace</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const isFree = true; // Projects are free to claim with a subscription plan

  return (
    <div className="min-h-screen flex flex-col">
      
      <Navbar />
      {listing && (
        <MetaTags
          title={`${listing.title} — Buy on OpenDraft`}
          description={listing.description.slice(0, 155)}
          path={`/listing/${listing.id}`}
          ogImage={listing.screenshots?.[0] || "https://opendraft.co/og-image.png"}
        />
      )}
      {productSchema && <JsonLd data={productSchema} />}
      {faqSchema && <JsonLd data={faqSchema} />}
      <main className="flex-1 container mx-auto px-4 py-10 page-enter">
        {/* Breadcrumb */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to browse
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: images + description */}
          <div className="lg:col-span-2 space-y-8">

            {/* Image gallery */}
            <ImageGallery images={listing.screenshots} title={listing.title} />

            {/* Title + meta */}
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-black leading-tight">{listing.title}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <CompletenessBadge level={listing.completeness_badge} />
                <SecurityBadge score={listing.security_score} />
                {listing.agent_ready && <AgentReadyBadge />}
                {avgRating !== null && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    <span className="font-semibold text-foreground">{avgRating.toFixed(1)}</span>
                    <span>({reviews.length} {reviews.length === 1 ? "review" : "reviews"})</span>
                  </span>
                )}
                {listing.sales_count > 0 && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Package className="h-3.5 w-3.5" />
                    {listing.sales_count} sold
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Eye className="h-3.5 w-3.5" />
                  {listing.view_count} views
                </span>
                {listing.built_with && BUILT_WITH_LABELS[listing.built_with] && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2.5 py-0.5 text-xs font-semibold text-accent">
                    🛠 Built with {BUILT_WITH_LABELS[listing.built_with]}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-[0.95rem]">{listing.description}</p>
            </div>

            {/* Tech stack */}
            {listing.tech_stack.length > 0 && (
              <div>
                <h3 className="font-bold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {listing.tech_stack.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg bg-muted border border-border/40 px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Go-To-Market Kit — visible to all visitors */}
            <MarketingKitPanel listingId={listing.id} />

          </div>

          {/* Right: sidebar */}
          <div className="space-y-4">
            {purchased ? (
              /* ───── OWNER EXPERIENCE ───── */
              <div className="space-y-4 sticky top-20">
                {/* Ownership hero card */}
                <div className="rounded-2xl border border-primary/20 bg-card overflow-hidden shadow-card">
                  <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-[var(--gradient-hero)] opacity-8" />
                    <div className="relative px-5 py-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <CheckCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">You own this project</p>
                        <p className="text-[11px] text-muted-foreground">Full source code · Deploy anywhere</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-2 border-t border-border/30">
                    <Button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-11 text-sm font-bold"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {downloading ? "Preparing…" : "Download source code"}
                    </Button>
                    <DeployPanel
                      listingId={listing.id}
                      listingTitle={listing.title}
                      hasFile={!!listing.file_path}
                      githubUrl={listing.github_url}
                    />
                  </div>
                </div>

                {/* Edit in workspace — the Lovable-style CTA */}
                {user?.id === listing.seller_id && (
                  <Link to={`/listing/${listing.id}/edit`}>
                    <Button className="w-full h-12 text-sm font-bold bg-card border-2 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all gap-2 rounded-2xl">
                      <Pencil className="h-4 w-4" />
                      Edit in workspace
                    </Button>
                  </Link>
                )}

                {/* AI Improvement — prominent for owners */}
                <div className="rounded-2xl border border-accent/20 bg-card overflow-hidden shadow-card">
                  <button
                    onClick={() => document.getElementById("gremlins-panel")?.scrollIntoView({ behavior: "smooth" })}
                    className="w-full text-left p-4 hover:bg-accent/5 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/15 transition-colors">
                        <Bot className="h-5 w-5 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">Improve with AI</p>
                        <p className="text-[11px] text-muted-foreground">Get suggestions to make your app better</p>
                      </div>
                      <Sparkles className="h-4 w-4 text-accent/50 group-hover:text-accent transition-colors" />
                    </div>
                  </button>
                </div>

                {/* Demo + GitHub links */}
                {(listing.demo_url || listing.github_url) && (
                  <div className="space-y-2">
                    {listing.demo_url && (
                      <a href={listing.demo_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full border-border/60 hover:border-primary/40 transition-colors text-sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View live demo
                        </Button>
                      </a>
                    )}
                    {listing.github_url && (
                      <a href={listing.github_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full border-border/60 hover:border-primary/40 transition-colors text-sm">
                          <Github className="h-4 w-4 mr-2" />
                          View on GitHub
                        </Button>
                      </a>
                    )}
                  </div>
                )}

                {/* Project Goals */}
                <ProjectGoalsEditor listingId={listing.id} />

                {/* Builder & community actions */}
                {listing.seller_id !== user?.id && (
                  <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card space-y-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Builder & Community</p>
                    <Button
                      onClick={() => setChatOpen(true)}
                      className="w-full h-10 text-sm font-bold border-2 border-primary bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Chat with your builder
                    </Button>
                    <Link to={`/sell?remix=${listing.id}`}>
                      <Button variant="outline" className="w-full border-border/60 hover:border-primary/40 transition-colors">
                        <GitFork className="h-4 w-4 mr-2" />
                        Remix this project
                      </Button>
                    </Link>
                    <RequestForkDialog
                      listingId={listing.id}
                      listingTitle={listing.title}
                      builderId={listing.seller_id}
                      builderName={seller?.username ?? "Builder"}
                    />
                  </div>
                )}

                {/* Seller card */}
                {seller && (
                  <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Builder</p>
                    <div className="flex items-center gap-3">
                      <Link to={`/builder/${listing.seller_id}`} className="h-10 w-10 rounded-full gradient-hero flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-glow hover:opacity-80 transition-opacity">
                        {seller.username?.[0]?.toUpperCase() ?? "?"}
                      </Link>
                      <div>
                        <div className="flex items-center gap-1">
                          <Link to={`/builder/${listing.seller_id}`} className="font-bold text-sm hover:text-primary transition-colors">
                            {seller.username ?? "Anonymous"}
                          </Link>
                          {seller.verified && <VerifiedBadge />}
                        </div>
                        <p className="text-xs text-muted-foreground">{seller.total_sales ?? 0} total sales</p>
                      </div>
                    </div>
                    <RemixChain listingId={listing.id} />
                    <div className="mt-3 flex justify-end">
                      <FlagListingButton listingId={listing.id} sellerId={listing.seller_id} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ───── NON-OWNER EXPERIENCE ───── */
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card sticky top-20 hover:shadow-card-hover transition-shadow duration-500">
                  {/* Price */}
                  <div className="mb-5">
                    <div className="text-4xl font-black">Free</div>
                    <p className="text-xs text-muted-foreground">
                      Full source code · Included with your plan
                    </p>
                  </div>

                  {(isSubscribed || canClaimFree) ? (
                    user ? (
                      <div className="space-y-2">
                        <Button
                          onClick={handleClaim}
                          disabled={claiming}
                          className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-12 text-base font-bold transition-opacity"
                        >
                          <Gift className="h-4 w-4 mr-2" />
                          {claiming ? "Claiming…" : canClaimFree && !isSubscribed ? "Claim Free — Your First App!" : "Claim Project"}
                        </Button>
                        {canClaimFree && !isSubscribed && (
                          <p className="text-center text-xs text-muted-foreground">
                            ✨ No subscription needed for your first app
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <GoogleSignInButton label="Sign up free to claim" />
                        <p className="text-center text-[11px] text-muted-foreground">
                          ✨ No coding experience needed · Your first app is free
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="space-y-3">
                      <Link to="/credits">
                        <Button className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-12 text-base font-bold transition-opacity">
                          <Crown className="h-4 w-4 mr-2" />
                          Subscribe for more apps — $20/mo
                        </Button>
                      </Link>
                      <p className="text-center text-xs text-muted-foreground font-medium">You've claimed your free app · Subscribe to unlock more</p>
                      <Button
                        variant="outline"
                        disabled
                        className="w-full border-border/60 text-muted-foreground gap-2 cursor-not-allowed"
                      >
                        <Rocket className="h-4 w-4" />
                        Deploy to cloud after claiming
                      </Button>
                      {user && listing.seller_id !== user.id && (
                        <RequestForkDialog
                          listingId={listing.id}
                          listingTitle={listing.title}
                          builderId={listing.seller_id}
                          builderName={seller?.username ?? "Builder"}
                        />
                      )}
                    </div>
                  )}

                  {/* Secondary actions */}
                  {(listing.demo_url || listing.github_url) && (
                    <div className="mt-3 space-y-2">
                      {listing.demo_url && (
                        <a href={listing.demo_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" className="w-full border-border/60 hover:border-primary/40 transition-colors">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Live Demo
                          </Button>
                        </a>
                      )}
                      {listing.github_url && (
                        <a href={listing.github_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" className="w-full border-border/60 hover:border-primary/40 transition-colors">
                            <Github className="h-4 w-4 mr-2" />
                            View on GitHub
                          </Button>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Social proof */}
                  <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" /> Expert-built software
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" /> Full source code
                    </span>
                    <span className="flex items-center gap-1">
                      🔒 Security audited
                    </span>
                  </div>

                  {/* Early Adopter Advantage */}
                  {listing.sales_count <= 5 && (
                    <div className="mt-5 rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-accent text-xs">🚀</span>
                        <p className="text-xs font-black uppercase tracking-wide text-accent">Early Adopter Advantage</p>
                      </div>
                      <p className="text-[13px] font-semibold leading-snug">Be first — shape this product for your needs</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Early buyers get the builder's full attention. Request features, influence the roadmap, and get a product tailored to <span className="text-foreground font-medium">your</span> workflow — before anyone else.
                      </p>
                      {listing.sales_count === 0 && (
                        <p className="text-[10px] font-bold text-accent flex items-center gap-1">
                          ✨ No buyers yet — you'll be #1
                        </p>
                      )}
                    </div>
                  )}

                  {/* Value banner */}
                  <div className="mt-5 rounded-xl gradient-hero p-[1px]">
                    <div className="rounded-[11px] bg-card p-4 space-y-1.5 text-center">
                      <p className="text-xs font-black uppercase tracking-wide text-primary">What you get</p>
                      <p className="text-[13px] font-semibold leading-snug">Full source code + one-click deploy</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">Claim this project to get the complete source code, deploy it anywhere, and make it yours forever.</p>
                    </div>
                  </div>

                  {/* What's included */}
                  <div className="mt-5 pt-5 border-t border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">What's included</p>
                    <div className="space-y-3">
                      <div className="flex gap-2.5">
                        <Shield className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-xs">Dedicated support</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">Get direct help from the builder whenever you need it — no tickets, no wait.</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5">
                        <Wrench className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-xs">Personalized feature requests</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">Request custom features tailored to your needs — the builder prioritizes them for you.</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5">
                        <Infinity className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-xs">Unlimited usage</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">No caps or restrictions — use the app as much as you want.</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5">
                        <RefreshCw className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-xs">Deploy anywhere</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">One-click deploy to OpenDraft Cloud, Vercel, or Netlify — your choice.</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5">
                        <MessageSquare className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-xs">Direct builder access</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">Message the builder anytime for ideas, questions, or collaboration.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seller card */}
                {seller && (
                  <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Seller</p>
                    <div className="flex items-center gap-3 mb-4">
                      <Link to={`/builder/${listing.seller_id}`} className="h-10 w-10 rounded-full gradient-hero flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-glow hover:opacity-80 transition-opacity">
                        {seller.username?.[0]?.toUpperCase() ?? "?"}
                      </Link>
                      <div>
                        <div className="flex items-center gap-1">
                          <Link to={`/builder/${listing.seller_id}`} className="font-bold text-sm hover:text-primary transition-colors">
                            {seller.username ?? "Anonymous"}
                          </Link>
                          {seller.verified && <VerifiedBadge />}
                        </div>
                        <p className="text-xs text-muted-foreground">{seller.total_sales ?? 0} total sales</p>
                      </div>
                    </div>
                    {!authLoading && (
                      user && listing.seller_id === user.id ? (
                        <p className="text-xs text-muted-foreground text-center">This is your listing</p>
                      ) : user ? (
                        <Button
                          onClick={() => setChatOpen(true)}
                          className="w-full h-11 text-sm font-bold gradient-hero text-white border-0 shadow-glow hover:opacity-90 transition-opacity"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Ask {seller.username ?? "seller"} a question
                        </Button>
                      ) : (
                        <div className="space-y-1.5">
                          <GoogleSignInButton label={`Sign up to message ${seller.username ?? "seller"}`} />
                        </div>
                      )
                    )}
                    <RemixChain listingId={listing.id} />
                    <div className="mt-3 flex justify-end">
                      <FlagListingButton listingId={listing.id} sellerId={listing.seller_id} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Changelog — code changes made by AI */}
        {user && purchased && (
          <div className="mt-10">
            <div className="mb-4 flex items-center gap-2">
              <GitCommit className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-black">Code Changelog</h2>
              <span className="text-xs text-muted-foreground ml-1">What's been changed</span>
            </div>
            <ChangelogFeed listingId={listing.id} limit={15} />
          </div>
        )}

        {/* Improvement panel for owners — prominent placement */}
        {user && purchased && (
          <div className="mt-10" id="gremlins-panel">
            <div className="mb-4 flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-black">AI-Powered Improvements</h2>
            </div>
            <ListingImprovementPanel
              listingId={listing.id}
              listingTitle={listing.title}
              demoUrl={listing.demo_url}
            />
          </div>
        )}

        {/* Floating CTA for owners */}
        {user && purchased && (
          <GremlinFloatingCTA
            onClick={() => {
              document.getElementById("gremlins-panel")?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        )}

        {/* Reviews — full width below the grid */}
        <div className="mt-12">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            Reviews
            {reviews.length > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-sm text-muted-foreground font-normal">{reviews.length}</span>
            )}
          </h3>
          {reviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
              <Star className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No reviews yet. Be the first to buy and review!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  {r.review_text && <p className="text-sm text-muted-foreground leading-relaxed">{r.review_text}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      
      {user && listing && listing.seller_id !== user.id && (
        <ChatDrawer
          open={chatOpen}
          onOpenChange={setChatOpen}
          conversationId={null}
          listingId={listing.id}
          sellerId={listing.seller_id}
          listingTitle={listing.title}
          otherUsername={seller?.username ?? "Seller"}
          otherUserId={listing.seller_id}
        />
      )}

      <PostClaimUpsell
        open={showUpsell}
        onClose={() => setShowUpsell(false)}
        claimedTitle={listing?.title}
      />
    </div>
  );
}
