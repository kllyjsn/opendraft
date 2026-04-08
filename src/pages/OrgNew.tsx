import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MetaTags } from "@/components/MetaTags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TIERS, type PricingTier } from "@/lib/pricing-tiers";
import {
  Building2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Users,
  Mail,
  Plus,
  X,
  Sparkles,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

const WIZARD_STEPS = [
  { id: "details", label: "Organization" },
  { id: "plan", label: "Plan" },
  { id: "invite", label: "Invite team" },
  { id: "ready", label: "You're set" },
] as const;

/* ------------------------------------------------------------------ */
/*  Step indicator                                                     */
/* ------------------------------------------------------------------ */

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-8">
      {WIZARD_STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center gap-1">
          <div
            className={cn(
              "flex items-center justify-center h-7 w-7 rounded-full text-xs font-semibold transition-colors",
              i < current && "bg-primary text-primary-foreground",
              i === current && "bg-foreground text-background",
              i > current && "bg-muted text-muted-foreground",
            )}
          >
            {i < current ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </div>
          {i < WIZARD_STEPS.length - 1 && (
            <div
              className={cn(
                "w-8 h-0.5 rounded-full",
                i < current ? "bg-primary" : "bg-muted",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 1: Org details                                                */
/* ------------------------------------------------------------------ */

function StepDetails({
  name,
  setName,
  slug,
  setSlug,
  domain,
  setDomain,
  onNext,
}: {
  name: string;
  setName: (v: string) => void;
  slug: string;
  setSlug: (v: string) => void;
  domain: string;
  setDomain: (v: string) => void;
  onNext: () => void;
}) {
  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === slugify(name)) {
      setSlug(slugify(val));
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-3">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">
          Name your organization
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          This is your team's private workspace for discovering and managing
          apps.
        </p>
      </div>

      <div>
        <Label htmlFor="org-name">Organization name</Label>
        <Input
          id="org-name"
          placeholder="Acme Corp"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          required
          maxLength={100}
          className="mt-1.5"
          autoFocus
        />
      </div>

      <div>
        <Label htmlFor="org-slug">URL slug</Label>
        <div className="flex items-center gap-0 mt-1.5">
          <span className="inline-flex items-center h-10 px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">
            opendraft.co/org/
          </span>
          <Input
            id="org-slug"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            required
            maxLength={48}
            className="rounded-l-none"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="org-domain">
          Company domain{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="org-domain"
          placeholder="acme.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          maxLength={100}
          className="mt-1.5"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Used for future SSO and domain-based auto-join.
        </p>
      </div>

      <Button
        onClick={onNext}
        disabled={!name.trim() || !slug.trim()}
        className="w-full h-11 font-semibold bg-foreground text-background hover:bg-foreground/90"
      >
        Continue <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2: Plan selection                                             */
/* ------------------------------------------------------------------ */

function PlanCard({
  tier,
  selected,
  onSelect,
}: {
  tier: PricingTier;
  selected: boolean;
  onSelect: () => void;
}) {
  const monthlyPrice =
    tier.price === 0 ? "Free" : `$${(tier.price / 100).toFixed(0)}/mo`;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative w-full text-left rounded-xl border p-4 transition-all",
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-border bg-card hover:border-primary/40",
      )}
    >
      {tier.popular && (
        <Badge className="absolute -top-2.5 right-3 text-[10px] px-2 py-0.5 bg-primary text-primary-foreground">
          Most popular
        </Badge>
      )}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-sm">{tier.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tier.description}
          </p>
        </div>
        <div className="text-right shrink-0 ml-3">
          <p className="font-bold text-sm">{monthlyPrice}</p>
          <p className="text-[10px] text-muted-foreground">
            {tier.appLimitLabel} apps
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-1">
        {tier.features.slice(0, 3).map((f) => (
          <div
            key={f}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Check className="h-3 w-3 text-primary shrink-0" />
            {f}
          </div>
        ))}
      </div>
      {/* Selection indicator */}
      <div
        className={cn(
          "absolute top-4 right-4 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
          selected
            ? "border-primary bg-primary"
            : "border-muted-foreground/30",
        )}
      >
        {selected && <Check className="h-3 w-3 text-primary-foreground" />}
      </div>
    </button>
  );
}

function StepPlan({
  selectedPlan,
  setSelectedPlan,
  onNext,
  onBack,
}: {
  selectedPlan: string;
  setSelectedPlan: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const orgTiers = TIERS.filter(
    (t) => t.id === "team" || t.id === "enterprise",
  );

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-3">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Choose your plan</h2>
        <p className="text-sm text-muted-foreground mt-1">
          You can always change this later in your org settings.
        </p>
      </div>

      <div className="space-y-3">
        {orgTiers.map((tier) => (
          <PlanCard
            key={tier.id}
            tier={tier}
            selected={selectedPlan === tier.id}
            onSelect={() => setSelectedPlan(tier.id)}
          />
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="h-11 px-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!selectedPlan}
          className="flex-1 h-11 font-semibold bg-foreground text-background hover:bg-foreground/90"
        >
          Continue <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 3: Invite team members                                        */
/* ------------------------------------------------------------------ */

function StepInvite({
  emails,
  setEmails,
  onNext,
  onBack,
}: {
  emails: string[];
  setEmails: (v: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [currentEmail, setCurrentEmail] = useState("");

  function addEmail() {
    const email = currentEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) return;
    if (emails.includes(email)) return;
    setEmails([...emails, email]);
    setCurrentEmail("");
  }

  function removeEmail(email: string) {
    setEmails(emails.filter((e) => e !== email));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addEmail();
    }
  }

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-3">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Invite your team</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Add teammates who should have access. You can invite more later.
        </p>
      </div>

      <div>
        <Label htmlFor="invite-email">Email address</Label>
        <div className="flex gap-2 mt-1.5">
          <Input
            id="invite-email"
            type="email"
            placeholder="teammate@company.com"
            value={currentEmail}
            onChange={(e) => setCurrentEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={addEmail}
            disabled={!currentEmail.trim() || !currentEmail.includes("@")}
            className="shrink-0 h-10 w-10"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Email chips */}
      {emails.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {emails.map((email) => (
            <span
              key={email}
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-muted rounded-full pl-3 pr-1.5 py-1.5"
            >
              <Mail className="h-3 w-3 text-muted-foreground" />
              {email}
              <button
                type="button"
                onClick={() => removeEmail(email)}
                className="h-4 w-4 rounded-full hover:bg-foreground/10 flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {emails.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <Mail className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No invitations added yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            You can skip this step and invite teammates later
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="h-11 px-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 h-11 font-semibold bg-foreground text-background hover:bg-foreground/90"
        >
          {emails.length > 0
            ? `Continue with ${emails.length} invite${emails.length > 1 ? "s" : ""}`
            : "Skip for now"}{" "}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 4: All set — launch                                           */
/* ------------------------------------------------------------------ */

function StepReady({
  orgName,
  planName,
  emailCount,
  creating,
  onBack,
  onFinish,
}: {
  orgName: string;
  planName: string;
  emailCount: number;
  creating: boolean;
  onBack: () => void;
  onFinish: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-3">
          <Rocket className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">You're all set!</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review your workspace setup and launch.
        </p>
      </div>

      {/* Summary card */}
      <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Organization</span>
          </div>
          <span className="text-sm">{orgName}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Plan</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {planName}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Team invitations</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {emailCount > 0 ? `${emailCount} pending` : "None yet"}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="h-11 px-4"
          disabled={creating}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button
          onClick={onFinish}
          disabled={creating}
          className="flex-1 h-11 font-semibold bg-foreground text-background hover:bg-foreground/90"
        >
          {creating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating
              workspace…
            </>
          ) : (
            <>
              Launch workspace <Rocket className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main wizard component                                              */
/* ------------------------------------------------------------------ */

export default function OrgNew() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Wizard state
  const [step, setStep] = useState(0);

  // Step 1: Org details
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [domain, setDomain] = useState("");

  // Step 2: Plan selection
  const [selectedPlan, setSelectedPlan] = useState("team");

  // Step 3: Invites
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);

  // Creation state
  const [creating, setCreating] = useState(false);

  const selectedTier = TIERS.find((t) => t.id === selectedPlan);

  async function handleFinish() {
    if (!user || !name.trim() || !slug.trim()) return;

    setCreating(true);

    // 1. Create the org
    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: name.trim(),
        slug: slug.trim(),
        domain: domain.trim() || null,
        created_by: user.id,
        subscription_tier: selectedPlan,
      })
      .select()
      .single();

    if (orgError) {
      toast({
        title: "Could not create organization",
        description: orgError.message.includes("duplicate")
          ? "That slug is already taken. Try a different one."
          : orgError.message,
        variant: "destructive",
      });
      setCreating(false);
      return;
    }

    // 2. Send invitations (best-effort — don't block on failures)
    if (inviteEmails.length > 0) {
      const invitations = inviteEmails.map((email) => ({
        org_id: orgData.id,
        email,
        role: "member",
        invited_by: user.id,
        token: crypto.randomUUID(),
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      }));

      const { error: inviteError } = await supabase
        .from("org_invitations")
        .insert(invitations);

      if (inviteError) {
        toast({
          title: "Invitations could not be sent",
          description: inviteError.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: `${inviteEmails.length} invitation${inviteEmails.length > 1 ? "s" : ""} sent`,
          description: "Your team will receive an email to join.",
        });
      }
    }

    toast({
      title: "Workspace created!",
      description: `Welcome to ${orgData.name}`,
    });
    navigate(`/org/${orgData.slug}`);
  }

  /* ---- Auth gates ---- */

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">
              Sign in to create an organization
            </h1>
            <p className="text-muted-foreground mb-6">
              You need an account to set up a team workspace.
            </p>
            <Button
              onClick={() => navigate("/login")}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              Sign in
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  /* ---- Wizard ---- */

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MetaTags
        title="Create Organization | OpenDraft"
        description="Set up your team's private app workspace"
        path="/org/new"
      />
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          <StepIndicator current={step} />

          {step === 0 && (
            <StepDetails
              name={name}
              setName={setName}
              slug={slug}
              setSlug={setSlug}
              domain={domain}
              setDomain={setDomain}
              onNext={() => setStep(1)}
            />
          )}

          {step === 1 && (
            <StepPlan
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
              onNext={() => setStep(2)}
              onBack={() => setStep(0)}
            />
          )}

          {step === 2 && (
            <StepInvite
              emails={inviteEmails}
              setEmails={setInviteEmails}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}

          {step === 3 && (
            <StepReady
              orgName={name}
              planName={selectedTier?.name ?? selectedPlan}
              emailCount={inviteEmails.length}
              creating={creating}
              onBack={() => setStep(2)}
              onFinish={handleFinish}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
