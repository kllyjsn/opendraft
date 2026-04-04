import { motion } from "framer-motion";
import { useRef } from "react";
import { BarChart3, Users, FolderKanban, ShieldCheck, Receipt, UserCog } from "lucide-react";

import analytics from "@/assets/showcase/enterprise-analytics.jpg";
import crm from "@/assets/showcase/enterprise-crm.jpg";
import projects from "@/assets/showcase/enterprise-projects.jpg";
import security from "@/assets/showcase/enterprise-security.jpg";
import billing from "@/assets/showcase/enterprise-billing.jpg";
import hr from "@/assets/showcase/enterprise-hr.jpg";

const showcaseItems = [
  { src: analytics, label: "Revenue Analytics", desc: "Real-time KPIs & forecasting", icon: BarChart3, accent: "from-violet-500/20 to-indigo-500/20" },
  { src: crm, label: "CRM Platform", desc: "Pipeline & contact management", icon: Users, accent: "from-blue-500/20 to-cyan-500/20" },
  { src: projects, label: "Project Ops", desc: "Kanban, sprints & team tracking", icon: FolderKanban, accent: "from-emerald-500/20 to-teal-500/20" },
  { src: billing, label: "Billing Portal", desc: "Invoicing & revenue summary", icon: Receipt, accent: "from-amber-500/20 to-orange-500/20" },
  { src: security, label: "Security & Compliance", desc: "SOC 2, GDPR & audit logs", icon: ShieldCheck, accent: "from-rose-500/20 to-pink-500/20" },
  { src: hr, label: "People & HR", desc: "Org charts & headcount planning", icon: UserCog, accent: "from-sky-500/20 to-blue-500/20" },
];

export function AppShowcase() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Subtle ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] rounded-full bg-primary/[0.03] blur-[160px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 md:mb-14"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-3">
            Built for enterprise
          </p>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-[-0.03em] leading-[1.05] text-foreground">
            Production-grade apps.
            <br />
            <span className="text-muted-foreground">Owned by you.</span>
          </h2>
        </motion.div>

        {/* ── Mobile: horizontal scroll cards ── */}
        <div className="md:hidden">
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide"
          >
            {showcaseItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.06 }}
                  className="flex-shrink-0 w-[280px] snap-start"
                >
                  <div className="rounded-2xl border border-border/40 bg-card overflow-hidden group">
                    {/* Image */}
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={item.src}
                        alt={item.label}
                        loading="lazy"
                        width={800}
                        height={512}
                        className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                      />
                      {/* Gradient scrim */}
                      <div className={`absolute inset-0 bg-gradient-to-t ${item.accent} via-transparent to-transparent opacity-60`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                    </div>
                    {/* Info */}
                    <div className="p-4 -mt-6 relative z-10">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="h-7 w-7 rounded-lg bg-foreground/[0.06] flex items-center justify-center">
                          <Icon className="h-3.5 w-3.5 text-foreground" />
                        </div>
                        <p className="text-sm font-bold text-foreground">{item.label}</p>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          {/* Scroll indicator dots */}
          <div className="flex justify-center gap-1.5 mt-2">
            {showcaseItems.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all ${i === 0 ? "w-4 bg-foreground" : "w-1 bg-border"}`} />
            ))}
          </div>
        </div>

        {/* ── Desktop: masonry-style grid ── */}
        <div className="hidden md:grid grid-cols-3 gap-4 max-w-5xl mx-auto">
          {showcaseItems.map((item, i) => {
            const Icon = item.icon;
            const isLarge = i === 0 || i === 3;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.7, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
                className={`group relative rounded-2xl overflow-hidden border border-border/30 bg-card cursor-pointer transition-shadow duration-500 hover:shadow-xl hover:shadow-foreground/[0.04] ${
                  isLarge ? "row-span-2" : ""
                }`}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={item.src}
                    alt={item.label}
                    loading="lazy"
                    width={800}
                    height={512}
                    className={`w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03] ${
                      isLarge ? "h-[420px]" : "h-[200px]"
                    }`}
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${item.accent} via-transparent to-transparent opacity-40`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Hover label */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-400">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-6 w-6 rounded-md bg-foreground/10 backdrop-blur-sm flex items-center justify-center">
                        <Icon className="h-3 w-3 text-foreground" />
                      </div>
                      <p className="text-sm font-bold text-foreground">{item.label}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
