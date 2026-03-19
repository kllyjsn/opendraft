import { motion } from "framer-motion";

/**
 * Confident Gravity — minimal atmospheric field.
 * A single warm glow resolving into place with geological patience.
 */
export function HeroBeams() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Single authoritative glow — like a spotlight on a stage */}
      <motion.div
        className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="absolute inset-0 rounded-full bg-primary/[0.04] blur-[160px]" />
      </motion.div>

      {/* Subtle vertical beam — spine of the page */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-primary/[0.06] to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 3, delay: 0.5 }}
      />

      {/* Top fade */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent" />
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
