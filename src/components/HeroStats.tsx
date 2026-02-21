import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Package, ShoppingBag } from "lucide-react";

export function HeroStats() {
  const [stats, setStats] = useState({ builders: 0, projects: 0, sales: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "live"),
      supabase.from("purchases").select("id", { count: "exact", head: true }),
    ]).then(([b, p, s]) => {
      setStats({
        builders: b.count ?? 0,
        projects: p.count ?? 0,
        sales: s.count ?? 0,
      });
    });
  }, []);

  const items = [
    { icon: Users, label: "Builders", value: stats.builders },
    { icon: Package, label: "Live Projects", value: stats.projects },
    { icon: ShoppingBag, label: "App Types", value: 8 },
  ];

  if (stats.builders === 0 && stats.projects === 0) return null;

  return (
    <div className="flex items-center justify-center gap-6 md:gap-10 mt-10">
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-lg md:text-xl font-bold text-foreground">{value}</span>
          <span className="text-xs md:text-sm">{label}</span>
        </div>
      ))}
    </div>
  );
}
