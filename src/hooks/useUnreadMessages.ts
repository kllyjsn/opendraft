import { useEffect, useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

// Generate a short notification chime using Web Audio API
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

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

    setTimeout(() => ctx.close(), 1000);
  } catch {
    // Audio not available
  }
}

function showBrowserNotification(count: number) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  try {
    const notification = new Notification("OpenDraft", {
      body: `You have ${count} new message${count !== 1 ? "s" : ""}`,
      icon: "/favicon.ico",
      tag: "opendraft-message",
      silent: true,
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = "/messages";
      notification.close();
    };

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

  useEffect(() => {
    if (user && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [user]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const { count } = await api.get<{ count: number }>("/conversations/unread-count");
      const newCount = count ?? 0;

      if (initialLoadDone.current && newCount > prevCountRef.current) {
        const newMessages = newCount - prevCountRef.current;
        playNotificationSound();
        showBrowserNotification(newMessages);
      }

      prevCountRef.current = newCount;
      initialLoadDone.current = true;
      setUnreadCount(newCount);
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      prevCountRef.current = 0;
      initialLoadDone.current = false;
      return;
    }

    fetchUnreadCount();

    // Poll every 30 seconds instead of realtime subscription
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  return { unreadCount };
}
