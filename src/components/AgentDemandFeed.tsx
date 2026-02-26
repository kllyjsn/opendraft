import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bot, TrendingUp, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface DemandSignal {
  query: string;
  category: string | null;
  tech_stack: string[] | null;
  created_at: string;
  source: string;
}

export function AgentDemandFeed() {
  const [signals, setSignals] = useState<DemandSignal[]>([]);

  useEffect(() => {
    supabase
      .from("agent_demand_signals")
      .select("query, category, tech_stack, created_at, source")
      .order("created_at", { ascending: false })
      .limit(15)
      .then(({ data }) => setSignals(data ?? []));
  }, []);

  if (signals.length === 0) return null;

  // Group by frequency
  const queryCounts = new Map<string, number>();
  signals.forEach((s) => {
    const key = s.query.toLowerCase().trim();
    queryCounts.set(key, (queryCounts.get(key) || 0) + 1);
  });

  const topQueries = [...queryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="h-6 w-6 rounded-lg gradient-hero flex items-center justify-center">
            <Bot className="h-3.5 w-3.5 text-white" />
          </div>
          Agent Demand Feed
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse ml-auto" />
        </CardTitle>
        <p className="text-xs text-muted-foreground">What agents are searching for but can't find</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Top unmet queries */}
        {topQueries.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Most Requested
            </p>
            <div className="space-y-1.5">
              {topQueries.map(([query, count]) => (
                <div key={query} className="flex items-center gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                  <span className="text-sm flex-1 font-medium">"{query}"</span>
                  <Badge variant="secondary" className="text-[10px]">{count}x</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent signals */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Recent Searches</p>
          <div className="space-y-1">
            {signals.slice(0, 8).map((signal, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Bot className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate text-muted-foreground">"{signal.query}"</span>
                {signal.category && (
                  <Badge variant="outline" className="text-[9px] shrink-0">{signal.category}</Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        <Link to="/sell" className="flex items-center gap-1 text-xs text-primary hover:underline font-semibold pt-2">
          Build something agents want <ArrowRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
