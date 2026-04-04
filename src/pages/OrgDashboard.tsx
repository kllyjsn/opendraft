import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MetaTags } from "@/components/MetaTags";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrg } from "@/hooks/useOrg";
import { useAuth } from "@/hooks/useAuth";
import { OrgOverview } from "@/components/org/OrgOverview";
import { OrgMembers } from "@/components/org/OrgMembers";
import { OrgCatalog } from "@/components/org/OrgCatalog";
import { OrgSettings } from "@/components/org/OrgSettings";
import { Building2, Loader2, Users, Package, Settings, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function OrgDashboard() {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orgData, setOrgData] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [appCount, setAppCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!slug || !user) { setLoading(false); return; }

    async function load() {
      setLoading(true);

      const { data: org } = await supabase
        .from("organizations")
        .select("*")
        .eq("slug", slug!)
        .single();

      if (!org) { setLoading(false); return; }
      setOrgData(org);

      // Members
      const { data: memberData } = await supabase
        .from("org_members")
        .select("*")
        .eq("org_id", org.id);

      if (memberData) {
        const userIds = memberData.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);
        const enriched = memberData.map(m => ({
          ...m,
          profile: profileMap.get(m.user_id) ?? undefined,
        }));
        setMembers(enriched);
        const mine = enriched.find(m => m.user_id === user!.id);
        setMyRole(mine?.role ?? null);
      }

      // App count
      const { count } = await supabase
        .from("org_listings")
        .select("id", { count: "exact", head: true })
        .eq("org_id", org.id);
      setAppCount(count ?? 0);

      setLoading(false);
    }
    load();
  }, [slug, user, refreshKey]);

  const isAdmin = myRole === "owner" || myRole === "admin";
  const refetch = () => setRefreshKey(k => k + 1);

  if (authLoading || loading) {
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
            <h1 className="text-2xl font-bold mb-2">Sign in to view this organization</h1>
            <Button onClick={() => navigate("/login")} className="bg-foreground text-background hover:bg-foreground/90 mt-4">
              Sign in
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!orgData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Organization not found</h1>
            <p className="text-muted-foreground mb-4">
              You may not have access, or this organization doesn't exist.
            </p>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Back to dashboard
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MetaTags
        title={`${orgData.name} — Organization Dashboard | OpenDraft`}
        description={`Manage ${orgData.name}'s private app catalog, team members, and settings.`}
        path={`/org/${slug}`}
      />
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <div className="border-b border-border/40 bg-card">
          <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight">{orgData.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {members.length} member{members.length !== 1 ? "s" : ""} · {appCount} app{appCount !== 1 ? "s" : ""} · {(orgData.subscription_tier ?? "team").charAt(0).toUpperCase() + (orgData.subscription_tier ?? "team").slice(1)} plan
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Tabs defaultValue="overview">
            <TabsList className="mb-8">
              <TabsTrigger value="overview" className="gap-1.5">
                <LayoutDashboard className="h-3.5 w-3.5" /> Overview
              </TabsTrigger>
              <TabsTrigger value="members" className="gap-1.5">
                <Users className="h-3.5 w-3.5" /> Members
              </TabsTrigger>
              <TabsTrigger value="catalog" className="gap-1.5">
                <Package className="h-3.5 w-3.5" /> App Catalog
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="settings" className="gap-1.5">
                  <Settings className="h-3.5 w-3.5" /> Settings
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="overview">
              <OrgOverview
                orgName={orgData.name}
                memberCount={members.length}
                appCount={appCount}
                tier={orgData.subscription_tier}
                maxSeats={orgData.max_seats}
                maxApps={orgData.max_apps}
                members={members}
              />
            </TabsContent>

            <TabsContent value="members">
              <OrgMembers
                orgId={orgData.id}
                members={members}
                isAdmin={isAdmin}
                onRefresh={refetch}
              />
            </TabsContent>

            <TabsContent value="catalog">
              <OrgCatalog orgId={orgData.id} isAdmin={isAdmin} />
            </TabsContent>

            {isAdmin && (
              <TabsContent value="settings">
                <OrgSettings org={orgData} isAdmin={isAdmin} onRefresh={refetch} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
