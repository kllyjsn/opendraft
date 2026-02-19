/**
 * CreateProductPanel Component
 * ------------------------------------
 * Allows sellers to create Stripe Products at the platform level.
 *
 * Products are created via the create-product edge function which:
 *  1. Creates the product on the PLATFORM (not on the connected account)
 *  2. Stores the seller's connected account ID in product metadata
 *  3. Returns the product ID for display
 *
 * The platform account stores the mapping:
 *   Product → Seller's Stripe Account ID (in metadata)
 *
 * When a customer buys, we use this metadata to route the transfer.
 */

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Loader2, Package, Plus } from "lucide-react";

interface CreatedProduct {
  id: string;
  name: string;
  defaultPriceId: string | null;
}

export function CreateProductPanel() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedProduct | null>(null);

  /**
   * Submits the product creation form.
   * Calls create-product edge function with platform-level Stripe credentials.
   * The product is created on the platform account with seller metadata attached.
   */
  async function handleCreate() {
    setError(null);

    // Validate inputs
    if (!name.trim()) {
      setError("Product name is required");
      return;
    }

    const priceValue = parseFloat(price);
    if (!price || isNaN(priceValue) || priceValue < 1) {
      setError("Price must be at least $1.00");
      return;
    }

    // Convert dollars to cents (Stripe uses smallest currency unit)
    const priceInCents = Math.round(priceValue * 100);

    setCreating(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("create-product", {
        body: {
          name: name.trim(),
          description: description.trim() || undefined,
          priceInCents,
          currency: "usd",
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      setCreated({
        id: data.id,
        name: data.name,
        defaultPriceId: data.defaultPriceId,
      });

      // Reset form
      setName("");
      setDescription("");
      setPrice("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 rounded-xl gradient-hero flex items-center justify-center flex-shrink-0">
          <Package className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold">Create a Stripe Product</h3>
          <p className="text-sm text-muted-foreground">Products are created at the platform level with your account linked via metadata</p>
        </div>
      </div>

      {/* Success state — show the created product details */}
      {created && (
        <div className="mb-5 rounded-xl border border-border bg-muted/50 p-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Product created!</p>
              <p className="text-sm text-muted-foreground mt-0.5">{created.name}</p>
              <div className="mt-2 space-y-1">
                <p className="text-xs font-mono text-muted-foreground">
                  Product ID: <span className="font-semibold text-foreground">{created.id}</span>
                </p>
                {created.defaultPriceId && (
                  <p className="text-xs font-mono text-muted-foreground">
                    Price ID: <span className="font-semibold text-foreground">{created.defaultPriceId}</span>
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Your Stripe account ID is stored in the product's metadata. Customers can now buy this from the storefront.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Product creation form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1.5">Product Name *</label>
          <Input
            placeholder="e.g. AI Email Writer Starter Kit"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5">Description</label>
          <textarea
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-20 resize-none"
            placeholder="What does this product include?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5">Price (USD) *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              type="number"
              min="1"
              step="0.01"
              placeholder="29.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="pl-7"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            You receive <strong>80%</strong> = ${price ? (parseFloat(price) * 0.8).toFixed(2) : "0.00"} per sale
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button
          onClick={handleCreate}
          disabled={creating}
          className="w-full gradient-hero text-white border-0 shadow-glow hover:opacity-90"
        >
          {creating ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating product…</>
          ) : (
            <><Plus className="h-4 w-4 mr-2" /> Create Stripe Product</>
          )}
        </Button>
      </div>
    </div>
  );
}
