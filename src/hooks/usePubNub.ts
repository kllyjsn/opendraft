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

// Global PubNub instance for presence (shared across hook instances)
let globalPubnub: PubNub | null = null;
let globalConfig: PubNubConfig | null = null;
let presenceChannel = "global_presence";
const onlineUsersListeners = new Set<(users: Set<string>) => void>();
let onlineUsersSet = new Set<string>();

function notifyPresenceListeners() {
  onlineUsersListeners.forEach((fn) => fn(new Set(onlineUsersSet)));
}

async function initGlobalPresence() {
  if (globalPubnub) return;

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
  if (!res.ok) return;

  globalConfig = await res.json();
  if (!globalConfig) return;

  globalPubnub = new PubNub({
    subscribeKey: globalConfig.subscribeKey,
    userId: globalConfig.userId,
    presenceTimeout: 60,
    heartbeatInterval: 30,
  });

  globalPubnub.addListener({
    presence: (event) => {
      if (event.action === "join") {
        onlineUsersSet.add(event.uuid);
        notifyPresenceListeners();
      } else if (event.action === "leave" || event.action === "timeout") {
        onlineUsersSet.delete(event.uuid);
        notifyPresenceListeners();
      }
    },
  });

  globalPubnub.subscribe({ channels: [presenceChannel], withPresence: true });

  // Fetch who's already here
  try {
    const result = await globalPubnub.hereNow({ channels: [presenceChannel], includeUUIDs: true });
    const channel = result.channels[presenceChannel];
    if (channel?.occupants) {
      channel.occupants.forEach((o) => onlineUsersSet.add(o.uuid));
      notifyPresenceListeners();
    }
  } catch {
    // non-critical
  }
}

export function usePresence() {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set(onlineUsersSet));

  useEffect(() => {
    initGlobalPresence();
    const listener = (users: Set<string>) => setOnlineUsers(users);
    onlineUsersListeners.add(listener);
    return () => {
      onlineUsersListeners.delete(listener);
    };
  }, []);

  const isOnline = useCallback((userId: string) => onlineUsers.has(userId), [onlineUsers]);

  return { onlineUsers, isOnline };
}

export function usePubNub(conversationId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const pubnubRef = useRef<PubNub | null>(null);

  // Subscribe to conversation channel
  useEffect(() => {
    if (!conversationId || !globalConfig) return;

    const pn = new PubNub({
      subscribeKey: globalConfig.subscribeKey,
      userId: globalConfig.userId,
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
  }, [conversationId]);

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
    async (content: string, listingId?: string, sellerId?: string, recipientId?: string) => {
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
            recipientId,
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
