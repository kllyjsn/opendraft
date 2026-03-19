import { motion } from "framer-motion";

/**
 * Cute mini gremlin agent with jetpack + AR visor that peeks from edges.
 * Scattered across the site for personality and delight.
 */

interface MiniAgentProps {
  x?: number;
  y?: number;
  color: string;
  scale?: number;
  flip?: boolean;
  hasJetpack?: boolean;
  hasVisor?: boolean;
  animDelay?: number;
  expression?: "happy" | "wink" | "curious";
}

function MiniAgent({
  x = 0, y = 0, color, scale = 1, flip = false,
  hasJetpack = true, hasVisor = true, animDelay = 0,
  expression = "happy",
}: MiniAgentProps) {
  const dir = flip ? -1 : 1;
  return (
    <motion.g
      transform={`translate(${x}, ${y}) scale(${scale * dir}, ${scale})`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animDelay, duration: 0.6, type: "spring" }}
    >
      {/* Jetpack */}
      {hasJetpack && (
        <>
          <rect x={-12} y={8} width={5} height={10} rx={2} fill="hsl(var(--muted))" opacity="0.5" />
          <rect x={7} y={8} width={5} height={10} rx={2} fill="hsl(var(--muted))" opacity="0.5" />
          <motion.path d="M-9.5,18 L-9.5,26 L-7,22Z" fill="hsl(25 95% 55%)" opacity="0.5"
            animate={{ opacity: [0.2, 0.7, 0.2], d: ["M-9.5,18 L-9.5,26 L-7,22Z", "M-9.5,18 L-10,24 L-6.5,21Z", "M-9.5,18 L-9.5,26 L-7,22Z"] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
          <motion.path d="M9.5,18 L9.5,26 L12,22Z" fill="hsl(40 95% 60%)" opacity="0.5"
            animate={{ opacity: [0.2, 0.7, 0.2] }}
            transition={{ duration: 0.5, repeat: Infinity, delay: 0.15 }}
          />
        </>
      )}

      {/* Body */}
      <ellipse cx={0} cy={16} rx={8} ry={7} fill={color} opacity="0.9" />

      {/* Head */}
      <circle cx={0} cy={2} r={9} fill={color} />

      {/* AR Visor */}
      {hasVisor && (
        <>
          <rect x={-8} y={-2} width={16} height={6} rx={3} fill="hsl(175 95% 50%)" opacity="0.15" />
          <rect x={-7} y={-1} width={14} height={4} rx={2} fill="hsl(175 95% 50%)" opacity="0.08" />
          <motion.rect x={-7} y={-1} width={14} height={4} rx={2} fill="hsl(175 95% 50%)" opacity="0"
            animate={{ opacity: [0, 0.12, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: animDelay }}
          />
          {/* Visor glint */}
          <motion.line x1={-5} y1={0} x2={5} y2={0} stroke="hsl(175 95% 80%)" strokeWidth="0.5" opacity="0"
            animate={{ opacity: [0, 0.4, 0], x1: [-5, 6], x2: [5, 12] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3, delay: animDelay + 1 }}
          />
        </>
      )}

      {/* Eyes (visible above/below visor) */}
      <ellipse cx={-3.5} cy={1} rx={2.5} ry={2.5} fill="white" opacity="0.95" />
      <ellipse cx={4} cy={1} rx={2.5} ry={2.5} fill="white" opacity="0.95" />
      
      {/* Pupils */}
      {expression === "wink" ? (
        <>
          <circle cx={-3} cy={1.5} r={1.5} fill="hsl(240 20% 10%)" />
          <path d="M2.5,1.5 Q4,3 5.5,1.5" stroke="hsl(240 20% 10%)" strokeWidth="1" fill="none" strokeLinecap="round" />
        </>
      ) : expression === "curious" ? (
        <>
          <motion.circle cx={-3} cy={1.5} r={1.5} fill="hsl(240 20% 10%)"
            animate={{ cx: [-3, -4.5, -3] }} transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.circle cx={4.5} cy={1.5} r={1.5} fill="hsl(240 20% 10%)"
            animate={{ cx: [4.5, 3, 4.5] }} transition={{ duration: 2, repeat: Infinity }}
          />
        </>
      ) : (
        <>
          <circle cx={-3} cy={1.5} r={1.5} fill="hsl(240 20% 10%)" />
          <circle cx={4.5} cy={1.5} r={1.5} fill="hsl(240 20% 10%)" />
        </>
      )}
      {/* Eye shine */}
      <circle cx={-2} cy={0.5} r={0.6} fill="white" opacity="0.9" />
      <circle cx={5.5} cy={0.5} r={0.6} fill="white" opacity="0.9" />

      {/* Mouth */}
      {expression === "happy" || expression === "wink" ? (
        <path d="M-2.5,5.5 Q0.5,8.5 3.5,5.5" stroke="hsl(240 20% 10%)" strokeWidth="1" fill="none" strokeLinecap="round" />
      ) : (
        <ellipse cx={0.5} cy={6.5} rx={2} ry={1.5} fill="hsl(240 20% 10%)" opacity="0.8" />
      )}

      {/* Cheeks */}
      <circle cx={-6} cy={3.5} r={1.5} fill="hsl(320 95% 60%)" opacity="0.15" />
      <circle cx={7} cy={3.5} r={1.5} fill="hsl(320 95% 60%)" opacity="0.15" />

      {/* Ears */}
      <path d="M-8,-1 L-14,-7 L-7,-3Z" fill={color} />
      <path d="M8,-1 L14,-7 L7,-3Z" fill={color} />
      <path d="M-8,-1 L-12,-5 L-7,-2.5Z" fill="hsl(320 95% 60%)" opacity="0.2" />
      <path d="M8,-1 L12,-5 L7,-2.5Z" fill="hsl(320 95% 60%)" opacity="0.2" />

      {/* Antenna */}
      <line x1={0} y1={-9} x2={0} y2={-13} stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <motion.circle cx={0} cy={-14} r={1.8} fill={color}
        animate={{ opacity: [0.4, 1, 0.4], r: [1.8, 2.4, 1.8] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: animDelay }}
      />
    </motion.g>
  );
}

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
      <svg viewBox="0 0 50 60" width="50" height="60" className="translate-x-[12px]">
        <MiniAgent x={20} y={22} color="hsl(265 90% 62%)" scale={0.7} hasJetpack={false} expression="curious" animDelay={delay} />
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
      <svg viewBox="0 0 50 60" width="50" height="60" className="-translate-x-[12px]">
        <MiniAgent x={30} y={22} color="hsl(320 95% 60%)" scale={0.7} flip hasJetpack={false} expression="wink" animDelay={delay} />
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
      <svg viewBox="0 0 60 40" width="60" height="40" className="translate-y-[10px]">
        <MiniAgent x={30} y={10} color="hsl(175 95% 50%)" scale={0.6} hasVisor expression="happy" animDelay={delay} />
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
        <svg viewBox="0 0 50 70" width="44" height="62">
          <MiniAgent x={25} y={24} color="hsl(265 90% 62%)" scale={0.65} hasJetpack hasVisor expression="happy" animDelay={delay} />
        </svg>
      </motion.div>
    </motion.div>
  );
}

/* ─── Row of tiny agents marching (for section dividers) ─── */
export function AgentParade({ className = "" }: { className?: string }) {
  const agents = [
    { color: "hsl(265 90% 62%)", delay: 0, expr: "happy" as const, visor: true, jetpack: false },
    { color: "hsl(320 95% 60%)", delay: 0.3, expr: "wink" as const, visor: false, jetpack: true },
    { color: "hsl(175 95% 50%)", delay: 0.6, expr: "curious" as const, visor: true, jetpack: false },
    { color: "hsl(40 95% 55%)", delay: 0.9, expr: "happy" as const, visor: true, jetpack: true },
  ];

  return (
    <motion.div
      className={`flex justify-center gap-2 pointer-events-none ${className}`}
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
          <svg viewBox="0 0 40 50" width="32" height="40">
            <MiniAgent
              x={20} y={16} color={a.color} scale={0.5}
              hasVisor={a.visor} hasJetpack={a.jetpack}
              expression={a.expr} animDelay={a.delay}
            />
          </svg>
        </motion.div>
      ))}
    </motion.div>
  );
}
