import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, Plug, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const COMMON_INTEGRATIONS = [
  { id: "slack", name: "Slack", emoji: "💬", category: "Communication" },
  { id: "stripe", name: "Stripe", emoji: "💳", category: "Payments" },
  { id: "google-sheets", name: "Google Sheets", emoji: "📊", category: "Data" },
  { id: "hubspot", name: "HubSpot", emoji: "🧲", category: "CRM" },
  { id: "zapier", name: "Zapier", emoji: "⚡", category: "Automation" },
  { id: "google-calendar", name: "Google Calendar", emoji: "📅", category: "Scheduling" },
  { id: "mailchimp", name: "Mailchimp", emoji: "📧", category: "Email" },
  { id: "notion", name: "Notion", emoji: "📝", category: "Docs" },
  { id: "airtable", name: "Airtable", emoji: "📋", category: "Database" },
  { id: "quickbooks", name: "QuickBooks", emoji: "💰", category: "Accounting" },
  { id: "salesforce", name: "Salesforce", emoji: "☁️", category: "CRM" },
  { id: "twilio", name: "Twilio", emoji: "📱", category: "Communication" },
];

interface IntegrationPickerProps {
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function IntegrationPicker({ selected, onChange }: IntegrationPickerProps) {
  const [expanded, setExpanded] = useState(false);

  const toggle = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id]
    );
  };

  const visibleIntegrations = expanded ? COMMON_INTEGRATIONS : COMMON_INTEGRATIONS.slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-4 mb-6"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <Plug className="h-3 w-3" />
          What tools do you use today?
        </p>
        {selected.length > 0 && (
          <span className="text-[10px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
            {selected.length} selected
          </span>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground mb-3">
        Your generated apps will come pre-wired with these integrations
      </p>

      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {visibleIntegrations.map((integration) => {
            const isSelected = selected.includes(integration.id);
            return (
              <motion.button
                key={integration.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                type="button"
                onClick={() => toggle(integration.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 active:scale-95 ${
                  isSelected
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/50 bg-background/60 text-foreground/70 hover:border-primary/30 hover:bg-primary/5"
                }`}
              >
                <span>{integration.emoji}</span>
                {integration.name}
                {isSelected ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Plus className="h-3 w-3 text-muted-foreground" />
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {!expanded && COMMON_INTEGRATIONS.length > 6 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 text-[10px] text-muted-foreground hover:text-foreground font-medium underline underline-offset-2"
        >
          Show {COMMON_INTEGRATIONS.length - 6} more integrations
        </button>
      )}

      {selected.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 pt-3 border-t border-border/30"
        >
          <p className="text-[10px] text-muted-foreground">
            <span className="font-bold text-foreground">Your apps will include:</span>{" "}
            {selected
              .map((id) => COMMON_INTEGRATIONS.find((i) => i.id === id)?.name)
              .filter(Boolean)
              .join(", ")}{" "}
            integration{selected.length > 1 ? "s" : ""}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

export function getIntegrationNames(ids: string[]): string[] {
  return ids
    .map((id) => COMMON_INTEGRATIONS.find((i) => i.id === id)?.name)
    .filter(Boolean) as string[];
}
