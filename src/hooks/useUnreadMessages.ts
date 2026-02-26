import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Generate a short notification chime using Web Audio API
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    // Two-tone chime: C5 → E5
    [523.25, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.3);
    });

    // Clean up context after sounds finish
    setTimeout(() => ctx.close(), 1000);
  } catch {
    // Audio not available — silent fallback
  }
}

function showBrowserNotification(count: number) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  try {
    const notification = new Notification("OpenDraft", {
      body: `You have ${count} new message${count !== 1 ? "s" : ""}`,
      icon: "/favicon.ico",
      tag: "opendraft-message", // Replaces previous notification
      silent: true, // We play our own sound
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = "/messages";
      notification.close();
    };

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);
  } catch {
    // Notifications not supported
  }
}

export function useUnreadMessages() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const prevCountRef = useRef(0);
  const initialLoadDone = useRef(false);

  // Request notification permission on first use
  useEffect(() => {
    if (user && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [user]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    const { data: conversations } = await supabase
      .from("conversations")
      .select("id")
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

    if (!conversations || conversations.length === 0) {
      setUnreadCount(0);
      prevCountRef.current = 0;
      return;
    }

    const conversationIds = conversations.map((c) => c.id);

    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", conversationIds)
      .eq("read", false)
      .neq("sender_id", user.id);

    const newCount = count ?? 0;

    // Only notify if count increased (new message arrived) and not initial load
    if (initialLoadDone.current && newCount > prevCountRef.current) {
      const newMessages = newCount - prevCountRef.current;
      playNotificationSound();
      showBrowserNotification(newMessages);
    }

    prevCountRef.current = newCount;
    initialLoadDone.current = true;
    setUnreadCount(newCount);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      prevCountRef.current = 0;
      initialLoadDone.current = false;
      return;
    }

    fetchUnreadCount();

    const channel = supabase
      .channel("unread-messages-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchUnreadCount]);

  return { unreadCount };
}
