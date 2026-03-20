import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Mail, MessageSquare, Target, Megaphone, TrendingUp, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface BuyerPersona {
  title: string;
  pain_points: string[];
  use_case: string;
}

interface MarketingPacket {
  positioning_statement?: string;
  internal_sell_sheet?: {
    headline?: string;
    problem?: string;
    solution?: string;
    key_benefits?: string[];
    objection_handlers?: Record<string, string>;
  };
  buyer_personas?: BuyerPersona[];
  email_pitch?: {
    subject?: string;
    body?: string;
  };
  social_media_posts?: { platform?: string; content?: string }[];
  competitive_advantage?: string;
}

interface Props {
  listingId: string;
}

export function MarketingKitPanel({ listingId }: Props) {
  const [packet, setPacket] = useState<MarketingPacket | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>("positioning");

  useEffect(() => {
    fetchPacket();
  }, [listingId]);

  async function fetchPacket() {
    try {
      const { data, error } = await supabase.functions.invoke("get-marketing-packet", {
        body: { listingId },
      });
      if (!error && data?.packet) {
        setPacket(data.packet);
      }
    } catch (e) {
      console.error("Failed to load marketing kit:", e);
    } finally {
      setLoading(false);
    }
  }

  const toggle = (key: string) => setExpandedSection(prev => prev === key ? null : key);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card p-6 animate-pulse space-y-3">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-3 bg-muted rounded w-2/3" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    );
  }

  if (!packet) return null;

  const sections = [
    {
      key: "positioning",
      icon: Target,
      title: "Positioning",
      content: packet.positioning_statement ? (
        <p className="text-sm text-muted-foreground leading-relaxed">{packet.positioning_statement}</p>
      ) : null,
    },
    {
      key: "sell_sheet",
      icon: TrendingUp,
      title: "Internal Sell Sheet",
      content: packet.internal_sell_sheet ? (
        <div className="space-y-3">
          {packet.internal_sell_sheet.headline && (
            <p className="font-bold text-sm">{packet.internal_sell_sheet.headline}</p>
          )}
          {packet.internal_sell_sheet.problem && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Problem</p>
              <p className="text-sm text-muted-foreground">{packet.internal_sell_sheet.problem}</p>
            </div>
          )}
          {packet.internal_sell_sheet.solution && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Solution</p>
              <p className="text-sm text-muted-foreground">{packet.internal_sell_sheet.solution}</p>
            </div>
          )}
          {packet.internal_sell_sheet.key_benefits && packet.internal_sell_sheet.key_benefits.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Key Benefits</p>
              <ul className="space-y-1">
                {packet.internal_sell_sheet.key_benefits.map((b, i) => (
                  <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-0.5">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {packet.internal_sell_sheet.objection_handlers && Object.keys(packet.internal_sell_sheet.objection_handlers).length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Objection Handlers</p>
              <div className="space-y-2">
                {Object.entries(packet.internal_sell_sheet.objection_handlers).map(([q, a]) => (
                  <div key={q} className="rounded-lg bg-muted/50 p-2.5">
                    <p className="text-xs font-semibold text-foreground">"{q}"</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null,
    },
    {
      key: "personas",
      icon: Users,
      title: `Buyer Personas${packet.buyer_personas?.length ? ` (${packet.buyer_personas.length})` : ""}`,
      content: packet.buyer_personas && packet.buyer_personas.length > 0 ? (
        <div className="grid gap-3">
          {packet.buyer_personas.map((p, i) => (
            <div key={i} className="rounded-xl border border-border/40 bg-muted/30 p-3 space-y-1.5">
              <p className="font-bold text-sm">{p.title}</p>
              <p className="text-xs text-muted-foreground">{p.use_case}</p>
              {p.pain_points?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {p.pain_points.map((pp, j) => (
                    <span key={j} className="text-[10px] rounded-full bg-destructive/10 text-destructive px-2 py-0.5">
                      {pp}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null,
    },
    {
      key: "email",
      icon: Mail,
      title: "Email Pitch Template",
      content: packet.email_pitch ? (
        <div className="rounded-xl border border-border/40 bg-muted/30 p-3 space-y-2">
          {packet.email_pitch.subject && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Subject</p>
              <p className="text-sm font-semibold">{packet.email_pitch.subject}</p>
            </div>
          )}
          {packet.email_pitch.body && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Body</p>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{packet.email_pitch.body}</p>
            </div>
          )}
          <button
            onClick={() => copyToClipboard(
              `Subject: ${packet.email_pitch?.subject ?? ""}\n\n${packet.email_pitch?.body ?? ""}`,
              "email"
            )}
            className="flex items-center gap-1.5 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors mt-1"
          >
            {copiedId === "email" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copiedId === "email" ? "Copied!" : "Copy email"}
          </button>
        </div>
      ) : null,
    },
    {
      key: "social",
      icon: Megaphone,
      title: `Social Posts${packet.social_media_posts?.length ? ` (${packet.social_media_posts.length})` : ""}`,
      content: packet.social_media_posts && packet.social_media_posts.length > 0 ? (
        <div className="space-y-2">
          {packet.social_media_posts.map((p, i) => (
            <div key={i} className="rounded-xl border border-border/40 bg-muted/30 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  {p.platform && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{p.platform}</p>
                  )}
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{p.content}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(p.content ?? "", `social-${i}`)}
                  className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
                  title="Copy to clipboard"
                >
                  {copiedId === `social-${i}` ? (
                    <Check className="h-3 w-3 text-primary" />
                  ) : (
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null,
    },
  ].filter(s => s.content !== null);

  if (sections.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <Megaphone className="h-4 w-4 text-accent" />
        </div>
        <div>
          <h3 className="font-bold text-sm">Go-To-Market Kit</h3>
          <p className="text-[11px] text-muted-foreground">Marketing assets included with this app</p>
        </div>
      </div>

      {sections.map(({ key, icon: Icon, title, content }) => (
        <div key={key} className="rounded-xl border border-border/40 bg-card overflow-hidden">
          <button
            onClick={() => toggle(key)}
            className="w-full flex items-center gap-2.5 p-3 text-left hover:bg-muted/30 transition-colors"
          >
            <Icon className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-semibold flex-1">{title}</span>
            {expandedSection === key ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
          <AnimatePresence>
            {expandedSection === key && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 pt-0">{content}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
