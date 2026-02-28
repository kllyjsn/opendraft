/**
 * Success Page
 * ------------------------------------
 * Shown after a buyer completes Stripe Checkout.
 *
 * Stripe redirects to: /success?session_id={CHECKOUT_SESSION_ID}
 *
 * We use the session_id to:
 *  1. Call get-checkout-session to verify the payment actually succeeded
 *  2. Display confirmed purchase details (product name, amount paid)
 *  3. Guide the buyer to their purchases in Profile
 *
 * This pattern prevents users from bookmarking /success and claiming
 * a purchase without having paid — we verify with Stripe every time.
 */

import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChatDrawer } from "@/components/ChatDrawer";
import { CheckCircle, ShoppingBag, ArrowRight, Loader2, AlertCircle, Package, MessageSquare, RefreshCw, Wrench, Shield, Infinity, Lightbulb } from "lucide-react";

interface SessionDetails {
  status: string;
  paymentStatus: string;
  amountTotal: number | null;
  currency: string;
  productName: string | null;
  productImage: string | null;
  metadata: Record<string, string> | null;
}

export default function Success() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { user } = useAuth();

  const [session, setSession] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(!!sessionId);
  const [error, setError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [sellerInfo, setSellerInfo] = useState<{ sellerId: string; listingId: string; listingTitle: string; sellerUsername: string } | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    verifySession(sessionId);
  }, [sessionId]);

  // After session is verified, fetch seller info for the chat shortcut
  useEffect(() => {
    if (!session || !session.metadata?.listing_id) return;
    const listingId = session.metadata.listing_id;
    async function fetchSellerInfo() {
      const { data: listing } = await supabase
        .from("listings")
        .select("seller_id, title")
        .eq("id", listingId)
        .single();
      if (!listing) return;
      const { data: profile } = await supabase
        .from("public_profiles")
        .select("username")
        .eq("user_id", listing.seller_id)
        .single();
      setSellerInfo({
        sellerId: listing.seller_id,
        listingId,
        listingTitle: listing.title,
        sellerUsername: (profile as any)?.username ?? "Builder",
      });
    }
    fetchSellerInfo();
  }, [session]);

  async function verifySession(sid: string) {
    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("get-checkout-session", {
        body: { sessionId: sid },
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      setSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify payment");
    } finally {
      setLoading(false);
    }
  }

  // Format currency from cents
  function formatAmount(cents: number | null, currency: string) {
    if (!cents) return null;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency?.toUpperCase() || "USD",
    }).format(cents / 100);
  }

  // Loading state while verifying with Stripe
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Verifying your payment…</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state — payment could not be verified
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="text-center max-w-md">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
              <AlertCircle className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-black mb-3">Payment verification failed</h1>
            <p className="text-muted-foreground mb-6 text-sm">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/profile">
                <Button variant="outline">View my purchases</Button>
              </Link>
              <Link to="/">
                <Button className="gradient-hero text-white border-0">Back to marketplace</Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Payment was NOT completed (e.g. session open/expired, user navigated directly)
  const paymentSucceeded = session?.paymentStatus === "paid" || session?.status === "complete";

  if (session && !paymentSucceeded) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">⏳</div>
            <h1 className="text-2xl font-black mb-3">Payment not completed</h1>
            <p className="text-muted-foreground mb-6 text-sm">
              Your payment hasn't been confirmed yet. If you were charged, please check your profile — it may take a moment to process.
            </p>
            <Link to="/profile">
              <Button className="gradient-hero text-white border-0">View my purchases</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ✅ Payment confirmed
  const amountFormatted = session ? formatAmount(session.amountTotal, session.currency) : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-lg w-full page-enter">
          {/* Success icon */}
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full gradient-hero shadow-glow mb-6 animate-scale-up">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>

          <h1 className="text-3xl font-black mb-2 tracking-tight">Welcome aboard! 🎉</h1>
          <p className="text-muted-foreground mb-6">
            Your purchase is confirmed — you now own this project forever. Here's what's included.
          </p>

          {/* Purchase summary card */}
          {session && (
            <div className="rounded-2xl border border-border bg-card p-5 mb-6 text-left shadow-card">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Purchase Summary</p>
              <div className="flex items-center gap-3">
                {session.productImage ? (
                  <img src={session.productImage} alt={session.productName ?? "Product"} className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="h-12 w-12 rounded-lg gradient-hero opacity-70 flex items-center justify-center flex-shrink-0">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{session.productName ?? "Project"}</p>
                  {amountFormatted && (
                    <p className="text-sm text-muted-foreground">Paid {amountFormatted}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* What's included */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 mb-6 text-left">
            <p className="font-bold text-sm uppercase tracking-wider text-primary mb-4">What's included</p>
            <div className="space-y-4">
              <div className="flex gap-3">
                <Infinity className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Full source code & lifetime access</p>
                  <p className="text-xs text-muted-foreground">The code is yours forever — no recurring fees required.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <MessageSquare className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Talk directly with the builder</p>
                  <p className="text-xs text-muted-foreground">Got a question or need help getting started? Message the builder right from opendraft.co.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Optional support subscription</p>
                  <p className="text-xs text-muted-foreground">Want ongoing updates, priority support, and custom feature requests? Ask the builder about their support plan.</p>
                </div>
              </div>
            </div>
          </div>

          {/* How to get the most out of it */}
          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-6 mb-8 text-left">
            <p className="font-bold text-sm text-accent mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              How to get the most out of your purchase
            </p>
            <ol className="space-y-1.5 text-xs text-muted-foreground list-decimal list-inside">
              <li><strong className="text-foreground">Start using the app</strong> — dive in and explore all the features.</li>
              <li><strong className="text-foreground">Message the builder</strong> — introduce yourself, share your use case, and ask questions.</li>
              <li><strong className="text-foreground">Request features</strong> — tell the builder what would make this app perfect for you.</li>
              <li><strong className="text-foreground">Stay updated</strong> — check back monthly for new features and improvements.</li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {sellerInfo && (
              <Button
                onClick={() => setChatOpen(true)}
                className="gradient-hero text-white border-0 shadow-glow hover:opacity-90 h-12 text-base font-bold"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat with {sellerInfo.sellerUsername}
              </Button>
            )}
            <Link to="/profile">
              <Button variant={sellerInfo ? "outline" : "default"} className={sellerInfo ? "" : "gradient-hero text-white border-0 shadow-glow hover:opacity-90"}>
                <ShoppingBag className="h-4 w-4 mr-2" />
                View my purchases
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline">
                Browse more <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />

      {user && sellerInfo && (
        <ChatDrawer
          open={chatOpen}
          onOpenChange={setChatOpen}
          conversationId={null}
          listingId={sellerInfo.listingId}
          sellerId={sellerInfo.sellerId}
          listingTitle={sellerInfo.listingTitle}
          otherUsername={sellerInfo.sellerUsername}
          otherUserId={sellerInfo.sellerId}
        />
      )}
    </div>
  );
}
