import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CompletenessBadge } from "@/components/CompletenessBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ExternalLink, Github, Star, ShoppingCart, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchased, setPurchased] = useState(false);
  const [downloading, setDownloading] = useState(false);

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
      // increment view count
      await supabase.from("listings").update({ view_count: (data.view_count ?? 0) + 1 }).eq("id", id);
      // fetch seller
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 rounded-full gradient-hero animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
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

  const priceLabel = `$${(listing.price / 100).toFixed(2)}`;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ChevronLeft className="h-4 w-4" /> Back to browse
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: images + description */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image gallery */}
            {listing.screenshots.length > 0 ? (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-muted aspect-video">
                  <img
                    src={listing.screenshots[activeImg]}
                    alt={`Screenshot ${activeImg + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {listing.screenshots.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImg((i) => (i - 1 + listing.screenshots.length) % listing.screenshots.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setActiveImg((i) => (i + 1) % listing.screenshots.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
                {listing.screenshots.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {listing.screenshots.map((src, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        className={`flex-shrink-0 h-16 w-24 rounded-lg overflow-hidden border-2 transition-all ${
                          activeImg === i ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img src={src} alt={`Thumb ${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl aspect-video gradient-hero opacity-50 flex items-center justify-center">
                <span className="text-6xl">⚡</span>
              </div>
            )}

            {/* Description */}
            <div>
              <h1 className="text-3xl font-black mb-3">{listing.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <CompletenessBadge level={listing.completeness_badge} />
                {avgRating !== null && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    {avgRating.toFixed(1)} ({reviews.length} reviews)
                  </span>
                )}
                <span className="text-sm text-muted-foreground">{listing.sales_count} sold</span>
              </div>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{listing.description}</p>
            </div>

            {/* Tech stack */}
            {listing.tech_stack.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {listing.tech_stack.map((tag) => (
                    <span key={tag} className="rounded-lg bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Reviews {reviews.length > 0 && `(${reviews.length})`}</h3>
              {reviews.length === 0 ? (
                <p className="text-muted-foreground text-sm">No reviews yet. Be the first to buy and review!</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-accent text-accent" : "text-muted"}`} />
                        ))}
                        <span className="text-xs text-muted-foreground ml-auto">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      {r.review_text && <p className="text-sm text-muted-foreground">{r.review_text}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: buy card */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card sticky top-20">
              <div className="text-4xl font-black mb-1">{priceLabel}</div>
              <p className="text-xs text-muted-foreground mb-5">One-time purchase. Instant delivery.</p>

              {purchased ? (
                <div className="space-y-3">
                  <div className="rounded-xl bg-primary/10 border border-primary/30 p-3 text-center">
                    <p className="font-semibold text-primary text-sm">✓ You own this project</p>
                  </div>
                  <Button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-12 text-base font-bold"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {downloading ? "Preparing download..." : "Download Project"}
                  </Button>
                </div>
              ) : (
                <Link to={user ? `/checkout/${listing.id}` : "/login"}>
                  <Button className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-12 text-base font-bold">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Buy Now — {priceLabel}
                  </Button>
                </Link>
              )}

              {listing.demo_url && (
                <a href={listing.demo_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full mt-3">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Demo
                  </Button>
                </a>
              )}
              {listing.github_url && (
                <a href={listing.github_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full mt-2">
                    <Github className="h-4 w-4 mr-2" />
                    View on GitHub
                  </Button>
                </a>
              )}
            </div>

            {/* Seller card */}
            {seller && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Seller</h4>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full gradient-hero flex items-center justify-center text-white font-bold">
                    {seller.username?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p className="font-semibold">{seller.username ?? "Anonymous"}</p>
                    <p className="text-xs text-muted-foreground">{seller.total_sales} sales</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
