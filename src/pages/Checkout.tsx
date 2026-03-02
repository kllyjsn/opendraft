import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { CompletenessBadge } from "@/components/CompletenessBadge";
import { Input } from "@/components/ui/input";
import { Loader2, ShoppingCart, ChevronLeft, Lock, Tag, Coins } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  pricing_type: "one_time" | "monthly";
  completeness_badge: "prototype" | "mvp" | "production_ready";
  screenshots: string[];
  tech_stack: string[];
  seller_id: string;
}

export default function Checkout() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { balance: creditBalance, loading: creditsLoading, refetch: refetchCredits } = useCredits();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ id: string; code: string; discount_type: string; discount_value: number } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [offerPrice, setOfferPrice] = useState<number | null>(null);
  const [offerId, setOfferId] = useState<string | null>(null);
  const [useCreditsToggle, setUseCreditsToggle] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (!id) return;
    fetchListing();
    // Check for offer-based checkout
    const params = new URLSearchParams(window.location.search);
    const oId = params.get("offer");
    if (oId) {
      setOfferId(oId);
      fetchOffer(oId);
    }
  }, [id, user, authLoading]);

  async function fetchListing() {
    const { data } = await supabase
      .from("listings")
      .select("id,title,description,price,pricing_type,completeness_badge,screenshots,tech_stack,seller_id")
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

  async function fetchOffer(oId: string) {
    const { data } = await supabase
      .from("offers")
      .select("id, offer_amount, counter_amount, status")
      .eq("id", oId)
      .eq("status", "accepted")
      .single();
    if (data) {
      const price = (data as any).counter_amount || (data as any).offer_amount;
      setOfferPrice(price);
    }
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
      // ── Guard: duplicate purchase check ──────────────────────────
      const { data: existingPurchase } = await supabase
        .from("purchases")
        .select("id")
        .eq("listing_id", listing.id)
        .eq("buyer_id", user.id)
        .maybeSingle();
      if (existingPurchase) throw new Error("You already own this project");

      // Record discount code usage for non-Stripe flows (credits / free-after-discount)
      async function recordDiscountUsage() {
        if (!appliedDiscount || !user) return;
        await supabase.from("discount_code_usage").insert({
          discount_code_id: appliedDiscount.id,
          buyer_id: user.id,
        } as any);
      }

      // Helper: insert purchase record + increment sales + auto-create conversation
      async function insertPurchaseAndIncrement(pricePaid: number) {
        const { error: purchErr } = await supabase.from("purchases").insert({
          listing_id: listing.id,
          buyer_id: user.id,
          seller_id: listing.seller_id,
          amount_paid: pricePaid,
          platform_fee: Math.round(pricePaid * 0.2),
          seller_amount: Math.round(pricePaid * 0.8),
        } as any);
        if (purchErr) throw new Error(purchErr.message);

        // Increment both listing and seller sales counters (matches webhook behavior)
        await Promise.all([
          supabase.rpc("increment_sales_count", { listing_id_param: listing.id }),
          supabase.rpc("increment_seller_sales", { seller_id_param: listing.seller_id }),
        ]);

        // Auto-create conversation so buyer and seller can chat immediately
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
                content: `Thanks for purchasing ${listing.title}! 🎉 I'm your builder — feel free to ask me anything, request features, or share feedback.`,
              } as any);
            }
          }
        } catch (chatErr) {
          console.error("Auto-chat creation failed (non-blocking):", chatErr);
        }
      }

      // Case 1: Free after discount — no payment needed
      if (finalPrice === 0) {
        await recordDiscountUsage();
        await insertPurchaseAndIncrement(0);
        navigate(`/success?credit_purchase=true&listing=${listing.id}&amount=0`);
        return;
      }

      // Case 2: Credits cover the full price
      if (useCreditsToggle && creditBalance !== null && creditBalance >= finalPrice) {
        const { data: spent, error: spendErr } = await supabase.rpc("spend_credits" as any, {
          p_user_id: user.id,
          p_amount: finalPrice,
          p_listing_id: listing.id,
          p_description: `Purchased: ${listing.title}`,
        });
        if (spendErr) throw new Error(spendErr.message);
        if (!spent) throw new Error("Insufficient credits");

        await recordDiscountUsage();
        await insertPurchaseAndIncrement(finalPrice);
        refetchCredits();
        navigate(`/success?credit_purchase=true&listing=${listing.id}&amount=${finalPrice}`);
        return;
      }

      // Case 3: Fallback to Stripe
      const body: Record<string, string> = { listingId: listing.id };
      if (appliedDiscount) body.discountCodeId = appliedDiscount.id;
      if (offerId) body.offerId = offerId;

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

  const originalPrice = offerPrice || listing.price;
  let finalPrice = originalPrice;
  if (appliedDiscount) {
    if (appliedDiscount.discount_type === "percentage") {
      finalPrice = Math.max(0, Math.round(originalPrice * (1 - appliedDiscount.discount_value / 100)));
    } else {
      finalPrice = Math.max(0, originalPrice - appliedDiscount.discount_value);
    }
  }
  const priceDisplay = offerPrice
    ? `$${(offerPrice / 100).toFixed(2)}`
    : `$${(listing.price / 100).toFixed(2)}`;
  const finalPriceDisplay = `$${(finalPrice / 100).toFixed(2)}`;
  const isOfferCheckout = !!offerPrice;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl page-enter">
        <Link
          to={`/listing/${listing.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 group transition-colors duration-200"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" /> Back to listing
        </Link>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-card hover:shadow-card-hover transition-shadow duration-500">
          <h1 className="text-2xl font-black mb-2">Complete your purchase</h1>
          <p className="text-sm text-muted-foreground mb-6">You're buying a <strong className="text-foreground">full fork of the source code</strong> — it's yours to own, modify, and deploy forever.</p>

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
                  <span className={`text-lg font-black flex-shrink-0 ${appliedDiscount ? "line-through text-muted-foreground text-sm" : ""}`}>
                    {priceDisplay}
                    {isOfferCheckout && (
                      <span className="block text-[10px] font-medium text-primary">Accepted offer</span>
                    )}
                  </span>
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

            {/* Credits section */}
            {creditBalance !== null && creditBalance > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2 text-sm">
                    <Coins className="h-4 w-4 text-primary" />
                    <span className="font-medium">Pay with credits</span>
                    <span className="text-muted-foreground">(${(creditBalance / 100).toFixed(2)} available)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={useCreditsToggle}
                    onChange={(e) => setUseCreditsToggle(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary accent-primary"
                  />
                </label>
                {useCreditsToggle && creditBalance < finalPrice && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Credits don't fully cover this — you'll pay the remaining ${((finalPrice - creditBalance) / 100).toFixed(2)} via Stripe.
                  </p>
                )}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-border flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <div className="text-right">
                <span className="font-bold">{finalPriceDisplay}</span>
                {useCreditsToggle && creditBalance !== null && creditBalance >= finalPrice && (
                  <span className="block text-xs text-primary font-medium">Paid with credits</span>
                )}
              </div>
            </div>
          </div>

          {/* What you get */}
          <div className="mb-6 space-y-2">
            {["Instant delivery — fork the full source code", "Your own copy to modify, brand, and deploy", "One-time payment — no recurring fees", "Optional maintenance subscription for ongoing updates"].map((item) => (
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
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing…</>
            ) : useCreditsToggle && creditBalance !== null && creditBalance >= finalPrice ? (
              <><Coins className="h-4 w-4 mr-2" /> Pay {finalPriceDisplay} with credits</>
            ) : (
              <><ShoppingCart className="h-4 w-4 mr-2" /> Pay {finalPriceDisplay} securely</>
            )}
          </Button>

          <p className="mt-3 text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
            {useCreditsToggle && creditBalance !== null && creditBalance >= finalPrice ? (
              <><Coins className="h-3 w-3" /> Instant credit purchase</>
            ) : (
              <><Lock className="h-3 w-3" /> Secured by Stripe</>
            )}
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
