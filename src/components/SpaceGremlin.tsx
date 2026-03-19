import { motion } from "framer-motion";

/**
 * Shared SpaceGremlin character used across the site.
 * Single source of truth for the gremlin art style —
 * jetpacks, AR visors, expressive faces, pointy ears, antenna.
 */
export interface SpaceGremlinProps {
  x: number;
  y: number;
  color: string;
  scale?: number;
  expression?: "happy" | "focused" | "excited" | "mischief" | "wink" | "curious";
  task?: string;
  animDelay?: number;
  hasHelmet?: boolean;
  hasJetpack?: boolean;
  /** Whether to animate entrance (spring pop-in). Default true. */
  animateEntrance?: boolean;
}

export function SpaceGremlin({
  x, y, color, scale = 1,
  expression = "happy", task, animDelay = 0,
  hasHelmet = false, hasJetpack = false,
  animateEntrance = true,
}: SpaceGremlinProps) {
  const bobAnim = expression === "excited"
    ? { y: [0, -6, 0], rotate: [0, 4, -4, 0] }
    : hasJetpack ? { y: [0, -8, -2, -6, 0] } : { y: [0, -3, 0] };
  const bobDuration = expression === "excited" ? 1.6 : hasJetpack ? 3 : 2.5;

  return (
    <motion.g
      initial={animateEntrance ? { opacity: 0, scale: 0 } : undefined}
      animate={{ opacity: 1, scale: 1 }}
      transition={animateEntrance ? { delay: animDelay + 0.5, type: "spring", damping: 12 } : undefined}
    >
      <motion.g
        style={{ transformOrigin: `${x}px ${y}px` }}
        animate={bobAnim}
        transition={{ duration: bobDuration, repeat: Infinity, ease: "easeInOut", delay: animDelay }}
      >
        <g transform={`translate(${x}, ${y}) scale(${scale})`}>
          {/* ─ Jetpack flames ─ */}
          {hasJetpack && (
            <>
              <rect x={-14} y={10} width={6} height={12} rx={2} fill="hsl(var(--muted))" opacity="0.4" />
              <rect x={8} y={10} width={6} height={12} rx={2} fill="hsl(var(--muted))" opacity="0.4" />
              <motion.path d="M-11,22 L-11,32 L-8,28Z" fill="hsl(25 95% 55%)" opacity="0.6"
                animate={{ d: ["M-11,22 L-11,35 L-8,28Z", "M-11,22 L-12,30 L-7,26Z", "M-11,22 L-11,35 L-8,28Z"], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 0.4, repeat: Infinity }}
              />
              <motion.path d="M11,22 L11,32 L14,28Z" fill="hsl(40 95% 60%)" opacity="0.6"
                animate={{ d: ["M11,22 L11,35 L14,28Z", "M11,22 L12,30 L15,26Z", "M11,22 L11,35 L14,28Z"], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 0.4, repeat: Infinity, delay: 0.2 }}
              />
            </>
          )}

          {/* ─ Body ─ */}
          <ellipse cx="0" cy="20" rx="10" ry="8" fill={color} opacity="0.9" />
          <ellipse cx="-3" cy="17" rx="4" ry="3" fill="white" opacity="0.08" />

          {/* ─ Arms ─ */}
          <motion.line x1="-9" y1="16" x2="-15" y2="10"
            stroke={color} strokeWidth="3" strokeLinecap="round"
            animate={expression === "focused" ? { x2: [-15, -13, -15] } : { x2: [-15, -17, -15], y2: [10, 7, 10] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: animDelay }}
          />
          <motion.line x1="9" y1="16" x2="15" y2="10"
            stroke={color} strokeWidth="3" strokeLinecap="round"
            animate={expression === "focused" ? { x2: [15, 17, 15], y2: [10, 8, 10] } : { x2: [15, 13, 15] }}
            transition={{ duration: 1, repeat: Infinity, delay: animDelay + 0.3 }}
          />

          {/* ─ Legs & Boots ─ */}
          <line x1="-4" y1="27" x2="-6" y2="34" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="4" y1="27" x2="6" y2="34" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <ellipse cx="-7" cy="35" rx="4.5" ry="2.5" fill={color} opacity="0.7" />
          <ellipse cx="7" cy="35" rx="4.5" ry="2.5" fill={color} opacity="0.7" />
          <ellipse cx="-7" cy="35" rx="4.5" ry="1" fill="white" opacity="0.1" />
          <ellipse cx="7" cy="35" rx="4.5" ry="1" fill="white" opacity="0.1" />

          {/* ─ Head ─ */}
          <circle cx="0" cy="4" r="11" fill={color} />

          {/* ─ Helmet/visor ─ */}
          {hasHelmet && (
            <>
              <circle cx="0" cy="4" r="13" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.3" />
              <path d="M-10,1 Q-12,-10 0,-13 Q12,-10 10,1" fill="hsl(175 95% 50%)" opacity="0.06" />
              <motion.path d="M-10,1 Q-12,-10 0,-13 Q12,-10 10,1" fill="hsl(175 95% 50%)" opacity="0"
                animate={{ opacity: [0, 0.1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </>
          )}

          {/* ─ Ears ─ */}
          <motion.path d="M-10,0 L-18,-8 L-9,-4Z" fill={color}
            animate={{ d: ["M-10,0 L-18,-8 L-9,-4Z", "M-10,0 L-19,-10 L-9,-4Z", "M-10,0 L-18,-8 L-9,-4Z"] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.path d="M10,0 L18,-8 L9,-4Z" fill={color}
            animate={{ d: ["M10,0 L18,-8 L9,-4Z", "M10,0 L19,-10 L9,-4Z", "M10,0 L18,-8 L9,-4Z"] }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
          />
          <path d="M-10,-1 L-15,-6 L-9,-3Z" fill="hsl(320 95% 60%)" opacity="0.2" />
          <path d="M10,-1 L15,-6 L9,-3Z" fill="hsl(320 95% 60%)" opacity="0.2" />

          {/* ─ Face ─ */}
          {/* Eye whites */}
          <ellipse cx="-4" cy="2" rx="3.5" ry="3.2" fill="white" opacity="0.95" />
          <ellipse cx="5" cy="2" rx="3.5" ry="3.2" fill="white" opacity="0.95" />

          {/* Pupils — expression-driven */}
          {expression === "wink" ? (
            <>
              <motion.circle cx="-3.5" cy="2.5" r="2" fill="hsl(240 20% 10%)"
                animate={{ cy: [2.5, 3, 2.5] }} transition={{ duration: 2.5, repeat: Infinity }}
              />
              <path d="M3,2.5 Q5,4.5 7,2.5" stroke="hsl(240 20% 10%)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            </>
          ) : expression === "curious" ? (
            <>
              <motion.circle cx="-3.5" cy="2.5" r="2" fill="hsl(240 20% 10%)"
                animate={{ cx: [-3.5, -5, -3.5] }} transition={{ duration: 2.5, repeat: Infinity }}
              />
              <motion.circle cx="5.5" cy="2.5" r="2" fill="hsl(240 20% 10%)"
                animate={{ cx: [5.5, 4, 5.5] }} transition={{ duration: 2.5, repeat: Infinity }}
              />
            </>
          ) : (
            <>
              <motion.circle cx="-3.5" cy="2.5" r="2" fill="hsl(240 20% 10%)"
                animate={expression === "focused" ? { cx: [-3, -5, -3] } : { cy: [2.5, 3, 2.5] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
              <motion.circle cx="5.5" cy="2.5" r="2" fill="hsl(240 20% 10%)"
                animate={expression === "focused" ? { cx: [6, 4, 6] } : { cy: [2.5, 3, 2.5] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
            </>
          )}
          {/* Iris ring */}
          <circle cx="-3.5" cy="2.5" r="2" fill="none" stroke={color} strokeWidth="0.4" opacity="0.5" />
          <circle cx="5.5" cy="2.5" r="2" fill="none" stroke={color} strokeWidth="0.4" opacity="0.5" />
          {/* Eye shine */}
          <circle cx="-2.5" cy="1.5" r="0.8" fill="white" opacity="0.9" />
          <circle cx="6.5" cy="1.5" r="0.8" fill="white" opacity="0.9" />
          <circle cx="-4" cy="3.5" r="0.4" fill="white" opacity="0.5" />
          <circle cx="5" cy="3.5" r="0.4" fill="white" opacity="0.5" />

          {/* Mouth */}
          {expression === "excited" ? (
            <>
              <ellipse cx="0.5" cy="8.5" rx="4" ry="3" fill="hsl(240 20% 8%)" />
              <ellipse cx="0.5" cy="7.5" rx="3" ry="1.5" fill="white" opacity="0.15" />
            </>
          ) : expression === "mischief" ? (
            <path d="M-4,7 Q0,12 5,7" stroke="hsl(240 20% 10%)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          ) : expression === "focused" ? (
            <>
              <path d="M-2,8 L3,8" stroke="hsl(240 20% 10%)" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="-7" y1="-2" x2="-1" y2="-1" stroke="hsl(240 20% 10%)" strokeWidth="0.8" opacity="0.5" />
              <line x1="2" y1="-1" x2="8" y2="-2" stroke="hsl(240 20% 10%)" strokeWidth="0.8" opacity="0.5" />
            </>
          ) : expression === "curious" ? (
            <ellipse cx="0.5" cy="8" rx="2.5" ry="2" fill="hsl(240 20% 8%)" opacity="0.8" />
          ) : expression === "wink" ? (
            <path d="M-3,7 Q0.5,11 4,7" stroke="hsl(240 20% 10%)" strokeWidth="1.3" fill="none" strokeLinecap="round" />
          ) : (
            <path d="M-3,7 Q0.5,11 4,7" stroke="hsl(240 20% 10%)" strokeWidth="1.3" fill="none" strokeLinecap="round" />
          )}

          {/* Cheek blush */}
          <circle cx="-7" cy="5" r="2" fill="hsl(320 95% 60%)" opacity="0.15" />
          <circle cx="8" cy="5" r="2" fill="hsl(320 95% 60%)" opacity="0.15" />

          {/* ─ Antenna with glow ─ */}
          <line x1="0" y1="-11" x2="0" y2="-16" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
          <motion.circle cx="0" cy="-17" r="2" fill={color}
            animate={{ opacity: [0.4, 1, 0.4], r: [2, 2.8, 2] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: animDelay * 0.7 }}
          />
          <motion.circle cx="0" cy="-17" r="5" fill={color} opacity="0"
            animate={{ opacity: [0, 0.1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: animDelay * 0.7 }}
          />
        </g>
      </motion.g>

      {/* Task label */}
      {task && (
        <motion.text x={x} y={y + 48 * scale} textAnchor="middle"
          fontSize="7" fontWeight="800" letterSpacing="0.2em"
          fill={color} opacity="0.7" className="uppercase font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: animDelay + 1 }}
        >{task}</motion.text>
      )}
    </motion.g>
  );
}
