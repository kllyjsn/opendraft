import { motion } from "framer-motion";

/**
 * Tiny themed gremlins for each lifestyle category.
 * Each has a unique prop/costume and idle animation.
 */

const SIZE = 48;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = SIZE * 0.32;

/** Shared eye component */
function Eyes({ pupilShiftX = 0, pupilShiftY = 0 }: { pupilShiftX?: number; pupilShiftY?: number }) {
  const lx = CX - R * 0.3;
  const rx = CX + R * 0.3;
  const ey = CY - R * 0.15;
  return (
    <>
      <ellipse cx={lx} cy={ey} rx={R * 0.2} ry={R * 0.24} fill="white" />
      <circle cx={lx + pupilShiftX} cy={ey + pupilShiftY} r={R * 0.1} fill="#1a1a2e" />
      <circle cx={lx + pupilShiftX + R * 0.03} cy={ey + pupilShiftY - R * 0.05} r={R * 0.035} fill="white" />
      <ellipse cx={rx} cy={ey} rx={R * 0.2} ry={R * 0.24} fill="white" />
      <circle cx={rx + pupilShiftX} cy={ey + pupilShiftY} r={R * 0.1} fill="#1a1a2e" />
      <circle cx={rx + pupilShiftX + R * 0.03} cy={ey + pupilShiftY - R * 0.05} r={R * 0.035} fill="white" />
    </>
  );
}

function BaseBody({ color = "hsl(265 85% 58%)" }: { color?: string }) {
  return (
    <>
      <ellipse cx={CX} cy={SIZE * 0.9} rx={R * 0.5} ry={SIZE * 0.03} fill="black" opacity={0.08} />
      <circle cx={CX} cy={CY} r={R} fill={color} />
      <ellipse cx={CX} cy={CY + R * 0.12} rx={R * 0.5} ry={R * 0.45} fill="hsl(265 85% 72%)" opacity={0.4} />
      {/* Ears */}
      <ellipse cx={CX - R * 0.55} cy={CY - R * 0.7} rx={R * 0.18} ry={R * 0.3} fill={color} transform={`rotate(-15 ${CX - R * 0.55} ${CY - R * 0.7})`} />
      <ellipse cx={CX + R * 0.55} cy={CY - R * 0.7} rx={R * 0.18} ry={R * 0.3} fill={color} transform={`rotate(15 ${CX + R * 0.55} ${CY - R * 0.7})`} />
      {/* Ear inner */}
      <ellipse cx={CX - R * 0.55} cy={CY - R * 0.7} rx={R * 0.09} ry={R * 0.18} fill="hsl(330 90% 60%)" opacity={0.5} transform={`rotate(-15 ${CX - R * 0.55} ${CY - R * 0.7})`} />
      <ellipse cx={CX + R * 0.55} cy={CY - R * 0.7} rx={R * 0.09} ry={R * 0.18} fill="hsl(330 90% 60%)" opacity={0.5} transform={`rotate(15 ${CX + R * 0.55} ${CY - R * 0.7})`} />
      {/* Antenna */}
      <line x1={CX} y1={CY - R * 0.95} x2={CX} y2={CY - R * 0.7} stroke="hsl(185 90% 45%)" strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={CX} cy={CY - R * 1.02} r={R * 0.07} fill="hsl(185 90% 45%)" />
      {/* Cheeks */}
      <circle cx={CX - R * 0.45} cy={CY + R * 0.08} r={R * 0.08} fill="hsl(330 90% 60%)" opacity={0.3} />
      <circle cx={CX + R * 0.45} cy={CY + R * 0.08} r={R * 0.08} fill="hsl(330 90% 60%)" opacity={0.3} />
      {/* Smile */}
      <path
        d={`M${CX - R * 0.15} ${CY + R * 0.2} Q${CX} ${CY + R * 0.4} ${CX + R * 0.15} ${CY + R * 0.2}`}
        stroke="#1a1a2e" strokeWidth={1} strokeLinecap="round" fill="none"
      />
      {/* Feet */}
      <ellipse cx={CX - R * 0.25} cy={CY + R * 0.82} rx={R * 0.14} ry={R * 0.08} fill="hsl(265 70% 48%)" />
      <ellipse cx={CX + R * 0.25} cy={CY + R * 0.82} rx={R * 0.14} ry={R * 0.08} fill="hsl(265 70% 48%)" />
    </>
  );
}

