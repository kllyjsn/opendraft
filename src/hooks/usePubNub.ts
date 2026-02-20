import { useEffect, useRef, useState, useCallback } from "react";
import PubNub from "pubnub";
import { supabase } from "@/integrations/supabase/client";

interface PubNubConfig {
  subscribeKey: string;
  publishKey: string;
  userId: string;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

export function usePubNub(conversationId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const pubnubRef = useRef<PubNub | null>(null);
  const configRef = useRef<PubNubConfig | null>(null);

  // Fetch PubNub config
  useEffect(() => {
    async function getConfig() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-config`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (res.ok) {
        configRef.current = await res.json();
      }
    }
    getConfig();
  }, []);

  // Subscribe to channel
  useEffect(() => {
    if (!conversationId || !configRef.current) return;

    const pn = new PubNub({
      subscribeKey: configRef.current.subscribeKey,
      userId: configRef.current.userId,
    });

    pubnubRef.current = pn;
    const channel = `chat_${conversationId}`;

    pn.addListener({
      message: (event) => {
        const msg = event.message as unknown as ChatMessage;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      },
      status: (event) => {
        if (event.category === "PNConnectedCategory") {
          setConnected(true);
        }
      },
    });

    pn.subscribe({ channels: [channel] });

    return () => {
      pn.unsubscribe({ channels: [channel] });
      pn.removeAllListeners();
      setConnected(false);
    };
  }, [conversationId, configRef.current]);

  // Load existing messages from DB
  const loadMessages = useCallback(async (convoId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convoId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as ChatMessage[]);
  }, []);

  useEffect(() => {
    if (conversationId) loadMessages(conversationId);
  }, [conversationId, loadMessages]);

  // Send message via edge function
  const sendMessage = useCallback(
    async (content: string, listingId?: string, sellerId?: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-message`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversationId,
            listingId,
            sellerId,
            content,
          }),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      return result;
    },
    [conversationId]
  );

  return { messages, connected, sendMessage, setMessages };
}
