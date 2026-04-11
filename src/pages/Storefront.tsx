/**
 * Storefront Page
 * ------------------------------------
 * Displays all Stripe Products created by sellers on the platform.
 * Customers can browse products and click "Buy" to go through
 * the Stripe Checkout flow (Destination Charge).
 *
 * Products are fetched from the get-products edge function which
 * lists all active platform-level Stripe products.
 */

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2, Package, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  unitAmount: number | null;
  currency: string;
  priceId: string | null;
  sellerUserId: string | null;
  sellerStripeAccountId: string | null;
  createdAt: number;
}

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  // Fetch all platform products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  /**
   * Fetches all active products from the get-products edge function.
   * These are platform-level products with seller metadata attached.
   */
  async function fetchProducts() {
    setLoading(true);
    setError(null);
    try {
      const { data: data, error } = await api.post<{ data: any }>("/functions/get-products");
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      setProducts(data?.products ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Initiates checkout for a specific product.
   * Calls create-checkout-session with productId to generate a hosted checkout URL.
   * The session uses a Destination Charge: platform collects fees, seller gets remainder.
   */
  async function handleBuy(product: Product) {
    setBuyingId(product.id);
    try {
      const { data: data, error } = await api.post<{ data: any }>("/functions/create-checkout-session", { productId: product.id },);
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      // Redirect to Stripe's hosted checkout page
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to start checkout");
    } finally {
      setBuyingId(null);
    }
  }

  /**
   * Format price from cents to display string.
   * E.g., 2999 → "$29.99"
   */
  function formatPrice(unitAmount: number | null, currency: string) {
    if (!unitAmount) return "Free";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(unitAmount / 100);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10">
        {/* Page header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-3">
            🛍️ Stripe Connect Storefront
          </div>
          <h1 className="text-3xl font-black mb-2">Product Storefront</h1>
          <p className="text-muted-foreground">
            Browse products from our sellers. Payments use Stripe Connect Destination Charges — sellers receive 80% automatically.
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6 animate-pulse">
                <div className="h-40 bg-muted rounded-xl mb-4" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2 mb-4" />
                <div className="h-8 bg-muted rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive">Failed to load products</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={fetchProducts}>
                Try again
              </Button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && products.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-bold mb-1">No products yet</h3>
            <p className="text-muted-foreground text-sm">
              Sellers haven't created any Stripe products yet. Connect your Stripe account and create a product from your dashboard.
            </p>
          </div>
        )}

        {/* Product grid */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="rounded-2xl border border-border bg-card shadow-card overflow-hidden flex flex-col hover:shadow-lg transition-shadow"
              >
                {/* Product image */}
                {product.images?.[0] ? (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg mb-1 line-clamp-1">{product.name}</h3>
                  {product.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                      {product.description}
                    </p>
                  )}

                  {/* Seller info (from metadata) */}
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground">
                      Sold via Stripe Connect ·{" "}
                      <span className="font-mono text-xs">
                        {product.sellerStripeAccountId?.slice(0, 16)}…
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-2xl font-black">
                      {formatPrice(product.unitAmount, product.currency)}
                    </span>
                    <Button
                      onClick={() => handleBuy(product)}
                      disabled={buyingId === product.id}
                      className="gradient-hero text-white border-0 shadow-glow hover:opacity-90"
                    >
                      {buyingId === product.id ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading…</>
                      ) : (
                        <><ShoppingCart className="h-4 w-4 mr-2" /> Buy</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
