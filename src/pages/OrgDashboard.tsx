import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MetaTags } from "@/components/MetaTags";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { OrgMembers } from "@/components/org/OrgMembers";
import { OrgCatalog } from "@/components/org/OrgCatalog";
import { OrgSettings } from "@/components/org/OrgSettings";
import { OrgAppGrid } from "@/components/org/OrgAppGrid";
import { OrgAnalytics } from "@/components/org/OrgAnalytics";
import { Building2, Loader2, Users, Package, Settings, LayoutGrid, Shield, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export default function OrgDashboard() {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orgData, setOrgData] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [appCount, setAppCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!slug || !user) { setLoading(false); return; }

    async function load() {
      setLoading(true);

      const { data: org } = await api.from("organizations")
        .select("*")
        .eq("slug", slug!)
        .single();

      if (!org) { setLoading(false); return; }
      setOrgData(org);

      const { data: memberData } = await api.from("org_members")
        .select("*")
        .eq("org_id", org.id);

      if (memberData) {
        const userIds = memberData.map(m => m.user_id);
        const { data: profiles } = await api.from("profiles")
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

      const { count } = await api.from("org_listings")
        .select("id", { count: "exact", head: true })
        .eq("org_id", org.id);
      setAppCount(count ?? 0);

      const { count: approved } = await api.from("org_listings")
        .select("id", { count: "exact", head: true })
        .eq("org_id", org.id)
        .eq("status", "approved");
      setApprovedCount(approved ?? 0);

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
            <h1 className="text-2xl font-bold mb-2">Sign in to view this workspace</h1>
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
            <h1 className="text-2xl font-bold mb-2">Workspace not found</h1>
            <p className="text-muted-foreground mb-4">
              You may not have access, or this workspace doesn't exist.
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

  const greeting = getGreeting();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MetaTags
        title={`${orgData.name} — Team Workspace | OpenDraft`}
        description={`Your team's private app workspace. Access approved apps, manage members, and more.`}
        path={`/org/${slug}`}
      />
      <Navbar />

      <main className="flex-1">
        {/* Hero header */}
        <div className="border-b border-border/30 bg-gradient-to-b from-card to-background">
          <div className="container mx-auto px-4 py-8 md:py-10 max-w-6xl">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                  <Building2 className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{greeting}</p>
                  <h1 className="text-xl md:text-2xl font-black tracking-tight">{orgData.name}</h1>
                </div>
              </div>

              {/* Quick stats */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Apps</p>
                  <p className="text-lg font-bold">{approvedCount}</p>
                </div>
                <div className="h-8 w-px bg-border/40" />
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Team</p>
                  <p className="text-lg font-bold">{members.length}</p>
                </div>
                <div className="h-8 w-px bg-border/40" />
                <Badge variant="outline" className="text-xs font-medium capitalize">
                  <Shield className="h-3 w-3 mr-1" />
                  {orgData.subscription_tier ?? "team"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Tabs defaultValue="apps">
            <TabsList className="mb-8">
              <TabsTrigger value="apps" className="gap-1.5">
                <LayoutGrid className="h-3.5 w-3.5" /> My Apps
              </TabsTrigger>
              <TabsTrigger value="members" className="gap-1.5">
                <Users className="h-3.5 w-3.5" /> Team
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="catalog" className="gap-1.5">
                  <Package className="h-3.5 w-3.5" /> Manage Catalog
                </TabsTrigger>
              )}
              {isAdmin && (
                <TabsTrigger value="analytics" className="gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5" /> ROI
                </TabsTrigger>
              )}
              {isAdmin && (
                <TabsTrigger value="settings" className="gap-1.5">
                  <Settings className="h-3.5 w-3.5" /> Settings
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="apps">
              <OrgAppGrid orgId={orgData.id} orgSlug={slug} />
            </TabsContent>

            <TabsContent value="members">
              <OrgMembers
                orgId={orgData.id}
                members={members}
                isAdmin={isAdmin}
                onRefresh={refetch}
              />
            </TabsContent>

            {isAdmin && (
              <TabsContent value="catalog">
                <OrgCatalog orgId={orgData.id} isAdmin={isAdmin} />
              </TabsContent>
            )}

            {isAdmin && (
              <TabsContent value="analytics">
                <OrgAnalytics orgId={orgData.id} memberCount={members.length} />
              </TabsContent>
            )}

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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning 👋";
  if (h < 17) return "Good afternoon 👋";
  return "Good evening 👋";
}