/** 🍳 Chef gremlin — stirs a tiny spoon */
export function ChefGremlin({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={`inline-flex ${className}`}
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} fill="none">
        <BaseBody />
        <Eyes pupilShiftY={1} />
        {/* Chef hat */}
        <ellipse cx={CX} cy={CY - R * 0.85} rx={R * 0.45} ry={R * 0.2} fill="white" />
        <rect x={CX - R * 0.35} y={CY - R * 1.3} width={R * 0.7} height={R * 0.5} rx={R * 0.15} fill="white" />
        {/* Spoon — stirring */}
        <motion.g
          style={{ originX: `${CX + R * 0.7}px`, originY: `${CY + R * 0.1}px` }}
          animate={{ rotate: [-20, 20, -20] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <line x1={CX + R * 0.7} y1={CY - R * 0.3} x2={CX + R * 0.9} y2={CY + R * 0.4} stroke="hsl(30 30% 50%)" strokeWidth={1.5} strokeLinecap="round" />
          <ellipse cx={CX + R * 0.92} cy={CY + R * 0.5} rx={R * 0.1} ry={R * 0.06} fill="hsl(30 30% 50%)" />
        </motion.g>
      </svg>
    </motion.div>
  );
}

/** 💪 Fitness gremlin — does tiny reps with a dumbbell */
export function FitnessGremlin({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={`inline-flex ${className}`}
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} fill="none">
        <BaseBody />
        <Eyes pupilShiftX={-1} />
        {/* Headband */}
        <path
          d={`M${CX - R * 0.6} ${CY - R * 0.45} Q${CX} ${CY - R * 0.6} ${CX + R * 0.6} ${CY - R * 0.45}`}
          stroke="hsl(330 90% 60%)" strokeWidth={2} strokeLinecap="round" fill="none"
        />
        {/* Dumbbell arm — pumping */}
        <motion.g
          style={{ originX: `${CX - R * 0.7}px`, originY: `${CY}px` }}
          animate={{ rotate: [0, -35, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Arm */}
          <line x1={CX - R * 0.65} y1={CY} x2={CX - R * 0.9} y2={CY - R * 0.5} stroke="hsl(265 85% 58%)" strokeWidth={3} strokeLinecap="round" />
          {/* Dumbbell */}
          <line x1={CX - R * 1.1} y1={CY - R * 0.5} x2={CX - R * 0.7} y2={CY - R * 0.5} stroke="hsl(0 0% 40%)" strokeWidth={2} strokeLinecap="round" />
          <rect x={CX - R * 1.15} y={CY - R * 0.62} width={R * 0.12} height={R * 0.24} rx={1} fill="hsl(0 0% 40%)" />
          <rect x={CX - R * 0.67} y={CY - R * 0.62} width={R * 0.12} height={R * 0.24} rx={1} fill="hsl(0 0% 40%)" />
        </motion.g>
        {/* Sweat drop */}
        <motion.circle
          cx={CX + R * 0.55} cy={CY - R * 0.3}
          r={1.2}
          fill="hsl(185 90% 65%)"
          animate={{ opacity: [0, 0.7, 0], y: [0, 5] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
        />
      </svg>
    </motion.div>
  );
}

/** 💰 Finance gremlin — coin flips above head */
export function FinanceGremlin({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={`inline-flex ${className}`}
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} fill="none">
        <BaseBody />
        <Eyes pupilShiftY={-1} />
        {/* Tiny glasses */}
        <circle cx={CX - R * 0.3} cy={CY - R * 0.15} r={R * 0.22} stroke="hsl(45 90% 55%)" strokeWidth={1} fill="none" />
        <circle cx={CX + R * 0.3} cy={CY - R * 0.15} r={R * 0.22} stroke="hsl(45 90% 55%)" strokeWidth={1} fill="none" />
        <line x1={CX - R * 0.08} y1={CY - R * 0.15} x2={CX + R * 0.08} y2={CY - R * 0.15} stroke="hsl(45 90% 55%)" strokeWidth={0.8} />
        {/* Flipping coin */}
        <motion.g
          animate={{ y: [0, -8, 0], rotateY: [0, 360, 720] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
        >
          <circle cx={CX} cy={CY - R * 1.4} r={R * 0.18} fill="hsl(45 90% 55%)" />
          <text x={CX} y={CY - R * 1.33} textAnchor="middle" fontSize={R * 0.18} fill="hsl(45 60% 35%)" fontWeight="bold">$</text>
        </motion.g>
        {/* Chart line behind */}
        <motion.path
          d={`M${CX + R * 0.5} ${CY + R * 0.3} l3 -3 l3 1 l3 -5 l2 -2`}
          stroke="hsl(140 70% 50%)" strokeWidth={1} strokeLinecap="round" fill="none" opacity={0.6}
          animate={{ pathLength: [0, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        />
      </svg>
    </motion.div>
  );
}

/** ⚡ Productivity gremlin — types on tiny laptop */
export function ProductivityGremlin({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={`inline-flex ${className}`}
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} fill="none">
        <BaseBody />
        <Eyes pupilShiftY={2} />
        {/* Tiny laptop in front */}
        <rect x={CX - R * 0.5} y={CY + R * 0.35} width={R * 1} height={R * 0.5} rx={1.5} fill="hsl(240 10% 25%)" />
        {/* Screen glow */}
        <rect x={CX - R * 0.42} y={CY + R * 0.4} width={R * 0.84} height={R * 0.3} rx={1} fill="hsl(185 90% 45%)" opacity={0.3} />
        {/* Typing animation — arms moving */}
        <motion.g
          animate={{ y: [0, 1, 0, 1, 0] }}
          transition={{ duration: 0.4, repeat: Infinity, ease: "linear" }}
        >
          <ellipse cx={CX - R * 0.35} cy={CY + R * 0.38} rx={R * 0.08} ry={R * 0.06} fill="hsl(265 85% 58%)" />
        </motion.g>
        <motion.g
          animate={{ y: [0, 1, 0, 1, 0] }}
          transition={{ duration: 0.4, repeat: Infinity, ease: "linear", delay: 0.15 }}
        >
          <ellipse cx={CX + R * 0.35} cy={CY + R * 0.38} rx={R * 0.08} ry={R * 0.06} fill="hsl(265 85% 58%)" />
        </motion.g>
        {/* Flying sparkle — code shipping */}
        <motion.g
          animate={{ opacity: [0, 1, 0], y: [0, -6], x: [0, 3] }}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.5 }}
        >
          <text x={CX + R * 0.6} y={CY - R * 0.3} fontSize={6} fill="hsl(185 90% 45%)">⚡</text>
        </motion.g>
      </svg>
    </motion.div>
  );
}

/** 🤖 Agent gremlin — orbiting data nodes */
export function AgentGremlin({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={`inline-flex ${className}`}
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} fill="none">
        <BaseBody />
        <Eyes pupilShiftX={0} pupilShiftY={-1} />
        {/* Visor / dark glasses */}
        <rect x={CX - R * 0.55} y={CY - R * 0.3} width={R * 1.1} height={R * 0.28} rx={R * 0.1} fill="hsl(240 20% 15%)" opacity={0.85} />
        <rect x={CX - R * 0.5} y={CY - R * 0.26} width={R * 1.0} height={R * 0.04} fill="hsl(185 90% 45%)" opacity={0.6} />
        {/* Orbiting data node 1 */}
        <motion.g
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          style={{ originX: `${CX}px`, originY: `${CY}px` }}
        >
          <circle cx={CX + R * 0.9} cy={CY - R * 0.4} r={R * 0.1} fill="hsl(185 90% 45%)" />
          <circle cx={CX + R * 0.9} cy={CY - R * 0.4} r={R * 0.16} stroke="hsl(185 90% 45%)" strokeWidth={0.5} fill="none" opacity={0.4} />
        </motion.g>
        {/* Orbiting data node 2 */}
        <motion.g
          animate={{ rotate: [180, 540] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          style={{ originX: `${CX}px`, originY: `${CY}px` }}
        >
          <circle cx={CX - R * 0.8} cy={CY + R * 0.3} r={R * 0.08} fill="hsl(265 85% 72%)" />
        </motion.g>
        {/* Signal pulse from antenna */}
        <motion.circle
          cx={CX} cy={CY - R * 1.02}
          r={R * 0.12}
          stroke="hsl(185 90% 45%)" strokeWidth={0.8} fill="none"
          animate={{ r: [R * 0.07, R * 0.3], opacity: [0.8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
        />
      </svg>
    </motion.div>
  );
}

/** Map slug → component */
export const CATEGORY_GREMLINS: Record<string, React.FC<{ className?: string }>> = {
  "home-kitchen": ChefGremlin,
  "health-fitness": FitnessGremlin,
  "personal-finance": FinanceGremlin,
  productivity: ProductivityGremlin,
  "built-for-agents": AgentGremlin,
};
