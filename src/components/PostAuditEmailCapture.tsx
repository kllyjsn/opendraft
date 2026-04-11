import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface PostAuditEmailCaptureProps {
  businessName: string;
  industry: string;
  topApp: string;
  monthlySavings: number;
  url: string;
}

export function PostAuditEmailCapture({
  businessName,
  industry,
  topApp,
  monthlySavings,
  url,
}: PostAuditEmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || sent) return;

    setLoading(true);
    try {
      const { data: data } = await api.post<{ data: any }>("/functions/post-audit-drip", {
          email: email.trim(),
          business_name: businessName,
          industry,
          top_app: topApp,
          monthly_savings: monthlySavings,
          url,
        },);
      setSent(true);
      toast.success("We'll email your audit results!");
    } catch {
      toast.error("Failed to save — try again");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4 mb-6 text-center"
      >
        <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-green-500/10 mb-2">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
        </div>
        <p className="text-xs font-bold text-foreground">You'll get your full audit report</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Plus ROI breakdown and custom recommendations for {businessName}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="rounded-2xl border border-primary/20 bg-primary/5 p-4 mb-6"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="rounded-lg bg-primary/10 p-1.5">
          <Mail className="h-3.5 w-3.5 text-primary" />
        </div>
        <div>
          <p className="text-xs font-bold">Get your audit results by email</p>
          <p className="text-[10px] text-muted-foreground">
            Save ${monthlySavings > 0 ? `$${monthlySavings}/mo` : "time"} — we'll send your full report + build guide
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 h-9 text-xs bg-background/60 border-border/50"
          required
        />
        <Button
          type="submit"
          size="sm"
          disabled={loading || !email.trim()}
          className="h-9 px-4 text-xs font-bold gradient-hero text-primary-foreground border-0"
        >
          {loading ? "…" : <><Send className="h-3 w-3 mr-1" /> Send</>}
        </Button>
      </form>
    </motion.div>
  );
}
