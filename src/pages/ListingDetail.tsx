import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CompletenessBadge } from "@/components/CompletenessBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ExternalLink, Github, Star, ShoppingCart, ChevronLeft, ChevronRight, Download, Eye, Package, Gift, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MakeOfferDialog } from "@/components/MakeOfferDialog";
import { ChatDrawer } from "@/components/ChatDrawer";

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
  completeness_badge: "prototype" | "mvp" | "production_ready";
  category: string;
  tech_stack: string[];
  github_url: string | null;
  demo_url: string | null;
  screenshots: string[];
  sales_count: number;
  view_count: number;
  seller_id: string;
  created_at: string;
  built_with: string | null;
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
}

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchased, setPurchased] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetchListing(),
      fetchReviews(),
      user ? checkPurchase() : Promise.resolve(),
    ]);
  }, [id, user]);

  async function fetchListing() {
    setLoading(true);
    const { data } = await supabase.from("listings").select("*").eq("id", id).single();
    if (data) {
      setListing(data as Listing);
      await supabase.from("listings").update({ view_count: (data.view_count ?? 0) + 1 }).eq("id", id);
      const { data: profile } = await supabase.from("profiles").select("username,avatar_url,total_sales").eq("user_id", data.seller_id).single();
      setSeller(profile);
    }
    setLoading(false);
  }

  async function fetchReviews() {
    const { data } = await supabase.from("reviews").select("*").eq("listing_id", id).order("created_at", { ascending: false });
    setReviews((data as Review[]) ?? []);
  }

  async function checkPurchase() {
    if (!user) return;
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
      setPurchased(true);
      toast({ title: "Project claimed! 🎉", description: "You now have access to download it." });
    } catch (e) {
      toast({ title: "Claim failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setClaiming(false);
    }
  }

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

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null;

  const isFree = listing.price === 0;
  const priceLabel = isFree ? "Free" : `$${(listing.price / 100).toFixed(2)}`;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10">
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
            {listing.screenshots.length > 0 ? (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-muted aspect-video ring-1 ring-border/40 shadow-card">
                  <img
                    src={listing.screenshots[activeImg]}
                    alt={`Screenshot ${activeImg + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {listing.screenshots.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImg((i) => (i - 1 + listing.screenshots.length) % listing.screenshots.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/80 transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setActiveImg((i) => (i + 1) % listing.screenshots.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/80 transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      {/* Slide dots */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {listing.screenshots.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveImg(i)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${activeImg === i ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
                {listing.screenshots.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {listing.screenshots.map((src, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        className={`flex-shrink-0 h-16 w-24 rounded-xl overflow-hidden border-2 transition-all ${
                          activeImg === i ? "border-primary shadow-glow" : "border-transparent opacity-50 hover:opacity-80"
                        }`}
                      >
                        <img src={src} alt={`Thumb ${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl aspect-video gradient-hero opacity-40 flex items-center justify-center ring-1 ring-border/40">
                <span className="text-6xl">⚡</span>
              </div>
            )}

            {/* Title + meta */}
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-black leading-tight">{listing.title}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <CompletenessBadge level={listing.completeness_badge} />
                {avgRating !== null && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    <span className="font-semibold text-foreground">{avgRating.toFixed(1)}</span>
                    <span>({reviews.length} {reviews.length === 1 ? "review" : "reviews"})</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Package className="h-3.5 w-3.5" />
                  {listing.sales_count} sold
                </span>
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

            {/* Reviews */}
            <div>
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
                <div className="space-y-3">
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
          </div>

          {/* Right: buy card */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card sticky top-20">
              {/* Price */}
              <div className="mb-5">
                <div className={`text-4xl font-black mb-0.5 ${isFree ? "text-primary" : ""}`}>{priceLabel}</div>
                <p className="text-xs text-muted-foreground">
                  {isFree ? "Free forever · Instant access" : "One-time purchase · Instant delivery"}
                </p>
              </div>

              {purchased ? (
                <div className="space-y-3">
                  <div className="rounded-xl bg-primary/8 border border-primary/20 px-4 py-3 text-center">
                    <p className="font-bold text-primary text-sm">✓ You own this project</p>
                  </div>
                  <Button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-12 text-base font-bold"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {downloading ? "Preparing download…" : "Download Project"}
                  </Button>
                </div>
              ) : isFree ? (
                user ? (
                  <Button
                    onClick={handleClaim}
                    disabled={claiming}
                    className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-12 text-base font-bold transition-opacity"
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    {claiming ? "Claiming…" : "Get for Free"}
                  </Button>
                ) : (
                  <Link to="/login">
                    <Button className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-12 text-base font-bold transition-opacity">
                      <Gift className="h-4 w-4 mr-2" />
                      Sign in to claim free
                    </Button>
                  </Link>
                )
              ) : (
                <Link to={user ? `/checkout/${listing.id}` : "/login"}>
                  <Button className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-12 text-base font-bold transition-opacity">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Buy Now — {priceLabel}
                  </Button>
                </Link>
              )}

              {/* Make an offer (only for paid, non-owned listings) */}
              {!purchased && !isFree && user && listing.seller_id !== user.id && (
                <div className="mt-3">
                  <MakeOfferDialog
                    listingId={listing.id}
                    listingTitle={listing.title}
                    askingPrice={listing.price}
                  />
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

              {/* Trust line */}
              {!isFree && (
                <p className="mt-4 text-center text-[11px] text-muted-foreground">
                  🔒 Secure checkout via Stripe
                </p>
              )}
            </div>

            {/* Seller card with integrated chat CTA */}
            {seller && (
              <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Seller</p>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full gradient-hero flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-glow">
                    {seller.username?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{seller.username ?? "Anonymous"}</p>
                    <p className="text-xs text-muted-foreground">{seller.total_sales ?? 0} total sales</p>
                  </div>
                </div>
                {/* Chat CTA */}
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
                    <Link to="/login">
                      <Button className="w-full h-11 text-sm font-bold gradient-hero text-white border-0 shadow-glow hover:opacity-90 transition-opacity">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Sign in to ask a question
                      </Button>
                    </Link>
                  )
                )}
              </div>
            )}
          </div>
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
        />
      )}
    </div>
  );
}
