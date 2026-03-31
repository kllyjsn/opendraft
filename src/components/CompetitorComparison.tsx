import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Check, X, Minus } from "lucide-react";

const FEATURES = [
  { name: "Business-first audit", od: true, shipper: false, lovable: false, bolt: false },
  { name: "SaaS replacement engine", od: true, shipper: false, lovable: false, bolt: false },
  { name: "Own your code (no lock-in)", od: true, shipper: true, lovable: true, bolt: true },
  { name: "Zero per-seat fees", od: true, shipper: false, lovable: false, bolt: false },
  { name: "AI Advisor insights", od: true, shipper: true, lovable: false, bolt: false },
  { name: "One-click deploy", od: true, shipper: true, lovable: true, bolt: true },
  { name: "Custom integrations", od: true, shipper: "partial", lovable: "partial", bolt: "partial" },
  { name: "Enterprise-grade security", od: true, shipper: false, lovable: "partial", bolt: false },
  { name: "Marketplace ecosystem", od: true, shipper: false, lovable: false, bolt: false },
  { name: "No subscription required", od: true, shipper: false, lovable: false, bolt: false },
] as const;

type CellValue = boolean | "partial";

function FeatureCell({ value }: { value: CellValue }) {
  if (value === true) return <Check className="h-4 w-4 text-foreground mx-auto" />;
  if (value === "partial") return <Minus className="h-3.5 w-3.5 text-muted-foreground mx-auto" />;
  return <X className="h-3.5 w-3.5 text-muted-foreground/40 mx-auto" />;
}

export function CompetitorComparison() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <Badge variant="secondary" className="mb-4 text-xs font-medium">
            Why OpenDraft
          </Badge>
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-foreground">
            The only platform built for outcomes
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
            Other tools build apps. We replace your SaaS stack and give you software you own.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="max-w-3xl mx-auto overflow-x-auto"
        >
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 pr-4 text-muted-foreground font-medium w-[40%]">Feature</th>
                <th className="text-center py-3 px-2 min-w-[70px]">
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-bold text-foreground text-sm">OpenDraft</span>
                  </div>
                </th>
                <th className="text-center py-3 px-2 min-w-[70px]">
                  <span className="text-muted-foreground">Shipper</span>
                </th>
                <th className="text-center py-3 px-2 min-w-[70px]">
                  <span className="text-muted-foreground">Lovable</span>
                </th>
                <th className="text-center py-3 px-2 min-w-[70px]">
                  <span className="text-muted-foreground">Bolt</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f, i) => (
                <motion.tr
                  key={f.name}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.03 * i }}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-3 pr-4 text-foreground font-medium">{f.name}</td>
                  <td className="py-3 px-2 bg-accent/5">
                    <FeatureCell value={f.od} />
                  </td>
                  <td className="py-3 px-2">
                    <FeatureCell value={f.shipper} />
                  </td>
                  <td className="py-3 px-2">
                    <FeatureCell value={f.lovable} />
                  </td>
                  <td className="py-3 px-2">
                    <FeatureCell value={f.bolt} />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
              <div>
                <p className="text-xs font-semibold text-foreground">
                  They charge monthly. You pay once.
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Other platforms lock you into $25-300/mo subscriptions. OpenDraft gives you software you own — forever.
                </p>
              </div>
              <Badge className="bg-foreground text-background text-[10px] shrink-0">
                $0/mo after build
              </Badge>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
