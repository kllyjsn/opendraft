import { useState, useEffect } from "react";
import { Users, Crown, Shield, UserMinus, Plus, Loader2, Mail, Clock, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { OrgMember, OrgInvitation } from "@/hooks/useOrg";

const ROLE_LABELS: Record<string, { label: string; icon: typeof Crown; color: string }> = {
  owner: { label: "Owner", icon: Crown, color: "text-amber-500" },
  admin: { label: "Admin", icon: Shield, color: "text-primary" },
  builder: { label: "Builder", icon: Users, color: "text-secondary" },
  member: { label: "Member", icon: Users, color: "text-muted-foreground" },
};

interface OrgMembersProps {
  orgId: string;
  members: OrgMember[];
  isAdmin: boolean;
  onRefresh: () => void;
}

export function OrgMembers({ orgId, members, isAdmin, onRefresh }: OrgMembersProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("member");
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [pendingInvites, setPendingInvites] = useState<OrgInvitation[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) loadPendingInvites();
  }, [orgId, isAdmin]);

  async function loadPendingInvites() {
    setLoadingInvites(true);
    const { data } = await supabase
      .from("org_invitations")
      .select("*")
      .eq("org_id", orgId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setPendingInvites((data ?? []) as unknown as OrgInvitation[]);
    setLoadingInvites(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);

    const { error } = await supabase.from("org_invitations").insert({
      org_id: orgId,
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
      invited_by: user!.id,
    } as any);

    if (error) {
      toast({
        title: "Could not send invitation",
        description: error.message.includes("duplicate")
          ? "This person already has a pending invitation."
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Invitation sent!", description: `Invited ${inviteEmail} as ${inviteRole}` });
      setInviteEmail("");
      setInviteOpen(false);
      loadPendingInvites();
    }
    setInviting(false);
  }

  async function handleResendInvite(inviteId: string, email: string) {
    setResendingId(inviteId);
    const { error } = await supabase
      .from("org_invitations")
      .update({ created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
      .eq("id", inviteId);
    if (error) {
      toast({ title: "Could not resend", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Invitation resent", description: `Re-sent invite to ${email}` });
      loadPendingInvites();
    }
    setResendingId(null);
  }

  async function handleRevokeInvite(inviteId: string) {
    setRevokingId(inviteId);
    const { error } = await supabase
      .from("org_invitations")
      .update({ status: "revoked" })
      .eq("id", inviteId);
    if (error) {
      toast({ title: "Could not revoke", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Invitation revoked" });
      setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
    }
    setRevokingId(null);
  }

  async function handleRemove(memberId: string) {
    setRemovingId(memberId);
    const { error } = await supabase.from("org_members").delete().eq("id", memberId);
    if (error) {
      toast({ title: "Could not remove member", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Member removed" });
      onRefresh();
    }
    setRemovingId(null);
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    const { error } = await supabase
      .from("org_members")
      .update({ role: newRole as "admin" | "builder" | "member" | "owner" })
      .eq("id", memberId);
    if (error) {
      toast({ title: "Could not update role", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Role updated" });
      onRefresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{members.length} members</h3>
        {isAdmin && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Invite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite team member</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4 pt-2">
                <div>
                  <Label>Email address</Label>
                  <Input
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="builder">Builder</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={inviting}>
                  {inviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                  Send invitation
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Pending invitations */}
      {isAdmin && pendingInvites.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending invitations</h4>
          {pendingInvites.map((invite) => {
            const isExpired = new Date(invite.expires_at) < new Date();
            return (
              <div key={invite.id} className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border/50 bg-card/50">
                <div className="h-9 w-9 rounded-full bg-muted/50 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{invite.email}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground capitalize">{invite.role}</span>
                    {isExpired ? (
                      <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20 px-1.5 py-0">
                        Expired
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 px-1.5 py-0">
                        <Clock className="h-2.5 w-2.5 mr-0.5" /> Pending
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => handleResendInvite(invite.id, invite.email)}
                    disabled={resendingId === invite.id}
                  >
                    {resendingId === invite.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                    Resend
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRevokeInvite(invite.id)}
                    disabled={revokingId === invite.id}
                  >
                    {revokingId === invite.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active members */}
      <div className="space-y-2">
        {members.map((m) => {
          const roleInfo = ROLE_LABELS[m.role] ?? ROLE_LABELS.member;
          const RoleIcon = roleInfo.icon;
          const isMe = m.user_id === user?.id;
          const isOwner = m.role === "owner";

          return (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-card">
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground">
                {m.profile?.username?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {m.profile?.username ?? "Unknown"}
                  {isMe && <span className="text-xs text-muted-foreground ml-1">(you)</span>}
                </p>
              </div>

              {isAdmin && !isMe && !isOwner ? (
                <div className="flex items-center gap-2">
                  <Select
                    value={m.role}
                    onValueChange={(val) => handleRoleChange(m.id, val)}
                  >
                    <SelectTrigger className="h-8 text-xs w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="builder">Builder</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleRemove(m.id)}
                    disabled={removingId === m.id}
                  >
                    {removingId === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserMinus className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              ) : (
                <div className={`flex items-center gap-1 text-xs font-medium ${roleInfo.color}`}>
                  <RoleIcon className="h-3 w-3" />
                  {roleInfo.label}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
