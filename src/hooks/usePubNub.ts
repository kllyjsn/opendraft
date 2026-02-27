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
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const pubnubRef = useRef<PubNub | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSignalRef = useRef<number>(0);

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
        // Clear typing when a message arrives from the typing user
        if (typeof msg === "object" && msg.sender_id) {
          setTypingUserId((prev) => (prev === msg.sender_id ? null : prev));
        }
      },
      signal: (event) => {
        const data = event.message as { type?: string; userId?: string };
        if (data.type === "typing" && data.userId !== globalConfig?.userId) {
          setTypingUserId(data.userId ?? null);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setTypingUserId(null), 4000);
        } else if (data.type === "stop_typing" && data.userId !== globalConfig?.userId) {
          setTypingUserId(null);
        } else if (data.type === "read_receipt" && data.userId !== globalConfig?.userId) {
          // The other user read our messages — mark all as read
          setMessages((prev) =>
            prev.map((m) =>
              m.sender_id === globalConfig?.userId && !m.read
                ? { ...m, read: true }
                : m
            )
          );
        }
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
      setTypingUserId(null);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId]);

  // Send typing signal (throttled to once per 2s)
  const sendTypingSignal = useCallback(() => {
    if (!conversationId || !pubnubRef.current || !globalConfig) return;
    const now = Date.now();
    if (now - lastSignalRef.current < 2000) return;
    lastSignalRef.current = now;
    const channel = `chat_${conversationId}`;
    pubnubRef.current.signal({
      channel,
      message: { type: "typing", userId: globalConfig.userId },
    }).catch(() => {});
  }, [conversationId]);

  const sendStopTyping = useCallback(() => {
    if (!conversationId || !pubnubRef.current || !globalConfig) return;
    const channel = `chat_${conversationId}`;
    pubnubRef.current.signal({
      channel,
      message: { type: "stop_typing", userId: globalConfig.userId },
    }).catch(() => {});
  }, [conversationId]);

  // Mark messages as read & notify sender via signal
  const markAsRead = useCallback(async (convoId: string) => {
    if (!globalConfig) return;
    const myId = globalConfig.userId;

    // Update DB: mark unread messages from the other person as read
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("conversation_id", convoId)
      .eq("read", false)
      .neq("sender_id", myId);

    // Update local state
    setMessages((prev) =>
      prev.map((m) =>
        m.conversation_id === convoId && m.sender_id !== myId && !m.read
          ? { ...m, read: true }
          : m
      )
    );

    // Notify the other user via PubNub signal so their UI updates in real-time
    if (pubnubRef.current) {
      const channel = `chat_${convoId}`;
      pubnubRef.current.signal({
        channel,
        message: { type: "read_receipt", userId: myId },
      }).catch(() => {});
    }
  }, []);

  // Load existing messages from DB
  const loadMessages = useCallback(async (convoId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convoId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as ChatMessage[]);

    // Auto-mark as read on load
    await markAsRead(convoId);
  }, [markAsRead]);

  useEffect(() => {
    if (conversationId) loadMessages(conversationId);
  }, [conversationId, loadMessages]);

  // Send message via edge function
  const sendMessage = useCallback(
    async (content: string, listingId?: string, sellerId?: string, recipientId?: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      sendStopTyping();

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
    [conversationId, sendStopTyping]
  );

  return { messages, connected, sendMessage, setMessages, markAsRead, typingUserId, sendTypingSignal, sendStopTyping };
}
