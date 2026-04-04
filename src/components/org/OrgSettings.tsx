import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
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

        <div>
          <Label>Plan</Label>
          <Input
            value={(org.subscription_tier ?? "team").charAt(0).toUpperCase() + (org.subscription_tier ?? "team").slice(1)}
            disabled
            className="mt-1.5 bg-muted"
          />
        </div>

        {isAdmin && (
          <Button type="submit" disabled={saving} className="bg-foreground text-background hover:bg-foreground/90">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save changes
          </Button>
        )}
      </form>

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
