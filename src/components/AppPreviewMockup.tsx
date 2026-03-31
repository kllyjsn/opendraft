import { motion } from "framer-motion";
import { Monitor, Smartphone, LayoutDashboard, BarChart3, Users, Settings, Calendar, FileText } from "lucide-react";

interface AppPreviewMockupProps {
  appName: string;
  category: string;
  brandColors?: {
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
  };
}

const CATEGORY_LAYOUTS: Record<string, { sections: { icon: typeof Monitor; label: string; w: string }[] }> = {
  saas_tool: {
    sections: [
      { icon: LayoutDashboard, label: "Dashboard", w: "w-full" },
      { icon: BarChart3, label: "Analytics", w: "w-1/2" },
      { icon: Users, label: "Users", w: "w-1/2" },
      { icon: Settings, label: "Settings", w: "w-full" },
    ],
  },
  ai_app: {
    sections: [
      { icon: LayoutDashboard, label: "AI Chat", w: "w-full" },
      { icon: FileText, label: "History", w: "w-1/2" },
      { icon: BarChart3, label: "Insights", w: "w-1/2" },
      { icon: Settings, label: "Config", w: "w-full" },
    ],
  },
  utility: {
    sections: [
      { icon: LayoutDashboard, label: "Overview", w: "w-full" },
      { icon: Calendar, label: "Schedule", w: "w-1/2" },
      { icon: FileText, label: "Reports", w: "w-1/2" },
      { icon: Settings, label: "Settings", w: "w-full" },
    ],
  },
  landing_page: {
    sections: [
      { icon: Monitor, label: "Hero", w: "w-full" },
      { icon: BarChart3, label: "Features", w: "w-1/2" },
      { icon: Users, label: "Testimonials", w: "w-1/2" },
      { icon: FileText, label: "CTA", w: "w-full" },
    ],
  },
};

export function AppPreviewMockup({ appName, category, brandColors }: AppPreviewMockupProps) {
  const layout = CATEGORY_LAYOUTS[category] || CATEGORY_LAYOUTS.saas_tool;
  const primaryColor = brandColors?.primary_color || "hsl(var(--primary))";
  const accentColor = brandColors?.accent_color || "hsl(var(--accent))";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl border border-border/40 bg-card overflow-hidden"
    >
      {/* Title bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/40 border-b border-border/30">
        <div className="flex gap-1">
          <div className="h-2 w-2 rounded-full bg-destructive/60" />
          <div className="h-2 w-2 rounded-full bg-amber-400/60" />
          <div className="h-2 w-2 rounded-full bg-green-400/60" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="rounded-md bg-background/80 border border-border/30 px-3 py-0.5 text-[8px] text-muted-foreground font-mono truncate max-w-[140px]">
            {appName.toLowerCase().replace(/\s+/g, "-")}.opendraft.app
          </div>
        </div>
      </div>

      {/* App content mockup */}
      <div className="p-3 min-h-[120px]">
        {/* Sidebar + content layout */}
        <div className="flex gap-2">
          {/* Mini sidebar */}
          <div className="w-10 shrink-0 space-y-1.5">
            {layout.sections.slice(0, 4).map((section, i) => (
              <motion.div
                key={section.label}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className={`flex items-center justify-center h-7 rounded-md transition-colors ${
                  i === 0 ? "bg-primary/10" : "hover:bg-muted/40"
                }`}
              >
                <section.icon
                  className="h-3 w-3"
                  style={{ color: i === 0 ? primaryColor : "hsl(var(--muted-foreground))" }}
                />
              </motion.div>
            ))}
          </div>

          {/* Main content area */}
          <div className="flex-1 space-y-2">
            {/* Header bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="flex items-center justify-between"
            >
              <div
                className="h-2.5 rounded-full w-16"
                style={{ backgroundColor: primaryColor, opacity: 0.2 }}
              />
              <div className="flex gap-1">
                <div className="h-5 w-12 rounded-md text-[6px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: primaryColor }}>
                  Action
                </div>
              </div>
            </motion.div>

            {/* Content blocks */}
            <div className="grid grid-cols-2 gap-1.5">
              {[1, 2, 3, 4].map((n) => (
                <motion.div
                  key={n}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + n * 0.04 }}
                  className="rounded-lg border border-border/30 bg-muted/20 p-2"
                >
                  <div className="h-1.5 w-8 rounded-full bg-foreground/10 mb-1.5" />
                  <div
                    className="h-6 rounded-md"
                    style={{
                      backgroundColor: n === 1 ? primaryColor : accentColor,
                      opacity: n === 1 ? 0.15 : 0.08,
                    }}
                  />
                  <div className="h-1 w-6 rounded-full bg-foreground/5 mt-1.5" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
