import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, CreditCard, ArrowUpRight, Sparkles, Check } from "lucide-react";
import { TIERS, getTierById } from "@/lib/pricing-tiers";
import type { Org } from "@/hooks/useOrg";

interface OrgSettingsProps {
  org: Org;
  isAdmin: boolean;
  onRefresh: () => void;
}

export function OrgSettings({ org, isAdmin, onRefresh }: OrgSettingsProps) {
  const { toast } = useToast();
  const [name, setName] = useState(org.name);
  const [domain, setDomain] = useState(org.domain ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;
    setSaving(true);

    const { error } = await supabase
      .from("organizations")
      .update({
        name: name.trim(),
        domain: domain.trim() || null,
      })
      .eq("id", org.id);

    if (error) {
      toast({ title: "Could not update", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Organization updated" });
      onRefresh();
    }
    setSaving(false);
  }

  return (
    <div className="max-w-lg space-y-8">
      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <Label>Organization name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!isAdmin}
            required
            maxLength={100}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Company domain</Label>
          <Input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            disabled={!isAdmin}
            placeholder="acme.com"
            maxLength={100}
            className="mt-1.5"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Used for SSO and domain-based auto-join (coming soon).
          </p>
        </div>

        <div>
          <Label>URL slug</Label>
          <Input value={org.slug} disabled className="mt-1.5 bg-muted" />
          <p className="text-xs text-muted-foreground mt-1">Slug cannot be changed after creation.</p>
        </div>

        {isAdmin && (
          <Button type="submit" disabled={saving} className="bg-foreground text-background hover:bg-foreground/90">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save changes
          </Button>
        )}
      </form>

      {/* Billing & Subscription */}
      <BillingSection org={org} isAdmin={isAdmin} />

      {/* Danger zone */}
      {isAdmin && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <h4 className="text-sm font-semibold text-destructive mb-1">Danger zone</h4>
          <p className="text-xs text-muted-foreground mb-3">
            Deleting the organization will remove all members and catalog data. This cannot be undone.
          </p>
          <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" disabled>
            Delete organization (coming soon)
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Billing & Subscription Section ─── */

function BillingSection({ org, isAdmin }: { org: Org; isAdmin: boolean }) {
  const currentTierId = org.subscription_tier ?? "team";
  const currentTier = getTierById(currentTierId);
  const currentTierName = currentTier?.name ?? currentTierId.charAt(0).toUpperCase() + currentTierId.slice(1);
  const monthlyPrice = currentTier ? (currentTier.price / 100).toFixed(0) : "—";

  // Find the next tier up for upgrade CTA
  const tierIndex = TIERS.findIndex((t) => t.id === currentTierId);
  const nextTier = tierIndex >= 0 && tierIndex < TIERS.length - 1 ? TIERS[tierIndex + 1] : null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Billing & Subscription</h3>
      </div>

      {/* Current plan card */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{currentTierName} Plan</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                Active
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentTier?.price === 0
                ? "Free forever"
                : `$${monthlyPrice}/month`}
              {org.max_seats && <> · {org.max_seats} seats</>}
              {org.max_apps && <> · {org.max_apps === 999999 ? "Unlimited" : org.max_apps} apps</>}
            </p>
          </div>
        </div>

        {/* Feature highlights */}
        {currentTier && (
          <div className="mt-3 grid grid-cols-1 gap-1">
            {currentTier.features.slice(0, 4).map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="h-3 w-3 text-primary shrink-0" />
                {feature}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upgrade CTA */}
      {isAdmin && nextTier && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Upgrade to {nextTier.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{nextTier.description}</p>
              <Link to="/credits">
                <Button size="sm" className="mt-3 bg-foreground text-background hover:bg-foreground/90">
                  View plans <ArrowUpRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Billing actions */}
      {isAdmin && (
        <div className="flex flex-col gap-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Payment method</p>
              <p className="text-xs text-muted-foreground">Manage your billing details and invoices</p>
            </div>
            <Link to="/credits">
              <Button variant="outline" size="sm" className="text-xs">
                Manage billing <ArrowUpRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Invoices</p>
              <p className="text-xs text-muted-foreground">View and download past invoices</p>
            </div>
            <Link to="/credits">
              <Button variant="outline" size="sm" className="text-xs">
                View invoices <ArrowUpRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
