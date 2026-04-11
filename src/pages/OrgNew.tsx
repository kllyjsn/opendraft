import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MetaTags } from "@/components/MetaTags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Building2, ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export default function OrgNew() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [domain, setDomain] = useState("");
  const [creating, setCreating] = useState(false);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === slugify(name)) {
      setSlug(slugify(val));
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !name.trim() || !slug.trim()) return;

    setCreating(true);
    const { data, error } = await api.from("organizations")
      .insert({
        name: name.trim(),
        slug: slug.trim(),
        domain: domain.trim() || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Could not create organization",
        description: error.message.includes("duplicate")
          ? "That slug is already taken. Try a different one."
          : error.message,
        variant: "destructive",
      });
      setCreating(false);
      return;
    }

    toast({ title: "Organization created!", description: `Welcome to ${data.name}` });
    navigate(`/org/${data.slug}`);
  }

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
            <h1 className="text-2xl font-bold mb-2">Sign in to create an organization</h1>
            <p className="text-muted-foreground mb-6">You need an account to set up a team workspace.</p>
            <Button onClick={() => navigate("/login")} className="bg-foreground text-background hover:bg-foreground/90">
              Sign in
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MetaTags title="Create Organization | OpenDraft" description="Set up your team's private app workspace" path="/org/new" />
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-black tracking-tight mb-2">Create your organization</h1>
            <p className="text-muted-foreground text-sm">
              Set up a private workspace for your team to discover, deploy, and manage apps.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
              <Label htmlFor="org-domain">Company domain <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                id="org-domain"
                placeholder="acme.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                maxLength={100}
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">Used for future SSO and domain-based auto-join.</p>
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-semibold bg-foreground text-background hover:bg-foreground/90"
              disabled={creating || !name.trim()}
            >
              {creating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating…</>
              ) : (
                <>Create organization <ArrowRight className="h-4 w-4 ml-2" /></>
              )}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
