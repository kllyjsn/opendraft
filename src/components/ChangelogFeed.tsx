import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GitCommit, FileCode, ChevronDown, ChevronRight, Clock, Zap, Shield, Wrench, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ChangeEntry {
  id: string;
  file_path: string;
  change_type: string;
  description: string;
  code: string;
  risk_level: string;
  approved: boolean | null;
  applied_at: string | null;
  cycle_id: string;
  cycle_created_at: string;
  cycle_trigger: string;
  cycle_status: string;
  listing_title?: string;
  listing_id?: string;
}

interface ChangelogFeedProps {
  listingId?: string; // scope to one listing, or show all for dashboard
  limit?: number;
  compact?: boolean;
}

const changeTypeIcon: Record<string, React.ReactNode> = {
  modify: <FileCode className="h-3.5 w-3.5" />,
  create: <Zap className="h-3.5 w-3.5" />,
  delete: <Shield className="h-3.5 w-3.5" />,
};

const riskColors: Record<string, string> = {
  low: "text-emerald-500 bg-emerald-500/10",
  medium: "text-amber-500 bg-amber-500/10",
  high: "text-red-500 bg-red-500/10",
};

const triggerLabels: Record<string, string> = {
  manual: "Manual analysis",
  auto: "Auto-improve",
  cron: "Scheduled scan",
  chat: "Chat request",
};

export function ChangelogFeed({ listingId, limit = 20, compact = false }: ChangelogFeedProps) {
  const [changes, setChanges] = useState<ChangeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchChanges();
  }, [listingId]);

  async function fetchChanges() {
    setLoading(true);

    // First get improvement_cycles for this listing (or all user's listings)
    let cycleQuery = supabase
      .from("improvement_cycles")
      .select("id, created_at, trigger, status, listing_id")
      .order("created_at", { ascending: false })
      .limit(50);

    if (listingId) {
      cycleQuery = cycleQuery.eq("listing_id", listingId);
    }

    const { data: cycles } = await cycleQuery;
    if (!cycles || cycles.length === 0) {
      setChanges([]);
      setLoading(false);
      return;
    }

    const cycleIds = cycles.map(c => c.id);

    // Get changes for those cycles
    const { data: rawChanges } = await supabase
      .from("improvement_changes")
      .select("*")
      .in("cycle_id", cycleIds)
      .order("applied_at", { ascending: false });

    if (!rawChanges) {
      setChanges([]);
      setLoading(false);
      return;
    }

    // Get listing titles if showing all
    let listingTitles: Record<string, string> = {};
    if (!listingId) {
      const listingIds = [...new Set(cycles.map(c => c.listing_id))];
      const { data: listings } = await supabase
        .from("listings")
        .select("id, title")
        .in("id", listingIds);
      if (listings) {
        listingTitles = Object.fromEntries(listings.map(l => [l.id, l.title]));
      }
    }

    const cycleMap = Object.fromEntries(cycles.map(c => [c.id, c]));

    const merged: ChangeEntry[] = rawChanges.map(ch => {
      const cycle = cycleMap[ch.cycle_id];
      return {
        ...ch,
        cycle_created_at: cycle?.created_at ?? "",
        cycle_trigger: cycle?.trigger ?? "unknown",
        cycle_status: cycle?.status ?? "unknown",
        listing_title: listingTitles[cycle?.listing_id ?? ""],
        listing_id: cycle?.listing_id,
      };
    });

    setChanges(merged.slice(0, limit));
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (changes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/40 py-12 text-center">
        <GitCommit className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No code changes yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Changes will appear here when the AI improves your projects
        </p>
      </div>
    );
  }

  // Group changes by cycle for timeline view
  const grouped = changes.reduce<Record<string, ChangeEntry[]>>((acc, ch) => {
    if (!acc[ch.cycle_id]) acc[ch.cycle_id] = [];
    acc[ch.cycle_id].push(ch);
    return acc;
  }, {});

  return (
    <div className="space-y-1">
      {Object.entries(grouped).map(([cycleId, cycleChanges]) => {
        const first = cycleChanges[0];
        const isExpanded = expandedId === cycleId;

        return (
          <div key={cycleId} className="relative">
            {/* Timeline connector */}
            <div className="absolute left-[15px] top-10 bottom-0 w-px bg-border/40" />

            {/* Cycle header */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : cycleId)}
              className="w-full flex items-start gap-3 py-2.5 px-1 hover:bg-muted/30 rounded-lg transition-colors text-left group"
            >
              <div className="relative z-10 mt-0.5 h-[30px] w-[30px] rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Wrench className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold">
                    {cycleChanges.length} file{cycleChanges.length !== 1 ? "s" : ""} changed
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                    {triggerLabels[first.cycle_trigger] || first.cycle_trigger}
                  </span>
                  {first.cycle_status === "applied" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium flex items-center gap-0.5">
                      <Check className="h-2.5 w-2.5" /> Applied
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {!listingId && first.listing_title && (
                    <span className="text-[11px] text-primary font-medium truncate max-w-[200px]">
                      {first.listing_title}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {first.cycle_created_at
                      ? formatDistanceToNow(new Date(first.cycle_created_at), { addSuffix: true })
                      : "unknown"}
                  </span>
                </div>
              </div>
              <div className="shrink-0 mt-1 text-muted-foreground group-hover:text-foreground transition-colors">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </button>

            {/* Expanded change details */}
            {isExpanded && (
              <div className="ml-[30px] pl-4 border-l border-border/40 space-y-2 pb-3">
                {cycleChanges.map(ch => (
                  <div key={ch.id} className="rounded-lg border border-border/30 bg-card/60 overflow-hidden">
                    {/* File header */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border/20">
                      <div className="flex items-center gap-1.5">
                        {changeTypeIcon[ch.change_type] || <FileCode className="h-3.5 w-3.5" />}
                        <code className="text-[11px] font-mono text-foreground/80 truncate max-w-[250px]">
                          {ch.file_path}
                        </code>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${riskColors[ch.risk_level] || "text-muted-foreground bg-muted"}`}>
                        {ch.risk_level}
                      </span>
                    </div>
                    {/* Description */}
                    <div className="px-3 py-2">
                      <p className="text-xs text-muted-foreground leading-relaxed">{ch.description}</p>
                    </div>
                    {/* Code preview */}
                    {!compact && ch.code && (
                      <div className="border-t border-border/20 bg-muted/20 max-h-[200px] overflow-auto">
                        <pre className="text-[10px] font-mono p-3 text-foreground/70 whitespace-pre-wrap break-all leading-relaxed">
                          {ch.code.slice(0, 800)}
                          {ch.code.length > 800 && "\n..."}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
