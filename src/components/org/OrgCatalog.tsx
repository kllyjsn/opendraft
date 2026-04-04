import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, X, Loader2, Package, Shield, Clock, Search } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

interface CatalogSearchResult {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  screenshots: string[] | null;
}

interface OrgListing {
  id: string;
  listing_id: string;
  status: string;
  compliance_tags: string[];
  department: string | null;
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  listing?: {
    title: string;
    description: string;
    price: number;
    screenshots: string[];
    tech_stack: string[];
    security_score: number | null;
  };
}

interface OrgCatalogProps {
  orgId: string;
  isAdmin: boolean;
}

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Clock },
  approved: { label: "Approved", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: Check },
  rejected: { label: "Rejected", color: "bg-destructive/10 text-destructive border-destructive/20", icon: X },
};

export function OrgCatalog({ orgId, isAdmin }: OrgCatalogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<OrgListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [submitOpen, setSubmitOpen] = useState(false);
  const [listingUrl, setListingUrl] = useState("");
  const [department, setDepartment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CatalogSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedListing, setSelectedListing] = useState<CatalogSearchResult | null>(null);

  useEffect(() => {
    loadListings();
  }, [orgId]);

  // Debounced catalog search
  useEffect(() => {
    if (!submitOpen) return;
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from("listings")
        .select("id, title, description, price, category, screenshots")
        .eq("status", "live")
        .ilike("title", `%${searchQuery.trim()}%`)
        .order("sales_count", { ascending: false })
        .limit(20);
      setSearchResults((data as CatalogSearchResult[]) ?? []);
      setSearching(false);
    }, 250);
    return () => clearTimeout(timeout);
  }, [searchQuery, submitOpen]);

  async function loadListings() {
    setLoading(true);
    const { data } = await supabase
      .from("org_listings")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      // Fetch listing details
      const listingIds = data.map(d => d.listing_id);
      const { data: listingDetails } = await supabase
        .from("listings")
        .select("id, title, description, price, screenshots, tech_stack, security_score")
        .in("id", listingIds);

      const detailMap = new Map(listingDetails?.map(l => [l.id, l]) ?? []);
      setListings(data.map(d => ({
        ...d,
        compliance_tags: d.compliance_tags ?? [],
        listing: detailMap.get(d.listing_id) ?? undefined,
      })) as OrgListing[]);
    } else {
      setListings([]);
    }
    setLoading(false);
  }

  async function handleApprove(orgListingId: string) {
    const { error } = await supabase
      .from("org_listings")
      .update({ status: "approved", approved_by: user!.id, approved_at: new Date().toISOString() })
      .eq("id", orgListingId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "App approved for catalog" });
      loadListings();
    }
  }

  async function handleReject(orgListingId: string) {
    const { error } = await supabase
      .from("org_listings")
      .update({ status: "rejected" })
      .eq("id", orgListingId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "App rejected" });
      loadListings();
    }
  }

  async function handleSubmitApp(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedListing) return;
    setSubmitting(true);

    const { error } = await supabase.from("org_listings").insert({
      org_id: orgId,
      listing_id: selectedListing.id,
      department: department.trim() || null,
    } as any);

    if (error) {
      toast({
        title: "Could not submit app",
        description: error.message.includes("foreign key")
          ? "Invalid listing. Please select a valid app."
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "App submitted for approval" });
      setSelectedListing(null);
      setSearchQuery("");
      setDepartment("");
      setSubmitOpen(false);
      loadListings();
    }
    setSubmitting(false);
  }

  const filtered = filter === "all" ? listings : listings.filter(l => l.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {["all", "approved", "pending", "rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                filter === f
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== "all" && ` (${listings.filter(l => l.status === f).length})`}
            </button>
          ))}
        </div>

        {isAdmin && (
          <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Add app
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add app to catalog</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitApp} className="space-y-4 pt-2">
                <div>
                  <Label>Listing ID</Label>
                  <Input
                    placeholder="Paste listing ID or URL"
                    value={listingUrl}
                    onChange={(e) => setListingUrl(e.target.value)}
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Department <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input
                    placeholder="e.g. Engineering, Marketing, HR"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Package className="h-4 w-4 mr-2" />}
                  Submit for approval
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No apps yet</p>
          <p className="text-sm mt-1">Add apps from the marketplace to your private catalog.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const statusInfo = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
            const StatusIcon = statusInfo.icon;

            return (
              <div key={item.id} className="rounded-xl border border-border/40 bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm truncate">
                        {item.listing?.title ?? item.listing_id}
                      </h4>
                      <Badge variant="outline" className={`text-[10px] ${statusInfo.color}`}>
                        <StatusIcon className="h-2.5 w-2.5 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </div>
                    {item.listing?.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {item.listing.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                      {item.department && (
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {item.department}
                        </span>
                      )}
                      {item.compliance_tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-medium text-secondary bg-secondary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Shield className="h-2.5 w-2.5" /> {tag}
                        </span>
                      ))}
                      {item.listing?.security_score && (
                        <span className="text-[10px] font-medium text-muted-foreground">
                          Security: {item.listing.security_score}/100
                        </span>
                      )}
                    </div>
                  </div>

                  {isAdmin && item.status === "pending" && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                        onClick={() => handleApprove(item.id)}
                      >
                        <Check className="h-3 w-3 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => handleReject(item.id)}
                      >
                        <X className="h-3 w-3 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
