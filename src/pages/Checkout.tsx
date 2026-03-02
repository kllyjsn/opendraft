import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { CompletenessBadge } from "@/components/CompletenessBadge";
import { Loader2, Gift, ChevronLeft, Crown } from "lucide-react";

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
  const { isSubscribed, loading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || subLoading) return;
    if (!user) { navigate("/login"); return; }
    if (!isSubscribed) { navigate("/credits"); return; }
    if (!id) return;
    fetchListing();
  }, [id, user, authLoading, subLoading, isSubscribed]);

  async function fetchListing() {
    const { data } = await supabase
      .from("listings")
      .select("id,title,description,price,pricing_type,completeness_badge,screenshots,tech_stack,seller_id")
      .eq("id", id)
      .single();
    setListing(data as Listing | null);
    setLoading(false);
  }

  async function handleClaim() {
    if (!listing || !user) return;
    setProcessing(true);
    setError(null);

    try {
      // Guard: duplicate purchase check
      const { data: existingPurchase } = await supabase
        .from("purchases")
        .select("id")
        .eq("listing_id", listing.id)
        .eq("buyer_id", user.id)
        .maybeSingle();
      if (existingPurchase) throw new Error("You already own this project");

      // Insert purchase record (subscription-based, $0 amount)
      const { error: purchErr } = await supabase.from("purchases").insert({
        listing_id: listing.id,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        amount_paid: 0,
        platform_fee: 0,
        seller_amount: 0,
      } as any);
      if (purchErr) throw new Error(purchErr.message);

      // Increment sales counters
      await Promise.all([
        supabase.rpc("increment_sales_count", { listing_id_param: listing.id }),
        supabase.rpc("increment_seller_sales", { seller_id_param: listing.seller_id }),
      ]);

      // Auto-create conversation
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

      navigate(`/success?credit_purchase=true&listing=${listing.id}&amount=0`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setProcessing(false);
    }
  }

  if (loading || authLoading || subLoading) {
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
          <h1 className="text-2xl font-black mb-2">Claim this project</h1>
          <p className="text-sm text-muted-foreground mb-6">As a subscriber, you can claim any app — full source code, deploy anywhere, yours forever.</p>

          {/* Order summary */}
          <div className="rounded-xl border border-border bg-muted/30 p-5 mb-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Project</p>
            <div className="flex gap-4 items-start">
              {listing.screenshots?.[0] && (
                <div className="flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden bg-muted">
                  <img src={listing.screenshots[0]} alt={listing.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold leading-snug mb-2 truncate">{listing.title}</h3>
                <div className="flex flex-wrap items-center gap-1.5">
                  <CompletenessBadge level={listing.completeness_badge} showTooltip={false} />
                  {listing.tech_stack?.slice(0, 2).map((t) => (
                    <span key={t} className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{t}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary shrink-0">
                <Crown className="h-3.5 w-3.5" />
                Included
              </div>
            </div>
          </div>

          {/* What you get */}
          <div className="mb-6 space-y-2">
            {["Instant delivery — fork the full source code", "Your own copy to modify, brand, and deploy", "Included with your $20/mo subscription", "Message the builder for support & customization"].map((item) => (
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
            onClick={handleClaim}
            disabled={processing}
            className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-12 text-base font-bold"
          >
            {processing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Claiming…</>
            ) : (
              <><Gift className="h-4 w-4 mr-2" /> Claim Project</>
            )}
          </Button>

          <p className="mt-3 text-xs text-muted-foreground text-center">
            Included with your OpenDraft subscription
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
