import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Shield, Loader2, LayoutGrid, List, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AppItem {
  id: string;
  listing_id: string;
  status: string;
  compliance_tags: string[];
  department: string | null;
  listing?: {
    title: string;
    description: string;
    price: number;
    screenshots: string[];
    tech_stack: string[];
    demo_url: string | null;
    security_score: number | null;
    category: string;
  };
}

function appColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 52%)`;
}

function appIconLetter(title: string): string {
  return title.charAt(0).toUpperCase();
}

interface OrgAppGridProps {
  orgId: string;
  orgSlug?: string;
}

export function OrgAppGrid({ orgId, orgSlug }: OrgAppGridProps) {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadApps();
  }, [orgId]);

  async function loadApps() {
    setLoading(true);
    const { data } = await supabase
      .from("org_listings")
      .select("*")
      .eq("org_id", orgId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      const listingIds = data.map(d => d.listing_id);
      const { data: details } = await supabase
        .from("listings")
        .select("id, title, description, price, screenshots, tech_stack, demo_url, security_score, category")
        .in("id", listingIds);

      const detailMap = new Map(details?.map(l => [l.id, l]) ?? []);
      setApps(data.map(d => ({
        ...d,
        compliance_tags: d.compliance_tags ?? [],
        listing: detailMap.get(d.listing_id) ?? undefined,
      })) as AppItem[]);
    } else {
      setApps([]);
    }
    setLoading(false);
  }

  const departments = [...new Set(apps.map(a => a.department).filter(Boolean))] as string[];

  const filtered = apps.filter(a => {
    if (selectedDept && a.department !== selectedDept) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      a.listing?.title.toLowerCase().includes(q) ||
      a.listing?.description.toLowerCase().includes(q) ||
      a.department?.toLowerCase().includes(q) ||
      a.listing?.tech_stack?.some(t => t.toLowerCase().includes(q))
    );
  });

  const handleOpen = (listingId: string) => {
    const params = orgSlug ? `?org=${orgSlug}` : "";
    navigate(`/listing/${listingId}${params}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search & Controls */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search apps…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-card border-border/40"
          />
        </div>
        <div className="flex items-center gap-1 border border-border/40 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Department pills */}
      {departments.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedDept(null)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              !selectedDept ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          {departments.map(d => (
            <button
              key={d}
              onClick={() => setSelectedDept(selectedDept === d ? null : d)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                selectedDept === d ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <LayoutGrid className="h-8 w-8 opacity-30" />
          </div>
          <p className="font-medium text-sm">
            {search.trim() ? "No apps match your search" : "No approved apps yet"}
          </p>
          <p className="text-xs mt-1 max-w-xs mx-auto">
            {search.trim()
              ? "Try a different search term"
              : "Add apps to the catalog and approve them to see them here."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* ── Okta-style tile grid ── */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {filtered.map(app => {
            const title = app.listing?.title ?? "App";
            const color = appColor(title);
            return (
              <button
                key={app.id}
                onClick={() => handleOpen(app.listing_id)}
                className="group relative flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border border-border/20 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_30px_-8px_hsl(var(--foreground)/0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{ boxShadow: "0 2px 12px -4px hsl(var(--foreground) / 0.08)" }}
              >
                {/* Tile icon */}
                {app.listing?.screenshots?.[0] ? (
                  <div className="h-16 w-16 rounded-[18px] overflow-hidden shadow-md ring-1 ring-border/10 transition-transform duration-200 group-hover:scale-105">
                    <img
                      src={app.listing.screenshots[0]}
                      alt={title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div
                    className="h-16 w-16 rounded-[18px] flex items-center justify-center text-2xl font-black text-white shadow-md transition-transform duration-200 group-hover:scale-105"
                    style={{ backgroundColor: color, boxShadow: `0 4px 14px -4px ${color}` }}
                  >
                    {appIconLetter(title)}
                  </div>
                )}

                {/* Label */}
                <div className="space-y-0.5 w-full text-center min-w-0">
                  <p className="text-xs font-semibold truncate leading-tight group-hover:text-primary transition-colors">
                    {title}
                  </p>
                  {app.department && (
                    <p className="text-[10px] text-muted-foreground truncate">{app.department}</p>
                  )}
                </div>

                {/* Compliance chip */}
                {app.compliance_tags.length > 0 && (
                  <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-accent/20 text-accent-foreground px-1.5 py-0.5 rounded-md">
                    <Shield className="h-2.5 w-2.5" />
                    <span className="text-[8px] font-bold uppercase tracking-wide">
                      {app.compliance_tags[0]}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        /* ── List view ── */
        <div className="space-y-2">
          {filtered.map(app => {
            const title = app.listing?.title ?? "App";
            const color = appColor(title);
            return (
              <button
                key={app.id}
                onClick={() => handleOpen(app.listing_id)}
                className="group w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border/20 hover:shadow-[0_4px_20px_-6px_hsl(var(--foreground)/0.1)] hover:-translate-y-px transition-all text-left"
                style={{ boxShadow: "0 1px 6px -2px hsl(var(--foreground) / 0.06)" }}
              >
                {app.listing?.screenshots?.[0] ? (
                  <div className="h-11 w-11 rounded-xl overflow-hidden ring-1 ring-border/10 shadow-sm shrink-0">
                    <img src={app.listing.screenshots[0]} alt="" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: color }}
                  >
                    {appIconLetter(title)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                    {title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {app.listing?.description?.slice(0, 80)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {app.department && (
                    <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full hidden sm:inline">
                      {app.department}
                    </span>
                  )}
                  {app.compliance_tags.length > 0 && (
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/20 bg-emerald-500/5 hidden sm:flex">
                      <Shield className="h-2.5 w-2.5 mr-1" />
                      {app.compliance_tags[0]}
                    </Badge>
                  )}
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
