import { motion } from "framer-motion";

/**
 * Enterprise geometric shapes — Pylon-inspired abstract accents.
 * Hidden on mobile to keep hero clean.
 */
export function HeroBeams() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
      {/* Top-left geometric cluster */}
      <motion.div
        className="absolute -top-8 -left-12 w-64 h-72"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="absolute top-12 left-8 w-44 h-52 bg-secondary/40 rounded-sm" />
        <div className="absolute top-0 left-24 w-32 h-40 border border-border rounded-sm" />
        <svg className="absolute bottom-0 left-0 w-28 h-28 text-border" viewBox="0 0 100 100" fill="none">
          <polygon points="0,100 100,100 50,0" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
      </motion.div>

      {/* Top-right geometric cluster */}
      <motion.div
        className="absolute -top-4 -right-8 w-56 h-56"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.2, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="absolute top-0 right-0 w-36 h-44 border border-border rounded-sm" />
        <div className="absolute top-8 right-12 w-28 h-36 border border-border rounded-sm" />
        <svg className="absolute top-4 right-4 w-32 h-32 text-border" viewBox="0 0 100 100" fill="none">
          <line x1="0" y1="100" x2="100" y2="0" stroke="currentColor" strokeWidth="1" />
        </svg>
      </motion.div>

      {/* Right-side accent — mint block */}
      <motion.div
        className="absolute top-1/3 -right-6 w-36 h-44 bg-accent/30 rounded-sm"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
    </div>
  );
}
