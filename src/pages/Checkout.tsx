import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { CompletenessBadge } from "@/components/CompletenessBadge";
import { Input } from "@/components/ui/input";
import { Loader2, ShoppingCart, ChevronLeft, Lock, Tag } from "lucide-react";

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  completeness_badge: "prototype" | "mvp" | "production_ready";
  screenshots: string[];
  tech_stack: string[];
}

export default function Checkout() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ id: string; code: string; discount_type: string; discount_value: number } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (!id) return;
    fetchListing();
  }, [id, user, authLoading]);

  async function fetchListing() {
    const { data } = await supabase
      .from("listings")
      .select("id,title,description,price,completeness_badge,screenshots,tech_stack")
      .eq("id", id)
      .single();
    const listing = data as Listing | null;
    // Redirect free listings back to the detail page (they use the claim flow)
    if (listing && listing.price === 0) {
      navigate(`/listing/${listing.id}`, { replace: true });
      return;
    }
    setListing(listing);
    setLoading(false);
  }

  async function handleApplyDiscount() {
    const trimmed = discountCode.trim().toUpperCase();
    if (!trimmed) return;
    setApplyingDiscount(true);
    setDiscountError(null);

    // Look up active code
    const { data: codes } = await supabase
      .from("discount_codes")
      .select("id,code,discount_type,discount_value")
      .eq("code", trimmed)
      .eq("active", true)
      .limit(1);

    if (!codes?.length) {
      setDiscountError("Invalid or expired code");
      setApplyingDiscount(false);
      return;
    }

    // Check if already used by this buyer
    const { data: usage } = await supabase
      .from("discount_code_usage")
      .select("id")
      .eq("discount_code_id", codes[0].id)
      .eq("buyer_id", user!.id)
      .limit(1);

    if (usage?.length) {
      setDiscountError("You've already used this code");
      setApplyingDiscount(false);
      return;
    }

    setAppliedDiscount(codes[0] as any);
    setApplyingDiscount(false);
  }

  async function handleBuy() {
    if (!listing || !user) return;
    setProcessing(true);
    setError(null);

    try {
      const body: Record<string, string> = { listingId: listing.id };
      if (appliedDiscount) body.discountCodeId = appliedDiscount.id;

      const { data, error: fnError } = await supabase.functions.invoke(
        "create-checkout-session",
        { body }
      );

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error("No checkout URL returned");

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <p className="text-muted-foreground mb-4">Listing not found.</p>
            <Link to="/"><Button>Back to marketplace</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const originalPrice = listing.price;
  let finalPrice = originalPrice;
  if (appliedDiscount) {
    if (appliedDiscount.discount_type === "percentage") {
      finalPrice = Math.max(0, Math.round(originalPrice * (1 - appliedDiscount.discount_value / 100)));
    } else {
      finalPrice = Math.max(0, originalPrice - appliedDiscount.discount_value);
    }
  }
  const priceDisplay = `$${(originalPrice / 100).toFixed(2)}`;
  const finalPriceDisplay = `$${(finalPrice / 100).toFixed(2)}`;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl">
        <Link
          to={`/listing/${listing.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ChevronLeft className="h-4 w-4" /> Back to listing
        </Link>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
          <h1 className="text-2xl font-black mb-6">Complete your purchase</h1>

          {/* Order summary */}
          <div className="rounded-xl border border-border bg-muted/30 p-5 mb-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Order Summary</p>
            <div className="flex gap-4 items-start">
              {listing.screenshots?.[0] && (
                <div className="flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden bg-muted">
                  <img src={listing.screenshots[0]} alt={listing.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold leading-snug mb-2 truncate">{listing.title}</h3>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <CompletenessBadge level={listing.completeness_badge} showTooltip={false} />
                    {listing.tech_stack?.slice(0, 2).map((t) => (
                      <span key={t} className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{t}</span>
                    ))}
                  </div>
                  <span className={`text-lg font-black flex-shrink-0 ${appliedDiscount ? "line-through text-muted-foreground text-sm" : ""}`}>{priceDisplay}</span>
                </div>
              </div>
            </div>

            {/* Discount code input */}
            <div className="mt-4 pt-4 border-t border-border">
              {appliedDiscount ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
                    <Tag className="h-4 w-4" />
                    {appliedDiscount.code} applied ({appliedDiscount.discount_type === "percentage" ? `${appliedDiscount.discount_value}% off` : `$${(appliedDiscount.discount_value / 100).toFixed(2)} off`})
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setAppliedDiscount(null)}>Remove</Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Discount code"
                    value={discountCode}
                    onChange={(e) => { setDiscountCode(e.target.value); setDiscountError(null); }}
                    className="font-mono uppercase flex-1"
                    maxLength={20}
                  />
                  <Button variant="outline" size="sm" onClick={handleApplyDiscount} disabled={applyingDiscount || !discountCode.trim()}>
                    {applyingDiscount ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                  </Button>
                </div>
              )}
              {discountError && <p className="text-xs text-destructive mt-1">{discountError}</p>}
            </div>

            <div className="mt-4 pt-4 border-t border-border flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold">{finalPriceDisplay}</span>
            </div>
          </div>

          {/* What you get */}
          <div className="mb-6 space-y-2">
            {["Instant delivery after payment", "Lifetime access to the project", "One-time payment — no recurring fees"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-4 w-4 rounded-full gradient-hero flex items-center justify-center flex-shrink-0">
                  <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {item}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            onClick={handleBuy}
            disabled={processing}
            className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-12 text-base font-bold"
          >
            {processing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Redirecting to payment…</>
            ) : (
              <><ShoppingCart className="h-4 w-4 mr-2" /> Pay {finalPriceDisplay} securely</>
            )}
          </Button>

          <p className="mt-3 text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" /> Secured by Stripe
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
