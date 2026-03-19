import { motion } from "framer-motion";

/**
 * Vercel-inspired geometric beam / gradient mesh background for the hero.
 * Creates an ethereal, high-end visual field with converging light beams and a radial glow.
 */
export function HeroBeams() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Central radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px]">
        <div className="absolute inset-0 rounded-full bg-primary/[0.04] blur-[120px]" />
        <div className="absolute top-1/4 left-1/3 w-[400px] h-[300px] rounded-full bg-accent/[0.03] blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[250px] rounded-full bg-secondary/[0.02] blur-[80px]" />
      </div>

      {/* Converging beams */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="beam1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(265 90% 62%)" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(265 90% 62%)" stopOpacity="0.06" />
            <stop offset="100%" stopColor="hsl(265 90% 62%)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="beam2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(175 95% 50%)" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(175 95% 50%)" stopOpacity="0.04" />
            <stop offset="100%" stopColor="hsl(175 95% 50%)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="beam3" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(320 95% 60%)" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(320 95% 60%)" stopOpacity="0.03" />
            <stop offset="100%" stopColor="hsl(320 95% 60%)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Diagonal beams converging to center */}
        <motion.line
          x1="0%" y1="0%" x2="100%" y2="100%"
          stroke="url(#beam1)" strokeWidth="120"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.3 }}
        />
        <motion.line
          x1="100%" y1="0%" x2="0%" y2="100%"
          stroke="url(#beam2)" strokeWidth="80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.6 }}
        />
        <motion.line
          x1="50%" y1="0%" x2="50%" y2="100%"
          stroke="url(#beam3)" strokeWidth="200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.9 }}
        />
      </svg>

      {/* Dot grid — very subtle */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(hsl(var(--foreground)) 0.5px, transparent 0.5px)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Top edge fade */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent" />
      {/* Bottom edge fade */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
