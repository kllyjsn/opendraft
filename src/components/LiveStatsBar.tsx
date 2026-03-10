import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Package, Users, ShoppingBag, Star, Bot, Building2 } from "lucide-react";

interface StatItem {
  icon: typeof Package;
  value: string;
  label: string;
  link?: string;
}

function AnimatedNumber({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (target === 0) return;
    const duration = 1200;
    const start = performance.now();
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target]);

  return <>{display.toLocaleString()}</>;
}

export function LiveStatsBar() {
  const [stats, setStats] = useState<StatItem[]>([]);

  useEffect(() => {
    async function load() {
      const [listingsRes, purchasesRes, profilesRes] = await Promise.all([
        supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "live"),
        supabase.from("purchases").select("id", { count: "exact", head: true }),
        supabase.from("public_profiles").select("user_id", { count: "exact", head: true }),
      ]);

      const appCount = listingsRes.count ?? 0;
      const salesCount = purchasesRes.count ?? 0;
      const builderCount = profilesRes.count ?? 0;

      const items: StatItem[] = [
        { icon: Package, value: String(appCount), label: "Ready-to-launch apps" },
        ...(salesCount >= 50 ? [{ icon: ShoppingBag, value: String(salesCount), label: "Apps sold" }] : []),
        { icon: Bot, value: "14", label: "Gremlins™ working 24/7" },
        { icon: Building2, value: "12", label: "Industries covered" },
      ];

      setStats(items);
    }
    load();
  }, []);

  if (stats.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mt-6"
    >
      {stats.map(({ icon: Icon, value, label }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-1 rounded-xl glass px-3 py-3 text-center"
        >
          <Icon className="h-4 w-4 text-primary mb-0.5" />
          <span className="text-xl md:text-2xl font-black text-foreground tabular-nums">
            {value === "4.8" ? "4.8" : <AnimatedNumber target={parseInt(value)} />}
          </span>
          <span className="text-[10px] md:text-xs text-muted-foreground font-medium">{label}</span>
        </div>
      ))}
    </motion.div>
  );
}
