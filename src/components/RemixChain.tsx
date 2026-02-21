import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GitFork, ChevronRight } from "lucide-react";

interface ChainNode {
  id: string;
  title: string;
  seller_username?: string;
  seller_id: string;
}

interface RemixChainProps {
  listingId: string;
}

export function RemixChain({ listingId }: RemixChainProps) {
  const [ancestors, setAncestors] = useState<ChainNode[]>([]);
  const [children, setChildren] = useState<ChainNode[]>([]);
  const [remixCount, setRemixCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChain();
  }, [listingId]);

  async function loadChain() {
    setLoading(true);

    // Get parent chain (walk up)
    const ancestorList: ChainNode[] = [];
    let currentId: string | null = listingId;
    const visited = new Set<string>();

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const { data: chain } = await supabase
        .from("remix_chains")
        .select("parent_listing_id")
        .eq("child_listing_id", currentId)
        .maybeSingle();

      if (chain?.parent_listing_id) {
        const { data: parent } = await supabase
          .from("listings")
          .select("id, title, seller_id")
          .eq("id", chain.parent_listing_id)
          .single();

        if (parent) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("user_id", parent.seller_id)
            .single();

          ancestorList.unshift({
            id: parent.id,
            title: parent.title,
            seller_id: parent.seller_id,
            seller_username: profile?.username ?? "Anonymous",
          });
          currentId = parent.id;
        } else break;
      } else break;
    }

    setAncestors(ancestorList);

    // Get direct children (remixes of this listing)
    const { data: childChains } = await supabase
      .from("remix_chains")
      .select("child_listing_id")
      .eq("parent_listing_id", listingId);

    if (childChains && childChains.length > 0) {
      const childIds = childChains.map((c) => c.child_listing_id);
      const { data: childListings } = await supabase
        .from("listings")
        .select("id, title, seller_id")
        .in("id", childIds)
        .eq("status", "live");

      if (childListings) {
        const sellerIds = [...new Set(childListings.map((l) => l.seller_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username")
          .in("user_id", sellerIds);
        const profileMap = Object.fromEntries(
          (profiles ?? []).map((p) => [p.user_id, p.username ?? "Anonymous"])
        );

        setChildren(
          childListings.map((l) => ({
            ...l,
            seller_username: profileMap[l.seller_id],
          }))
        );
      }
      setRemixCount(childChains.length);
    }

    setLoading(false);
  }

  if (loading) return null;
  if (ancestors.length === 0 && children.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <GitFork className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Remix Chain</h3>
      </div>

      {/* Ancestors */}
      {ancestors.length > 0 && (
        <div className="mb-3">
          <p className="text-[11px] text-muted-foreground mb-2">Original lineage</p>
          <div className="flex flex-wrap items-center gap-1">
            {ancestors.map((node, i) => (
              <span key={node.id} className="flex items-center gap-1">
                <Link
                  to={`/listing/${node.id}`}
                  className="text-sm font-medium text-primary hover:underline truncate max-w-[150px]"
                  title={node.title}
                >
                  {node.title}
                </Link>
                <span className="text-[10px] text-muted-foreground">
                  by {node.seller_username}
                </span>
                {i < ancestors.length - 1 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground mx-1" />
                )}
              </span>
            ))}
            <ChevronRight className="h-3 w-3 text-muted-foreground mx-1" />
            <span className="text-sm font-bold text-foreground">This project</span>
          </div>
        </div>
      )}

      {/* Children (remixes) */}
      {children.length > 0 && (
        <div>
          <p className="text-[11px] text-muted-foreground mb-2">
            {remixCount} remix{remixCount !== 1 ? "es" : ""}
          </p>
          <div className="space-y-1.5">
            {children.map((child) => (
              <Link
                key={child.id}
                to={`/listing/${child.id}`}
                className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors group"
              >
                <GitFork className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                  {child.title}
                </span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  by {child.seller_username}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
