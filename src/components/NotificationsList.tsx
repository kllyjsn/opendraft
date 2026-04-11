import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Loader2, Check, ShoppingCart, Star, UserPlus, Megaphone, Gift, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  purchase: <ShoppingCart className="h-4 w-4" />,
  review: <Star className="h-4 w-4" />,
  follow: <UserPlus className="h-4 w-4" />,
  offer: <Gift className="h-4 w-4" />,
  alert: <AlertTriangle className="h-4 w-4" />,
  announcement: <Megaphone className="h-4 w-4" />,
};

export function NotificationsList({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  async function fetchNotifications() {
    setLoading(true);
    const { data } = await api.from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications((data as Notification[]) ?? []);
    setLoading(false);
  }

  async function markRead(id: string) {
    await api.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    const unread = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unread.length === 0) return;
    for (const id of unread) {
      await api.from("notifications").update({ read: true }).eq("id", id);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function handleClick(n: Notification) {
    if (!n.read) markRead(n.id);
    if (n.link) navigate(n.link);
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
        <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-lg font-bold mb-2">No notifications yet</h2>
        <p className="text-sm text-muted-foreground">
          You'll see purchase confirmations, new followers, offers, and other updates here.
        </p>
      </div>
    );
  }

  return (
    <div>
      {unreadCount > 0 && (
        <div className="flex justify-end mb-3">
          <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
            <Check className="h-3 w-3" /> Mark all as read
          </button>
        </div>
      )}
      <div className="space-y-2">
        {notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => handleClick(n)}
            className={cn(
              "w-full text-left rounded-2xl border border-border/60 bg-card p-4 hover:border-primary/40 transition-all shadow-card group",
              !n.read && "border-primary/30 bg-primary/5"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                !n.read ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {typeIcons[n.type] ?? <Bell className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-sm truncate">{n.title}</span>
                  {!n.read && (
                    <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{n.message}</p>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0 mt-1">
                {new Date(n.created_at).toLocaleDateString()}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
