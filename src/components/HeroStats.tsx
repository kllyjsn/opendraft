import { Zap, Clock, Gavel } from "lucide-react";

const items = [
  { icon: Zap, label: "Faster than building from scratch", value: "10×" },
  { icon: Clock, label: "Launch instantly & make it yours", value: "Day 1" },
  { icon: Gavel, label: "Name your price on any project", value: "Bid" },
];

export function HeroStats() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 md:gap-10 mt-12">
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-2.5 glass rounded-full px-4 py-2 w-full sm:w-auto justify-center">
          <Icon className="h-4 w-4 text-primary shrink-0" />
          <span className="text-lg md:text-xl font-black text-foreground">{value}</span>
          <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">{label}</span>
        </div>
      ))}
    </div>
  );
}
