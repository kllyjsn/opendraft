import { useMyInvitations } from "@/hooks/useOrg";
import { Button } from "@/components/ui/button";
import { Building2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export function OrgInviteBanner() {
  const { invitations, loading, acceptInvitation } = useMyInvitations();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [accepting, setAccepting] = useState<string | null>(null);

  if (loading || invitations.length === 0) return null;

  async function handleAccept(inv: typeof invitations[0]) {
    setAccepting(inv.id);
    try {
      await acceptInvitation(inv);
      toast({ title: "Welcome!", description: "You've joined the organization." });
      // Fetch org slug to navigate
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Could not accept", description: err.message, variant: "destructive" });
    }
    setAccepting(null);
  }

  return (
    <div className="container mx-auto px-4 mt-4">
      {invitations.map((inv) => (
        <div
          key={inv.id}
          className="flex items-center gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5 mb-2"
        >
          <Building2 className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">You've been invited to join an organization</p>
            <p className="text-xs text-muted-foreground">Role: {inv.role}</p>
          </div>
          <Button
            size="sm"
            className="bg-foreground text-background hover:bg-foreground/90 shrink-0"
            onClick={() => handleAccept(inv)}
            disabled={accepting === inv.id}
          >
            {accepting === inv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Accept"}
          </Button>
        </div>
      ))}
    </div>
  );
}
