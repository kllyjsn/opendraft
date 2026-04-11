import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { ChatDrawer } from "@/components/ChatDrawer";
import { usePresence } from "@/hooks/usePubNub";
import { useIsMobile } from "@/hooks/use-mobile";
import { MessageSquare, Loader2, Search, Plus, Circle, X, Bell } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { NotificationsList } from "@/components/NotificationsList";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

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
  const isMobile = useIsMobile();
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

    const { data: convos } = await api.from("conversations")
      .select("*")
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    if (!convos || convos.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const listingIds = [...new Set(convos.map((c) => c.listing_id).filter(Boolean))] as string[];
    const otherUserIds = [...new Set(convos.map((c) => (c.buyer_id === user.id ? c.seller_id : c.buyer_id)))];

    const [profilesRes, messagesRes, listingsRes] = await Promise.all([
      api.from("public_profiles").select("user_id, username").in("user_id", otherUserIds),
      api.from("messages")
        .select("conversation_id, content, created_at, read, sender_id")
        .in("conversation_id", convos.map((c) => c.id))
        .order("created_at", { ascending: false }),
      listingIds.length > 0
        ? api.from("listings").select("id, title").in("id", listingIds)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    ]);

    const profiles = profilesRes.data;
    const lastMessages = messagesRes.data;
    const listings = listingsRes.data;

    const listingMap = new Map(listings?.map((l: any) => [l.id, l.title]) ?? []);
    const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p.username]) ?? []);

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
    const { data } = await api.from("public_profiles")
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

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86_400_000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
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
      <main className={cn(
        "flex-1 container mx-auto max-w-2xl",
        isMobile ? "px-0 py-0" : "px-4 py-10"
      )}>
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between",
          isMobile ? "px-4 pt-4 pb-2" : "mb-8"
        )}>
          <h1 className={cn("font-black", isMobile ? "text-2xl" : "text-3xl")}>Messages</h1>
          {activeTab === "conversations" && (
            <Button
              onClick={() => setShowNewChat(!showNewChat)}
              variant={showNewChat ? "outline" : "default"}
              size="sm"
              className={cn(!showNewChat && "gradient-hero text-white border-0 shadow-glow")}
            >
              {showNewChat ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              {!isMobile && (showNewChat ? "Cancel" : "New message")}
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className={cn(isMobile ? "px-0" : "mb-6")}>
          <TabsList className={cn("w-full", isMobile && "rounded-none border-x-0")}>
            <TabsTrigger value="conversations" className="flex-1 gap-1.5">
              <MessageSquare className="h-4 w-4" /> {!isMobile && "Conversations"}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1 gap-1.5">
              <Bell className="h-4 w-4" /> {!isMobile && "Notifications"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conversations" className={cn(isMobile ? "mt-0 px-2" : "mt-4")}>
            {/* New chat - user search */}
            {showNewChat && (
              <div className={cn(
                "rounded-2xl border border-primary/30 bg-card shadow-card",
                isMobile ? "mx-2 mb-3 p-4" : "mb-6 p-5"
              )}>
                <p className="text-sm font-bold mb-3">Start a conversation</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => searchUsers(e.target.value)}
                    placeholder="Search users by name…"
                    className={cn("pl-9", isMobile && "h-11 text-base")}
                    autoFocus
                  />
                </div>
                {searching && (
                  <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Searching…
                  </div>
                )}
                {searchResults.length > 0 && (
                  <div className="mt-3 space-y-0.5">
                    {searchResults.map((u) => (
                      <button
                        key={u.user_id}
                        onClick={() => startDM(u)}
                        className={cn(
                          "w-full text-left flex items-center gap-3 rounded-xl hover:bg-muted/60 transition-colors",
                          isMobile ? "px-3 py-3 active:bg-muted" : "px-3 py-2.5"
                        )}
                      >
                        <div className="h-9 w-9 rounded-full gradient-hero flex items-center justify-center text-white text-xs font-bold shrink-0">
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
              <div className={cn(
                "rounded-2xl border border-dashed border-border bg-muted/30 text-center",
                isMobile ? "mx-2 p-8" : "p-12"
              )}>
                <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h2 className="text-lg font-bold mb-2">No conversations yet</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Start a new conversation or chat with a seller on any listing.
                </p>
                <Link to="/">
                  <Button variant="outline">Browse listings</Button>
                </Link>
              </div>
            ) : (
              <div className={cn(isMobile ? "space-y-0 divide-y divide-border/40" : "space-y-2")}>
                {conversations.map((convo) => {
                  const hasUnread = (convo.unread_count ?? 0) > 0;
                  return (
                    <button
                      key={convo.id}
                      onClick={() => openChat(convo)}
                      className={cn(
                        "w-full text-left transition-all group",
                        isMobile
                          ? "flex items-center gap-3 px-4 py-3.5 active:bg-muted/60"
                          : "rounded-2xl border border-border/60 bg-card p-4 hover:border-primary/40 shadow-card"
                      )}
                    >
                      {/* Avatar */}
                      <div className={cn(
                        "shrink-0 rounded-full gradient-hero flex items-center justify-center text-white font-bold relative",
                        isMobile ? "h-12 w-12 text-sm" : "h-10 w-10 text-xs hidden"
                      )}>
                        {convo.other_username?.[0]?.toUpperCase() ?? "?"}
                        {convo.other_user_id && isOnline(convo.other_user_id) && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={cn(
                              "text-sm truncate",
                              hasUnread ? "font-bold" : "font-medium"
                            )}>
                              {convo.other_username}
                            </span>
                            {!isMobile && convo.other_user_id && (
                              <Circle
                                className={cn(
                                  "h-2 w-2 shrink-0",
                                  isOnline(convo.other_user_id)
                                    ? "fill-emerald-500 text-emerald-500"
                                    : "fill-muted-foreground/30 text-muted-foreground/30"
                                )}
                              />
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] text-muted-foreground">
                              {formatTime(convo.updated_at)}
                            </span>
                            {hasUnread && (
                              <span className="h-5 min-w-[20px] px-1.5 rounded-full gradient-hero text-white text-[10px] font-bold flex items-center justify-center">
                                {convo.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                        {convo.listing_title && (
                          <p className="text-xs text-muted-foreground truncate">
                            Re: {convo.listing_title}
                          </p>
                        )}
                        {!convo.listing_id && (
                          <p className="text-xs text-muted-foreground truncate">
                            Direct message
                          </p>
                        )}
                        {convo.last_message && (
                          <p className={cn(
                            "text-sm truncate mt-0.5",
                            hasUnread ? "text-foreground font-medium" : "text-muted-foreground"
                          )}>
                            {convo.last_message}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notifications" className={cn(isMobile ? "mt-0 px-2" : "mt-4")}>
            <NotificationsList userId={user.id} />
          </TabsContent>
        </Tabs>
      </main>
      {!isMobile && <Footer />}

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
