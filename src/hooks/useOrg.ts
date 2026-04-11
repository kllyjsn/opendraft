import { useEffect, useState } from "react";
import { api } from "@/lib/api";
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

  async function load() {
    if (!slug || !user) { setLoading(false); return; }
    setLoading(true);
    try {
      const result = await api.get<{ data: Org; members: OrgMember[]; currentMember: OrgMember | null }>(
        `/organizations/${slug}`
      );
      setOrg(result.data);
      setMembers(result.members);
      setMyRole(result.currentMember?.role ?? null);
    } catch {
      setOrg(null);
      setMembers([]);
      setMyRole(null);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [slug, user]);

  const isAdmin = myRole === "owner" || myRole === "admin";

  return { org, members, myRole, isAdmin, loading, refetch: load };
}

/** Get the user's primary org membership */
export function useMyOrg() {
  const { user } = useAuth();
  const [org, setOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(false);
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
    setLoading(false);
  }, [user]);

  async function acceptInvitation(invitation: OrgInvitation) {
    if (!user) return;
    await api.post("/organizations/accept-invitation", { invitation_id: invitation.id });
    setInvitations(prev => prev.filter(i => i.id !== invitation.id));
  }

  return { invitations, loading, acceptInvitation };
}
