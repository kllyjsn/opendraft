import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ChatDrawer } from "@/components/ChatDrawer";
import { MessageSquare, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Conversation {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  updated_at: string;
  listing_title?: string;
  other_username?: string;
  last_message?: string;
  unread_count?: number;
}

export default function Messages() {
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    const listingIds = [...new Set(convos.map((c) => c.listing_id))];
    const otherUserIds = [...new Set(convos.map((c) => (c.buyer_id === user.id ? c.seller_id : c.buyer_id)))];

    const [{ data: listings }, { data: profiles }, { data: lastMessages }] = await Promise.all([
      supabase.from("listings").select("id, title").in("id", listingIds),
      supabase.from("profiles").select("user_id, username").in("user_id", otherUserIds),
      supabase
        .from("messages")
        .select("conversation_id, content, created_at, read, sender_id")
        .in("conversation_id", convos.map((c) => c.id))
        .order("created_at", { ascending: false }),
    ]);

    const listingMap = new Map(listings?.map((l) => [l.id, l.title]) ?? []);
    const profileMap = new Map(profiles?.map((p) => [p.user_id, p.username]) ?? []);

    // Group last messages by conversation
    const lastMsgMap = new Map<string, { content: string; unread: number }>();
    for (const msg of lastMessages ?? []) {
      if (!lastMsgMap.has(msg.conversation_id)) {
        const unreadCount = (lastMessages ?? []).filter(
          (m) => m.conversation_id === msg.conversation_id && !m.read && m.sender_id !== user.id
        ).length;
        lastMsgMap.set(msg.conversation_id, { content: msg.content, unread: unreadCount });
      }
    }

    const enriched: Conversation[] = convos.map((c) => {
      const otherId = c.buyer_id === user.id ? c.seller_id : c.buyer_id;
      const lastMsg = lastMsgMap.get(c.id);
      return {
        ...c,
        listing_title: listingMap.get(c.listing_id) ?? "Unknown listing",
        other_username: profileMap.get(otherId) ?? "Anonymous",
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
        <h1 className="text-3xl font-black mb-8">Messages</h1>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-2">No conversations yet</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Start a conversation by clicking "Chat with Seller" on any listing.
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
                      {(convo.unread_count ?? 0) > 0 && (
                        <span className="flex-shrink-0 h-5 min-w-[20px] px-1.5 rounded-full gradient-hero text-white text-[10px] font-bold flex items-center justify-center">
                          {convo.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-1">
                      Re: {convo.listing_title}
                    </p>
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
      </main>
      <Footer />

      <ChatDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        conversationId={activeConvo?.id ?? null}
        listingTitle={activeConvo?.listing_title}
        otherUsername={activeConvo?.other_username}
      />
    </div>
  );
}
