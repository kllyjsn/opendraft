import { motion } from "framer-motion";
import { SpaceGremlin } from "@/components/SpaceGremlin";

/**
 * Peeking gremlin agents that appear at section edges throughout the site.
 * Uses the same SpaceGremlin character from GremlinWorkshop for full consistency.
 */

/* ─── Peeking from the right edge ─── */
export function PeekRight({ className = "", delay = 0.5 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute right-0 overflow-hidden pointer-events-none ${className}`}
      initial={{ x: 30, opacity: 0 }}
      whileInView={{ x: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <svg viewBox="0 0 60 80" width="52" height="68" className="translate-x-[14px]">
        <SpaceGremlin x={22} y={28} color="hsl(265 90% 62%)" scale={0.65}
          expression="curious" animDelay={delay} hasHelmet />
      </svg>
    </motion.div>
  );
}

/* ─── Peeking from the left edge ─── */
export function PeekLeft({ className = "", delay = 0.8 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute left-0 overflow-hidden pointer-events-none ${className}`}
      initial={{ x: -30, opacity: 0 }}
      whileInView={{ x: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <svg viewBox="0 0 60 80" width="52" height="68" className="-translate-x-[14px]">
        <SpaceGremlin x={38} y={28} color="hsl(320 95% 60%)" scale={0.65}
          expression="wink" animDelay={delay} />
      </svg>
    </motion.div>
  );
}

/* ─── Peeking from the bottom ─── */
export function PeekBottom({ className = "", delay = 0.6 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`overflow-hidden pointer-events-none ${className}`}
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <svg viewBox="0 0 70 50" width="62" height="44" className="translate-y-[10px]">
        <SpaceGremlin x={35} y={12} color="hsl(175 95% 50%)" scale={0.55}
          expression="happy" animDelay={delay} hasHelmet />
      </svg>
    </motion.div>
  );
}

/* ─── Jetpack agent floating in a corner ─── */
export function FloatingAgent({ className = "", delay = 1 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`pointer-events-none ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay, duration: 0.8, type: "spring" }}
    >
      <motion.div
        animate={{ y: [-4, 4, -4] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 60 90" width="48" height="72">
          <SpaceGremlin x={30} y={28} color="hsl(265 90% 62%)" scale={0.6}
            expression="excited" animDelay={delay} hasJetpack hasHelmet />
        </svg>
      </motion.div>
    </motion.div>
  );
}

/* ─── Row of tiny agents marching (section divider) ─── */
export function AgentParade({ className = "" }: { className?: string }) {
  const agents = [
    { color: "hsl(265 90% 62%)", delay: 0, expr: "happy" as const, helmet: true, jetpack: false },
    { color: "hsl(320 95% 60%)", delay: 0.3, expr: "wink" as const, helmet: false, jetpack: true },
    { color: "hsl(175 95% 50%)", delay: 0.6, expr: "curious" as const, helmet: true, jetpack: false },
    { color: "hsl(40 95% 55%)", delay: 0.9, expr: "excited" as const, helmet: true, jetpack: true },
  ];

  return (
    <motion.div
      className={`flex justify-center gap-1 pointer-events-none ${className}`}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {agents.map((a, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: a.delay, ease: "easeInOut" }}
        >
          <svg viewBox="0 0 50 70" width="36" height="50">
            <SpaceGremlin
              x={25} y={22} color={a.color} scale={0.45}
              hasHelmet={a.helmet} hasJetpack={a.jetpack}
              expression={a.expr} animDelay={a.delay}
            />
          </svg>
        </motion.div>
      ))}
    </motion.div>
  );
}
