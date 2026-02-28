import { Shield, Code, HeartHandshake } from "lucide-react";

const badges = [
  { icon: Code, text: "You own the code — no lock-in" },
  { icon: Shield, text: "AI-built, human-maintained" },
  { icon: HeartHandshake, text: "Optional maintenance subscriptions" },
];

export function SocialProof() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6 text-[11px] md:text-xs text-muted-foreground">
      {badges.map(({ icon: Icon, text }) => (
        <span key={text} className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-primary/70" />
          {text}
        </span>
      ))}
    </div>
  );
}
