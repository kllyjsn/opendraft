import { motion } from "framer-motion";

/**
 * Kanso Voltage — atmospheric field.
 * A restrained vermillion glow and structural hairlines
 * creating charged negative space.
 */
export function HeroBeams() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Primary glow — warm vermillion shifted from center, like a distant lantern */}
      <motion.div
        className="absolute top-[25%] left-[40%] -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px]"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 3, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className="absolute inset-0 rounded-full blur-[180px]"
          style={{ background: "radial-gradient(ellipse, hsl(8 70% 45% / 0.04), transparent 70%)" }}
        />
      </motion.div>

      {/* Secondary cooler glow — counterbalance */}
      <motion.div
        className="absolute top-[60%] right-[15%] w-[500px] h-[300px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 3.5, delay: 0.3 }}
      >
        <div
          className="absolute inset-0 rounded-full blur-[160px]"
          style={{ background: "radial-gradient(ellipse, hsl(265 40% 50% / 0.025), transparent 70%)" }}
        />
      </motion.div>

      {/* Vertical spine — hairline conducting energy */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full"
        style={{
          background: "linear-gradient(to bottom, transparent 5%, hsl(8 60% 50% / 0.06) 30%, hsl(265 50% 60% / 0.04) 70%, transparent 95%)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.5, delay: 0.8 }}
      />

      {/* Horizontal rule — ma divider at golden section */}
      <motion.div
        className="absolute top-[62%] left-0 right-0 h-px"
        style={{
          background: "linear-gradient(to right, transparent, hsl(0 0% 100% / 0.03) 20%, hsl(8 60% 50% / 0.06) 35%, hsl(0 0% 100% / 0.03) 50%, transparent 80%)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 1.2 }}
      />

      {/* Top fade */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent" />
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
