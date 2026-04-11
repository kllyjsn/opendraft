import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { CompletenessBadge } from "@/components/CompletenessBadge";
import { Button } from "@/components/ui/button";
import { ChatDrawer } from "@/components/ChatDrawer";
import { Download, Github, Star, Loader2, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface Purchase {
  id: string;
  created_at: string;
  amount_paid: number;
  listing_id: string;
  seller_id: string;
  listings: {
    id: string;
    title: string;
    completeness_badge: "prototype" | "mvp" | "production_ready";
    github_url: string | null;
    screenshots: string[];
  } | null;
}

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  purchase_id: string;
}

export default function Profile() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState<{ purchaseId: string; rating: number; text: string } | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [chatTarget, setChatTarget] = useState<{ listingId: string; sellerId: string; listingTitle: string; sellerUsername: string } | null>(null);
  const [sellerNames, setSellerNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;

    async function fetchPurchases() {
      const { data } = await api.from("purchases")
        .select("id,created_at,amount_paid,listing_id,seller_id,listings(id,title,completeness_badge,github_url,screenshots)")
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false });
      const purchases = (data as unknown as Purchase[]) ?? [];
      setPurchases(purchases);
      setDataLoading(false);

      // Fetch seller usernames
      const sellerIds = [...new Set(purchases.map(p => p.seller_id))];
      if (sellerIds.length > 0) {
        const { data: profiles } = await api.from("public_profiles")
          .select("user_id, username")
          .in("user_id", sellerIds);
        const map: Record<string, string> = {};
        profiles?.forEach((p: any) => { map[p.user_id] = p.username ?? "Builder"; });
        setSellerNames(map);
      }
    }

    async function fetchReviews() {
      const { data } = await api.from("reviews")
        .select("id,rating,review_text,purchase_id")
        .eq("buyer_id", user!.id);
      setReviews((data as Review[]) ?? []);
    }

    fetchPurchases();
    fetchReviews();
  }, [user]);

  if (!loading && !user) return <Navigate to="/login" replace />;

  const reviewedPurchaseIds = new Set(reviews.map((r) => r.purchase_id));

  async function handleDownload(listingId: string) {
    if (!user) return;
    setDownloadingId(listingId);
    try {
      const { data: data, error } = await api.post<{ data: any }>("/functions/get-download-url", { listingId },);
      if (error || data?.error) throw new Error(error?.message ?? data?.error);

      if (data.signedUrl) {
        // Trigger ZIP download
        const a = document.createElement("a");
        a.href = data.signedUrl;
        a.download = `${data.title ?? "project"}.zip`;
        a.click();
      } else if (data.githubUrl) {
        window.open(data.githubUrl, "_blank");
      } else {
        toast({ title: "No file available", description: "The seller hasn't uploaded a file for this listing yet.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Download failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  }

  async function submitReview() {
    if (!reviewForm || !user) return;
    setSubmittingReview(true);
    const purchase = purchases.find((p) => p.id === reviewForm.purchaseId);
    if (!purchase) return;

    const { error } = await api.from("reviews").insert([{
      listing_id: purchase.listing_id,
      buyer_id: user.id,
      purchase_id: reviewForm.purchaseId,
      rating: reviewForm.rating,
      review_text: reviewForm.text || null,
    }]);

    if (error) {
      toast({ title: "Failed to submit review", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Review submitted! ⭐" });
      setReviews((prev) => [...prev, { id: Date.now().toString(), rating: reviewForm.rating, review_text: reviewForm.text, purchase_id: reviewForm.purchaseId }]);
      setReviewForm(null);
    }
    setSubmittingReview(false);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl page-enter">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-14 w-14 rounded-full gradient-hero flex items-center justify-center text-white text-xl font-black shadow-glow">
            {user?.email?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div>
            <h1 className="text-2xl font-black">{user?.user_metadata?.name ?? user?.email}</h1>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-4">Purchase history</h2>

        {dataLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : purchases.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <div className="text-4xl mb-3">🛒</div>
            <h3 className="font-bold mb-1">No purchases yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Browse the marketplace to find your first project</p>
            <Link to="/">
              <Button className="gradient-hero text-white border-0">Browse projects</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => {
              const listing = purchase.listings;
              const alreadyReviewed = reviewedPurchaseIds.has(purchase.id);
              const isReviewing = reviewForm?.purchaseId === purchase.id;

              return (
                <div key={purchase.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                  <div className="flex gap-4">
                    {listing?.screenshots?.[0] ? (
                      <img
                        src={listing.screenshots[0]}
                        alt={listing.title}
                        className="h-16 w-24 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-16 w-24 rounded-lg gradient-hero opacity-50 flex-shrink-0 flex items-center justify-center text-xl">⚡</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link to={`/listing/${listing?.id}`} className="font-bold hover:text-primary transition-colors line-clamp-1">
                          {listing?.title ?? "Deleted listing"}
                        </Link>
                        {listing && <CompletenessBadge level={listing.completeness_badge} showTooltip={false} />}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        Purchased {new Date(purchase.created_at).toLocaleDateString()} · ${(purchase.amount_paid / 100).toFixed(2)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={downloadingId === purchase.listing_id}
                          onClick={() => handleDownload(purchase.listing_id)}
                        >
                          {downloadingId === purchase.listing_id ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Download className="h-3 w-3 mr-1" />
                          )}
                          Download
                        </Button>
                        {listing?.github_url && (
                          <a href={listing.github_url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="h-7 text-xs">
                              <Github className="h-3 w-3 mr-1" /> GitHub
                            </Button>
                          </a>
                        )}
                        {!alreadyReviewed && !isReviewing && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => setReviewForm({ purchaseId: purchase.id, rating: 5, text: "" })}
                          >
                            <Star className="h-3 w-3 mr-1" /> Leave review
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10"
                          onClick={() => setChatTarget({
                            listingId: purchase.listing_id,
                            sellerId: purchase.seller_id,
                            listingTitle: listing?.title ?? "Project",
                            sellerUsername: sellerNames[purchase.seller_id] ?? "Builder",
                          })}
                        >
                          <MessageSquare className="h-3 w-3 mr-1" /> Chat with builder
                        </Button>
                        {alreadyReviewed && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Star className="h-3 w-3 fill-accent text-accent" /> Reviewed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Review form */}
                  {isReviewing && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm font-semibold mb-2">Rate this project</p>
                      <div className="flex gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setReviewForm((f) => f ? { ...f, rating: star } : f)}
                          >
                            <Star className={`h-6 w-6 transition-all ${star <= (reviewForm?.rating ?? 0) ? "fill-accent text-accent" : "text-muted hover:text-accent"}`} />
                          </button>
                        ))}
                      </div>
                      <textarea
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-20 resize-none mb-3"
                        placeholder="Share your experience (optional)..."
                        value={reviewForm?.text ?? ""}
                        onChange={(e) => setReviewForm((f) => f ? { ...f, text: e.target.value } : f)}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={submitReview} disabled={submittingReview} className="gradient-hero text-white border-0">
                          {submittingReview ? "Submitting..." : "Submit review"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setReviewForm(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />

      {user && chatTarget && (
        <ChatDrawer
          open={!!chatTarget}
          onOpenChange={(open) => { if (!open) setChatTarget(null); }}
          conversationId={null}
          listingId={chatTarget.listingId}
          sellerId={chatTarget.sellerId}
          listingTitle={chatTarget.listingTitle}
          otherUsername={chatTarget.sellerUsername}
          otherUserId={chatTarget.sellerId}
        />
      )}
    </div>
  );
}
