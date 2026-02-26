import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ChatDrawer } from "@/components/ChatDrawer";
import { usePresence } from "@/hooks/usePubNub";
import { MessageSquare, Loader2, Search, Plus, Circle, X, Bell } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { NotificationsList } from "@/components/NotificationsList";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  updated_at: string;
  listing_title?: string;
  other_username?: string;
  other_user_id?: string;
  last_message?: string;
  unread_count?: number;
}

interface UserResult {
  user_id: string;
  username: string;
  avatar_url: string | null;
}

export default function Messages() {
  const { user, loading: authLoading } = useAuth();
  const { isOnline } = usePresence();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") === "notifications" ? "notifications" : "conversations");

  // New conversation state
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [dmTarget, setDmTarget] = useState<UserResult | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchConversations();
  }, [user]);

  async function fetchConversations() {
    if (!user) return;
    setLoading(true);

    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    if (!convos || convos.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Enrich with listing titles and other user profiles
    const listingIds = [...new Set(convos.map((c) => c.listing_id).filter(Boolean))] as string[];
    const otherUserIds = [...new Set(convos.map((c) => (c.buyer_id === user.id ? c.seller_id : c.buyer_id)))];

    const [profilesRes, messagesRes, listingsRes] = await Promise.all([
      supabase.from("public_profiles").select("user_id, username").in("user_id", otherUserIds),
      supabase
        .from("messages")
        .select("conversation_id, content, created_at, read, sender_id")
        .in("conversation_id", convos.map((c) => c.id))
        .order("created_at", { ascending: false }),
      listingIds.length > 0
        ? supabase.from("listings").select("id, title").in("id", listingIds)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    ]);

    const profiles = profilesRes.data;
    const lastMessages = messagesRes.data;
    const listings = listingsRes.data;

    const listingMap = new Map(listings?.map((l: any) => [l.id, l.title]) ?? []);
    const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p.username]) ?? []);

    // Group last messages by conversation
    const lastMsgMap = new Map<string, { content: string; unread: number }>();
    for (const msg of lastMessages ?? []) {
      if (!lastMsgMap.has(msg.conversation_id)) {
        const unreadCount = (lastMessages ?? []).filter(
          (m: any) => m.conversation_id === msg.conversation_id && !m.read && m.sender_id !== user.id
        ).length;
        lastMsgMap.set(msg.conversation_id, { content: msg.content, unread: unreadCount });
      }
    }

    const enriched = convos.map((c): Conversation => {
      const otherId = c.buyer_id === user.id ? c.seller_id : c.buyer_id;
      const lastMsg = lastMsgMap.get(c.id);
      return {
        ...c,
        listing_title: c.listing_id ? (listingMap.get(c.listing_id) ?? "Unknown listing") : undefined,
        other_username: profileMap.get(otherId) ?? "Anonymous",
        other_user_id: otherId,
        last_message: lastMsg?.content,
        unread_count: lastMsg?.unread ?? 0,
      };
    });

    setConversations(enriched);
    setLoading(false);
  }

  function openChat(convo: Conversation) {
    setActiveConvo(convo);
    setDrawerOpen(true);
  }

  async function searchUsers(query: string) {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const { data } = await supabase
      .from("public_profiles")
      .select("user_id, username, avatar_url")
      .ilike("username", `%${query.trim()}%`)
      .neq("user_id", user?.id ?? "")
      .limit(10);
    setSearchResults((data as UserResult[]) ?? []);
    setSearching(false);
  }

  function startDM(target: UserResult) {
    setDmTarget(target);
    setShowNewChat(false);
    setSearchQuery("");
    setSearchResults([]);
    setActiveConvo(null);
    setDrawerOpen(true);
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Sign in to view messages</h2>
            <Link to="/login">
              <Button className="gradient-hero text-white border-0 shadow-glow">Sign in</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black">Messages</h1>
          {activeTab === "conversations" && (
            <Button
              onClick={() => setShowNewChat(!showNewChat)}
              variant={showNewChat ? "outline" : "default"}
              size="sm"
              className={cn(!showNewChat && "gradient-hero text-white border-0 shadow-glow")}
            >
              {showNewChat ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              {showNewChat ? "Cancel" : "New message"}
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="w-full">
            <TabsTrigger value="conversations" className="flex-1 gap-1.5">
              <MessageSquare className="h-4 w-4" /> Conversations
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1 gap-1.5">
              <Bell className="h-4 w-4" /> Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conversations" className="mt-4">
            {/* New chat - user search */}
            {showNewChat && (
              <div className="mb-6 rounded-2xl border border-primary/30 bg-card p-5 shadow-card">
                <p className="text-sm font-bold mb-3">Start a conversation</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => searchUsers(e.target.value)}
                    placeholder="Search users by name…"
                    className="pl-9"
                    autoFocus
                  />
                </div>
                {searching && (
                  <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Searching…
                  </div>
                )}
                {searchResults.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {searchResults.map((u) => (
                      <button
                        key={u.user_id}
                        onClick={() => startDM(u)}
                        className="w-full text-left flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/60 transition-colors"
                      >
                        <div className="h-8 w-8 rounded-full gradient-hero flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {u.username?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <span className="text-sm font-medium flex-1 truncate">{u.username}</span>
                        <Circle
                          className={cn(
                            "h-2.5 w-2.5 shrink-0",
                            isOnline(u.user_id)
                              ? "fill-emerald-500 text-emerald-500"
                              : "fill-muted-foreground/30 text-muted-foreground/30"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-3">No users found</p>
                )}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h2 className="text-lg font-bold mb-2">No conversations yet</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Start a new conversation using the button above, or chat with a seller on any listing.
                </p>
                <Link to="/">
                  <Button variant="outline">Browse listings</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((convo) => (
                  <button
                    key={convo.id}
                    onClick={() => openChat(convo)}
                    className="w-full text-left rounded-2xl border border-border/60 bg-card p-4 hover:border-primary/40 transition-all shadow-card group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm truncate">
                            {convo.other_username}
                          </span>
                          <Circle
                            className={cn(
                              "h-2 w-2 shrink-0",
                              convo.other_user_id && isOnline(convo.other_user_id)
                                ? "fill-emerald-500 text-emerald-500"
                                : "fill-muted-foreground/30 text-muted-foreground/30"
                            )}
                          />
                          {(convo.unread_count ?? 0) > 0 && (
                            <span className="flex-shrink-0 h-5 min-w-[20px] px-1.5 rounded-full gradient-hero text-white text-[10px] font-bold flex items-center justify-center">
                              {convo.unread_count}
                            </span>
                          )}
                        </div>
                        {convo.listing_title && (
                          <p className="text-xs text-muted-foreground truncate mb-1">
                            Re: {convo.listing_title}
                          </p>
                        )}
                        {!convo.listing_id && (
                          <p className="text-xs text-muted-foreground truncate mb-1">
                            Direct message
                          </p>
                        )}
                        {convo.last_message && (
                          <p className="text-sm text-muted-foreground truncate">
                            {convo.last_message}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 mt-1">
                        {new Date(convo.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notifications" className="mt-4">
            <NotificationsList userId={user.id} />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />

      <ChatDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) {
            setDmTarget(null);
            fetchConversations();
          }
        }}
        conversationId={activeConvo?.id ?? null}
        listingId={activeConvo?.listing_id ?? undefined}
        recipientId={dmTarget?.user_id}
        listingTitle={activeConvo?.listing_title}
        otherUsername={dmTarget?.username ?? activeConvo?.other_username}
        otherUserId={dmTarget?.user_id ?? activeConvo?.other_user_id}
      />
    </div>
  );
}
