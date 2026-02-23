import { Zap, Clock, Wrench } from "lucide-react";

const items = [
  { icon: Zap, label: "Faster than building from scratch", value: "10×" },
  { icon: Clock, label: "To launch", value: "24 hrs" },
  { icon: Wrench, label: "Ongoing support included", value: "$20/mo" },
];

export function HeroStats() {
  return (
    <div className="flex items-center justify-center gap-5 md:gap-10 mt-12">
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-2.5 glass rounded-full px-4 py-2">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-lg md:text-xl font-black text-foreground">{value}</span>
          <span className="text-xs md:text-sm text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}
