import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false)
      .then(({ count }) => setUnreadCount(count ?? 0));
  }, [user]);

  return (
    <button
      onClick={() => navigate("/messages?tab=notifications")}
      className="relative rounded-lg p-1.5 hover:bg-muted transition-colors"
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5 text-muted-foreground" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}
