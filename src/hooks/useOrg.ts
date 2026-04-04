import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Org {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo_url: string | null;
  brand_colors: Record<string, unknown> | null;
  sso_config: Record<string, unknown> | null;
  subscription_tier: string | null;
  max_seats: number | null;
  max_apps: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  role: "owner" | "admin" | "builder" | "member";
  invited_by: string | null;
  created_at: string;
  profile?: { username: string | null; avatar_url: string | null };
}

export interface OrgInvitation {
  id: string;
  org_id: string;
  email: string;
  role: string;
  invited_by: string;
  token: string;
  status: string;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
}

export function useOrg(slug?: string) {
  const { user } = useAuth();
  const [org, setOrg] = useState<Org | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug || !user) { setLoading(false); return; }
    
    async function load() {
      setLoading(true);
      // Fetch org
      const { data: orgData } = await supabase
        .from("organizations")
        .select("*")
        .eq("slug", slug!)
        .single();
      
      if (orgData) {
        setOrg(orgData as unknown as Org);
        
        // Fetch members
        const { data: memberData } = await supabase
          .from("org_members")
          .select("*")
          .eq("org_id", orgData.id);
        
        if (memberData) {
          // Fetch profiles for members
          const userIds = memberData.map(m => m.user_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, username, avatar_url")
            .in("user_id", userIds);
          
          const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);
          const enriched = memberData.map(m => ({
            ...m,
            role: m.role as OrgMember["role"],
            profile: profileMap.get(m.user_id) ?? undefined,
          }));
          setMembers(enriched);
          
          const mine = enriched.find(m => m.user_id === user!.id);
          setMyRole(mine?.role ?? null);
        }
      }
      setLoading(false);
    }
    load();
  }, [slug, user]);

  const isAdmin = myRole === "owner" || myRole === "admin";

  return { org, members, myRole, isAdmin, loading, refetch: () => {
    if (slug && user) {
      // trigger re-fetch
      setLoading(true);
      setTimeout(() => setLoading(false), 0);
    }
  }};
}

/** Get the user's primary org membership */
export function useMyOrg() {
  const { user } = useAuth();
  const [org, setOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    
    async function load() {
      setLoading(true);
      const { data: membership } = await supabase
        .from("org_members")
        .select("org_id")
        .eq("user_id", user!.id)
        .limit(1)
        .maybeSingle();
      
      if (membership) {
        const { data: orgData } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", membership.org_id)
          .single();
        if (orgData) setOrg(orgData as unknown as Org);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  return { org, loading };
}

/** Pending invitations for the current user */
export function useMyInvitations() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<OrgInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) { setLoading(false); return; }
    
    async function load() {
      const { data } = await supabase
        .from("org_invitations")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      
      setInvitations((data ?? []) as unknown as OrgInvitation[]);
      setLoading(false);
    }
    load();
  }, [user]);

  async function acceptInvitation(invitation: OrgInvitation) {
    if (!user) return;
    
    // Use secure RPC to accept invitation (prevents role escalation)
    const { error } = await supabase.rpc("accept_org_invitation", {
      _invitation_id: invitation.id,
    });
    
    if (error) throw error;
    
    setInvitations(prev => prev.filter(i => i.id !== invitation.id));
  }

  return { invitations, loading, acceptInvitation };
}
