import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { CompletenessBadge } from "@/components/CompletenessBadge";
import { Loader2, ShoppingCart, ChevronLeft, Lock } from "lucide-react";

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
    setListing(data as Listing | null);
    setLoading(false);
  }

  async function handleBuy() {
    if (!listing || !user) return;
    setProcessing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "create-checkout-session",
        { body: { listingId: listing.id } }
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

  const price = `$${(listing.price / 100).toFixed(2)}`;

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
                <div className="flex-shrink-0 h-16 w-24 rounded-lg overflow-hidden bg-muted">
                  <img src={listing.screenshots[0]} alt={listing.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold leading-snug">{listing.title}</h3>
                  <span className="flex-shrink-0 text-xl font-black">{price}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <CompletenessBadge level={listing.completeness_badge} showTooltip={false} />
                  {listing.tech_stack?.slice(0, 3).map((t) => (
                    <span key={t} className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{t}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold">{price}</span>
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
              <><ShoppingCart className="h-4 w-4 mr-2" /> Pay {price} securely</>
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
