import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useState, useMemo } from "react";

/* ═══════════════════════════════════════════════════
   GREMLIN WORKSHOP — Immersive animated scene
   Inspired by: blueprint orchestras + pixel potion labs
   ═══════════════════════════════════════════════════ */

// ── Utility: seeded pseudo-random for deterministic layouts ──
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Floating code symbols that drift upward ──
function FloatingSymbol({ symbol, x, delay, duration, color }: {
  symbol: string; x: number; delay: number; duration: number; color: string;
}) {
  return (
    <motion.span
      className="absolute text-xs font-mono select-none pointer-events-none"
      style={{ left: `${x}%`, bottom: "10%", color, textShadow: `0 0 8px ${color}` }}
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: [0, 0.7, 0.7, 0], y: [0, -60, -120, -180] }}
      transition={{ delay, duration, repeat: Infinity, repeatDelay: duration * 0.3, ease: "easeOut" }}
    >
      {symbol}
    </motion.span>
  );
}

// ── Spark / ember particles rising from the forge ──
function Ember({ x, delay, color, size = 3 }: { x: number; delay: number; color: string; size?: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size, height: size, left: `${x}%`, bottom: "5%",
        background: color, boxShadow: `0 0 ${size * 2}px ${color}`,
      }}
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0, 1, 0.8, 0],
        y: [0, -40, -100, -160],
        x: [(Math.sin(delay * 3) * 20), (Math.cos(delay * 5) * 15)],
      }}
      transition={{ delay, duration: 2.5 + delay * 0.3, repeat: Infinity, repeatDelay: 1.5, ease: "easeOut" }}
    />
  );
}

// ── Potion jar on a shelf ──
function PotionJar({ x, y, liquidColor, size = 28, delay = 0 }: {
  x: number; y: number; liquidColor: string; size?: number; delay?: number;
}) {
  return (
    <motion.g
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
    >
      {/* Jar body */}
      <rect x={x} y={y + 6} width={size * 0.65} height={size * 0.6} rx={3} fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.6" />
      {/* Jar neck */}
      <rect x={x + size * 0.18} y={y} width={size * 0.3} height={size * 0.25} rx={1.5} fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.6" />
      {/* Cork */}
      <rect x={x + size * 0.15} y={y - 2} width={size * 0.35} height={4} rx={2} fill="hsl(30 40% 35%)" />
      {/* Liquid */}
      <motion.rect
        x={x + 2} y={y + size * 0.35} width={size * 0.65 - 4} height={size * 0.3}
        rx={2} fill={liquidColor} opacity="0.6"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 2 + delay, repeat: Infinity }}
      />
      {/* Glow */}
      <motion.circle
        cx={x + size * 0.32} cy={y + size * 0.5} r={size * 0.2}
        fill={liquidColor} opacity="0"
        animate={{ opacity: [0, 0.15, 0] }}
        transition={{ duration: 3, delay: delay + 1, repeat: Infinity }}
      />
    </motion.g>
  );
}

// ── Hanging tool from the ceiling ──
function HangingTool({ x, y, type }: { x: number; y: number; type: "wrench" | "gear" | "hammer" }) {
  const paths: Record<string, string> = {
    wrench: "M0,0 L0,12 L3,15 L6,12 L6,0 L4,0 L4,10 L2,10 L2,0Z",
    gear: "M5,0 L7,2 L10,1 L10,4 L12,6 L10,8 L10,11 L7,10 L5,12 L3,10 L0,11 L0,8 L-2,6 L0,4 L0,1 L3,2Z",
    hammer: "M2,0 L2,10 L0,10 L0,14 L8,14 L8,10 L4,10 L4,0Z",
  };
  return (
    <motion.g
      animate={{ rotate: [0, 2, -2, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      style={{ transformOrigin: `${x + 4}px ${y}px` }}
    >
      {/* String */}
      <line x1={x + 4} y1={y - 15} x2={x + 4} y2={y} stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" opacity="0.4" />
      <g transform={`translate(${x},${y}) scale(0.7)`}>
        <path d={paths[type]} fill="hsl(var(--muted-foreground))" opacity="0.35" />
      </g>
    </motion.g>
  );
}

// ── SVG Gremlin character — detailed version ──
function DetailedGremlin({ x, y, color, scale = 1, expression = "happy", task, animDelay = 0 }: {
  x: number; y: number; color: string; scale?: number;
  expression?: "happy" | "focused" | "excited" | "mischief";
  task?: string; animDelay?: number;
}) {
  const bobAnim = expression === "excited"
    ? { y: [y, y - 5, y], rotate: [0, 3, -3, 0] }
    : { y: [y, y - 3, y] };
  const bobDuration = expression === "excited" ? 1.8 : 2.5;

  return (
    <motion.g
      animate={bobAnim}
      transition={{ duration: bobDuration, repeat: Infinity, ease: "easeInOut", delay: animDelay }}
    >
      <g transform={`translate(${x}, ${y}) scale(${scale})`}>
        {/* ─ Body ─ */}
        <ellipse cx="0" cy="20" rx="10" ry="8" fill={color} opacity="0.9" />
        {/* ─ Left arm ─ */}
        <motion.line
          x1="-9" y1="16" x2="-15" y2="10"
          stroke={color} strokeWidth="3" strokeLinecap="round"
          animate={expression === "focused" ? { x2: [-15, -13, -15] } : { x2: [-15, -17, -15], y2: [10, 7, 10] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: animDelay }}
        />
        {/* ─ Right arm ─ */}
        <motion.line
          x1="9" y1="16" x2="15" y2="10"
          stroke={color} strokeWidth="3" strokeLinecap="round"
          animate={expression === "focused" ? { x2: [15, 17, 15], y2: [10, 8, 10] } : { x2: [15, 13, 15] }}
          transition={{ duration: 1, repeat: Infinity, delay: animDelay + 0.3 }}
        />
        {/* ─ Legs ─ */}
        <line x1="-4" y1="27" x2="-6" y2="34" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="4" y1="27" x2="6" y2="34" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        {/* ─ Feet ─ */}
        <ellipse cx="-7" cy="35" rx="4" ry="2" fill={color} opacity="0.8" />
        <ellipse cx="7" cy="35" rx="4" ry="2" fill={color} opacity="0.8" />
        {/* ─ Head ─ */}
        <circle cx="0" cy="4" r="11" fill={color} />
        {/* ─ Ears (large, pointy) ─ */}
        <motion.path
          d="M-10,0 L-18,-8 L-9,-4Z" fill={color}
          animate={{ d: ["M-10,0 L-18,-8 L-9,-4Z", "M-10,0 L-19,-10 L-9,-4Z", "M-10,0 L-18,-8 L-9,-4Z"] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.path
          d="M10,0 L18,-8 L9,-4Z" fill={color}
          animate={{ d: ["M10,0 L18,-8 L9,-4Z", "M10,0 L19,-10 L9,-4Z", "M10,0 L18,-8 L9,-4Z"] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
        />
        {/* ─ Face ─ */}
        {/* Eye whites */}
        <ellipse cx="-4" cy="2" rx="3.5" ry="3" fill="hsl(var(--foreground))" />
        <ellipse cx="5" cy="2" rx="3.5" ry="3" fill="hsl(var(--foreground))" />
        {/* Pupils */}
        <motion.circle
          cx="-3.5" cy="2.5" r="1.8" fill="hsl(var(--background))"
          animate={expression === "focused" ? { cx: [-3, -4.5, -3] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.circle
          cx="5.5" cy="2.5" r="1.8" fill="hsl(var(--background))"
          animate={expression === "focused" ? { cx: [6, 4.5, 6] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        {/* Eye shine */}
        <circle cx="-3" cy="1.5" r="0.6" fill="white" opacity="0.8" />
        <circle cx="6" cy="1.5" r="0.6" fill="white" opacity="0.8" />
        {/* Mouth */}
        {expression === "excited" ? (
          <ellipse cx="0.5" cy="8" rx="3.5" ry="2.5" fill="hsl(var(--background))" />
        ) : expression === "mischief" ? (
          <path d="M-4,7 Q0,11 5,7" stroke="hsl(var(--background))" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M-3,7 Q0,10 4,7" stroke="hsl(var(--background))" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        )}
        {/* Eyebrows for focused */}
        {expression === "focused" && (
          <>
            <line x1="-7" y1="-2" x2="-1" y2="-1" stroke="hsl(var(--background))" strokeWidth="0.8" opacity="0.6" />
            <line x1="2" y1="-1" x2="8" y2="-2" stroke="hsl(var(--background))" strokeWidth="0.8" opacity="0.6" />
          </>
        )}
      </g>
      {/* Task label */}
      {task && (
        <text x={x} y={y + 44} textAnchor="middle" className="text-[7px] font-bold uppercase tracking-[0.15em]" fill={color} opacity="0.7">
          {task}
        </text>
      )}
    </motion.g>
  );
}

// ── Cauldron with bubbling code ──
function CodeCauldron({ cx, cy }: { cx: number; cy: number }) {
  const rng = seededRandom(42);
  const bubbles = Array.from({ length: 8 }, (_, i) => ({
    x: cx - 25 + rng() * 50,
    delay: rng() * 3,
    size: 2 + rng() * 4,
  }));
  const codeSymbols = ["{ }", "< />", "=>", "fn", "[]", "::"];

  return (
    <g>
      {/* Cauldron body */}
      <ellipse cx={cx} cy={cy + 12} rx="38" ry="8" fill="hsl(var(--muted))" opacity="0.3" />
      <path d={`M${cx - 35},${cy - 5} Q${cx - 38},${cy + 15} ${cx - 30},${cy + 20} L${cx + 30},${cy + 20} Q${cx + 38},${cy + 15} ${cx + 35},${cy - 5}Z`}
        fill="hsl(240 16% 10%)" stroke="hsl(var(--border))" strokeWidth="1" />
      {/* Rim */}
      <ellipse cx={cx} cy={cy - 5} rx="36" ry="7" fill="hsl(240 16% 12%)" stroke="hsl(var(--border))" strokeWidth="1" />
      {/* Liquid surface */}
      <motion.ellipse
        cx={cx} cy={cy - 3} rx="32" ry="5"
        fill="hsl(175 95% 50%)" opacity="0.25"
        animate={{ opacity: [0.2, 0.35, 0.2], ry: [5, 5.5, 5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* Liquid glow */}
      <motion.ellipse
        cx={cx} cy={cy - 3} rx="24" ry="4"
        fill="hsl(265 90% 62%)" opacity="0"
        animate={{ opacity: [0, 0.15, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
      />
      {/* Bubbles */}
      {bubbles.map((b, i) => (
        <motion.circle
          key={i} cx={b.x} cy={cy - 5} r={b.size}
          fill="hsl(175 95% 50%)" opacity="0"
          animate={{
            cy: [cy - 5, cy - 15, cy - 30],
            opacity: [0, 0.5, 0],
            r: [b.size, b.size * 1.3, b.size * 0.5],
          }}
          transition={{ delay: b.delay, duration: 1.5, repeat: Infinity, repeatDelay: 2 + b.delay * 0.5 }}
        />
      ))}
      {/* Floating code fragments above cauldron */}
      {codeSymbols.map((sym, i) => (
        <motion.text
          key={i}
          x={cx - 25 + i * 10}
          y={cy - 15}
          className="text-[6px] font-mono"
          fill="hsl(175 95% 50%)"
          opacity="0"
          animate={{
            y: [cy - 10, cy - 35, cy - 55],
            opacity: [0, 0.6, 0],
            x: [cx - 25 + i * 10, cx - 25 + i * 10 + (i % 2 === 0 ? 5 : -5)],
          }}
          transition={{ delay: i * 0.6 + 0.5, duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
        >
          {sym}
        </motion.text>
      ))}
      {/* Handles */}
      <path d={`M${cx - 35},${cy} Q${cx - 45},${cy - 5} ${cx - 38},${cy - 12}`}
        stroke="hsl(var(--border))" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d={`M${cx + 35},${cy} Q${cx + 45},${cy - 5} ${cx + 38},${cy - 12}`}
        stroke="hsl(var(--border))" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  );
}

// ── Shelf with items ──
function Shelf({ x, y, width }: { x: number; y: number; width: number }) {
  return (
    <g>
      {/* Shelf plank */}
      <rect x={x} y={y} width={width} height={3} rx={1} fill="hsl(25 30% 22%)" stroke="hsl(var(--border))" strokeWidth="0.5" />
      {/* Bracket left */}
      <path d={`M${x + 4},${y + 3} L${x + 4},${y + 12} L${x + 10},${y + 12}`}
        stroke="hsl(var(--muted-foreground))" strokeWidth="1" fill="none" opacity="0.3" />
      {/* Bracket right */}
      <path d={`M${x + width - 4},${y + 3} L${x + width - 4},${y + 12} L${x + width - 10},${y + 12}`}
        stroke="hsl(var(--muted-foreground))" strokeWidth="1" fill="none" opacity="0.3" />
    </g>
  );
}

// ── Workbench with monitor ──
function Workbench({ x, y, screenColor }: { x: number; y: number; screenColor: string }) {
  return (
    <g>
      {/* Desk */}
      <rect x={x} y={y} width={55} height={4} rx={1} fill="hsl(25 30% 18%)" stroke="hsl(var(--border))" strokeWidth="0.5" />
      {/* Legs */}
      <rect x={x + 4} y={y + 4} width={3} height={20} fill="hsl(25 30% 15%)" />
      <rect x={x + 48} y={y + 4} width={3} height={20} fill="hsl(25 30% 15%)" />
      {/* Monitor */}
      <rect x={x + 10} y={y - 28} width={35} height={25} rx={2} fill="hsl(240 16% 8%)" stroke="hsl(var(--border))" strokeWidth="0.8" />
      {/* Screen */}
      <motion.rect
        x={x + 12} y={y - 26} width={31} height={21} rx={1}
        fill={screenColor} opacity="0.15"
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* Code lines on screen */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.rect
          key={i}
          x={x + 14 + (i % 2 === 0 ? 0 : 4)}
          y={y - 24 + i * 4}
          width={12 + (i % 3) * 5}
          height={1.5}
          rx={0.5}
          fill={screenColor}
          opacity="0.3"
          animate={{ opacity: [0.2, 0.5, 0.2], width: [12 + (i % 3) * 5, 14 + (i % 3) * 5, 12 + (i % 3) * 5] }}
          transition={{ delay: i * 0.4, duration: 1.5, repeat: Infinity }}
        />
      ))}
      {/* Monitor stand */}
      <rect x={x + 25} y={y - 3} width={5} height={3} fill="hsl(240 16% 10%)" />
    </g>
  );
}

// ── Fireplace / Forge ──
function Forge({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {/* Stone arch */}
      <path
        d={`M${x},${y + 40} L${x},${y + 5} Q${x},${y - 5} ${x + 10},${y - 8} L${x + 35},${y - 8} Q${x + 45},${y - 5} ${x + 45},${y + 5} L${x + 45},${y + 40}`}
        fill="hsl(240 12% 10%)" stroke="hsl(var(--border))" strokeWidth="1"
      />
      {/* Inner dark */}
      <rect x={x + 5} y={y} width={35} height={38} rx={2} fill="hsl(240 20% 5%)" />
      {/* Fire glow */}
      <motion.ellipse
        cx={x + 22.5} cy={y + 30} rx="16" ry="10"
        fill="hsl(25 95% 50%)" opacity="0"
        animate={{ opacity: [0.05, 0.15, 0.05] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      {/* Flames */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.path
          key={i}
          d={`M${x + 10 + i * 7},${y + 38} Q${x + 10 + i * 7 + 2},${y + 28} ${x + 10 + i * 7 + (i % 2 === 0 ? 3 : -2)},${y + 22}`}
          stroke={i % 2 === 0 ? "hsl(25 95% 55%)" : "hsl(40 95% 60%)"}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          opacity="0.5"
          animate={{
            d: [
              `M${x + 10 + i * 7},${y + 38} Q${x + 10 + i * 7 + 2},${y + 28} ${x + 10 + i * 7 + 3},${y + 22}`,
              `M${x + 10 + i * 7},${y + 38} Q${x + 10 + i * 7 - 1},${y + 26} ${x + 10 + i * 7 - 2},${y + 20}`,
              `M${x + 10 + i * 7},${y + 38} Q${x + 10 + i * 7 + 2},${y + 28} ${x + 10 + i * 7 + 3},${y + 22}`,
            ],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{ duration: 0.8 + i * 0.2, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      {/* Embers */}
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={`ember-${i}`}
          cx={x + 15 + i * 8} cy={y + 35} r="1.5"
          fill="hsl(30 95% 60%)"
          animate={{ cy: [y + 35, y + 10, y - 5], opacity: [0.8, 0.4, 0], cx: [x + 15 + i * 8, x + 15 + i * 8 + (i - 1) * 4] }}
          transition={{ delay: i * 0.7, duration: 2, repeat: Infinity, repeatDelay: 2 }}
        />
      ))}
    </g>
  );
}

// ── Brick wall texture ──
function BrickWall({ x, y, width, height }: { x: number; y: number; width: number; height: number }) {
  const bricks: { bx: number; by: number; bw: number }[] = [];
  const rng = seededRandom(99);
  for (let row = 0; row < Math.floor(height / 8); row++) {
    const offset = row % 2 === 0 ? 0 : 10;
    for (let col = -1; col < Math.ceil(width / 20) + 1; col++) {
      const bw = 16 + rng() * 6;
      bricks.push({
        bx: x + offset + col * 22,
        by: y + row * 8,
        bw,
      });
    }
  }
  return (
    <g opacity="0.08">
      {bricks.map((b, i) => (
        <rect key={i} x={b.bx} y={b.by} width={b.bw} height={6} rx={0.5}
          stroke="hsl(var(--foreground))" strokeWidth="0.3" fill="none" />
      ))}
    </g>
  );
}

// ── Status ticker at the bottom ──
function StatusTicker({ isInView }: { isInView: boolean }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => setTick((t) => t + 1), 2800);
    return () => clearInterval(interval);
  }, [isInView]);

  const messages = [
    "🧪 Brewing React components…",
    "🔧 Wrenching API routes into place…",
    "🎨 Painting pixel-perfect layouts…",
    "🔒 Running security enchantments…",
    "🚀 Fueling the deploy rockets…",
    "📦 Packaging your app bundle…",
    "⚡ Optimizing with lightning spells…",
    "🧩 Fitting the last puzzle piece…",
  ];

  return (
    <motion.div
      className="mt-8 rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm px-4 py-3 flex items-center gap-3 overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 1.2, duration: 0.5 }}
    >
      <div className="flex items-center gap-2 shrink-0">
        <motion.div
          className="h-2.5 w-2.5 rounded-full bg-green-500"
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Live</span>
      </div>
      <div className="h-4 w-px bg-border/40" />
      <div className="overflow-hidden flex-1 h-5 relative">
        <AnimatePresence mode="wait">
          <motion.p
            key={tick}
            className="text-[11px] font-mono text-muted-foreground whitespace-nowrap absolute inset-y-0 flex items-center"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35 }}
          >
            {messages[tick % messages.length]}
          </motion.p>
        </AnimatePresence>
      </div>
      <span className="text-[9px] text-primary font-bold shrink-0 tabular-nums font-mono">
        {((tick % 8) + 1)}/8
      </span>
    </motion.div>
  );
}

/* ═══════════════════════════════════
   MAIN WORKSHOP SCENE
   ═══════════════════════════════════ */
export function GremlinWorkshop() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-40px" });

  const codeSymbols = useMemo(() => {
    const symbols = ["{ }", "< />", "=>", "const", "import", "async", "[]", "::", "tsx", "sql", "npm", "git"];
    const rng = seededRandom(7);
    return symbols.map((s, i) => ({
      symbol: s,
      x: 5 + rng() * 90,
      delay: rng() * 5,
      duration: 3 + rng() * 2,
      color: i % 3 === 0 ? "hsl(265 90% 62%)" : i % 3 === 1 ? "hsl(175 95% 50%)" : "hsl(320 95% 60%)",
    }));
  }, []);

  const embers = useMemo(() => {
    const rng = seededRandom(13);
    return Array.from({ length: 12 }, (_, i) => ({
      x: 8 + rng() * 14,
      delay: rng() * 4,
      color: i % 2 === 0 ? "hsl(25 95% 55%)" : "hsl(40 95% 60%)",
      size: 2 + rng() * 3,
    }));
  }, []);

  return (
    <section ref={ref} className="relative py-16 md:py-28 overflow-hidden">
      {/* ── Background glows ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-primary/5 blur-[150px]" />
        <div className="absolute top-1/4 left-1/6 w-[300px] h-[300px] rounded-full bg-secondary/4 blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/6 w-[300px] h-[300px] rounded-full bg-accent/4 blur-[100px]" />
      </div>

      {/* ── Section heading ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="text-center mb-10 md:mb-16 px-4 relative z-10"
      >
        <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] text-primary mb-3">Behind the scenes</p>
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight text-foreground">
          Gremlins build your app in real time
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground mt-3 max-w-lg mx-auto leading-relaxed">
          A swarm of AI agents analyze your site, design components, write code, and deploy — all in under 90 seconds.
        </p>
      </motion.div>

      {/* ── The Workshop SVG Scene ── */}
      <div className="relative max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative rounded-2xl border border-border/30 bg-card/30 backdrop-blur-md overflow-hidden"
        >
          {/* Blueprint grid overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
            backgroundImage: "linear-gradient(hsl(175 95% 50%) 0.5px, transparent 0.5px), linear-gradient(90deg, hsl(175 95% 50%) 0.5px, transparent 0.5px)",
            backgroundSize: "24px 24px",
          }} />

          {/* Floating code symbols */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {codeSymbols.map((s, i) => (
              <FloatingSymbol key={i} {...s} />
            ))}
          </div>

          {/* SVG Scene */}
          <svg viewBox="0 0 520 300" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
            {/* Brick wall background */}
            <BrickWall x={0} y={0} width={520} height={180} />

            {/* ── Shelves with potions ── */}
            <Shelf x={15} y={30} width={90} />
            <PotionJar x={22} y={8} liquidColor="hsl(265 90% 62%)" size={22} delay={0.3} />
            <PotionJar x={48} y={10} liquidColor="hsl(175 95% 50%)" size={18} delay={0.5} />
            <PotionJar x={72} y={8} liquidColor="hsl(320 95% 60%)" size={24} delay={0.7} />

            <Shelf x={415} y={35} width={90} />
            <PotionJar x={422} y={13} liquidColor="hsl(40 95% 60%)" size={20} delay={0.4} />
            <PotionJar x={448} y={11} liquidColor="hsl(265 90% 62%)" size={24} delay={0.6} />
            <PotionJar x={478} y={14} liquidColor="hsl(175 95% 50%)" size={18} delay={0.8} />

            {/* Second shelf row */}
            <Shelf x={20} y={65} width={75} />
            <PotionJar x={28} y={43} liquidColor="hsl(140 70% 45%)" size={20} delay={1} />
            <PotionJar x={55} y={45} liquidColor="hsl(320 95% 60%)" size={18} delay={1.2} />

            <Shelf x={425} y={70} width={75} />
            <PotionJar x={432} y={48} liquidColor="hsl(200 90% 50%)" size={22} delay={0.9} />
            <PotionJar x={462} y={50} liquidColor="hsl(25 95% 55%)" size={18} delay={1.1} />

            {/* ── Hanging tools ── */}
            <HangingTool x={140} y={18} type="wrench" />
            <HangingTool x={170} y={22} type="gear" />
            <HangingTool x={340} y={20} type="hammer" />
            <HangingTool x={370} y={16} type="wrench" />

            {/* ── Forge on the left ── */}
            <Forge x={20} y={120} />

            {/* ── Central cauldron ── */}
            <CodeCauldron cx={260} cy={195} />

            {/* ── Workbenches on the sides ── */}
            <Workbench x={130} y={175} screenColor="hsl(265 90% 62%)" />
            <Workbench x={340} y={175} screenColor="hsl(175 95% 50%)" />

            {/* ── Floor ── */}
            <rect x={0} y={260} width={520} height={40} fill="hsl(25 15% 12%)" opacity="0.5" />
            <line x1={0} y1={260} x2={520} y2={260} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.4" />
            {/* Floor planks */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <line key={i} x1={10 + i * 60} y1={260} x2={10 + i * 60} y2={300} stroke="hsl(var(--border))" strokeWidth="0.3" opacity="0.15" />
            ))}

            {/* ═══ GREMLIN CHARACTERS ═══ */}

            {/* Chef Gremlin — stirring the cauldron */}
            <DetailedGremlin
              x={225} y={145} color="hsl(265 90% 62%)" scale={0.95}
              expression="mischief" task="brewer" animDelay={0}
            />
            {/* Chef hat */}
            <motion.g animate={{ y: [145, 142, 145] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
              <ellipse cx={225} cy={132} rx={11} ry={3} fill="white" opacity="0.85" />
              <rect x={217} y={120} width={16} height={12} rx={4} fill="white" opacity="0.85" />
            </motion.g>
            {/* Spoon */}
            <motion.g
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "240px 160px" }}
            >
              <line x1={240} y1={155} x2={265} y2={190} stroke="hsl(30 30% 45%)" strokeWidth="2" strokeLinecap="round" />
              <ellipse cx={267} cy={193} rx={5} ry={3} fill="hsl(30 30% 40%)" />
            </motion.g>

            {/* Coder Gremlin — at left workbench */}
            <DetailedGremlin
              x={157} y={130} color="hsl(320 95% 60%)" scale={0.8}
              expression="focused" task="coder" animDelay={0.5}
            />

            {/* Deployer Gremlin — at right workbench */}
            <DetailedGremlin
              x={367} y={130} color="hsl(175 95% 50%)" scale={0.8}
              expression="excited" task="deployer" animDelay={1}
            />

            {/* Small helper gremlin near the forge */}
            <DetailedGremlin
              x={55} y={155} color="hsl(40 90% 55%)" scale={0.55}
              expression="happy" task="smith" animDelay={1.5}
            />

            {/* Tiny gremlin carrying a box on the far right */}
            <motion.g
              animate={{ x: [0, -20, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <DetailedGremlin
                x={470} y={220} color="hsl(265 70% 55%)" scale={0.5}
                expression="happy" animDelay={2}
              />
              {/* Package */}
              <motion.rect
                x={462} y={213} width={10} height={8} rx={1}
                fill="hsl(30 40% 35%)" stroke="hsl(var(--border))" strokeWidth="0.5"
                animate={{ y: [213, 211, 213] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 2 }}
              />
              <motion.text x={464} y={219} className="text-[4px] font-bold" fill="hsl(175 95% 50%)"
                animate={{ y: [219, 217, 219] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 2 }}
              >
                📦
              </motion.text>
            </motion.g>

            {/* ── Ambient decoration ── */}
            {/* Scroll / recipe pinned to wall */}
            <g opacity="0.4">
              <rect x={115} y={50} width={28} height={38} rx={2} fill="hsl(40 40% 25%)" />
              <rect x={118} y={54} width={22} height={2} rx={0.5} fill="hsl(var(--muted-foreground))" opacity="0.3" />
              <rect x={118} y={58} width={18} height={2} rx={0.5} fill="hsl(var(--muted-foreground))" opacity="0.3" />
              <rect x={118} y={62} width={20} height={2} rx={0.5} fill="hsl(var(--muted-foreground))" opacity="0.3" />
              <rect x={118} y={66} width={14} height={2} rx={0.5} fill="hsl(var(--muted-foreground))" opacity="0.3" />
              {/* Pin */}
              <circle cx={129} cy={48} r={2} fill="hsl(0 85% 60%)" opacity="0.6" />
            </g>

            {/* Second recipe scroll */}
            <g opacity="0.35">
              <rect x={380} y={55} width={25} height={32} rx={2} fill="hsl(40 40% 25%)" />
              <rect x={383} y={59} width={19} height={1.5} rx={0.5} fill="hsl(var(--muted-foreground))" opacity="0.3" />
              <rect x={383} y={63} width={15} height={1.5} rx={0.5} fill="hsl(var(--muted-foreground))" opacity="0.3" />
              <rect x={383} y={67} width={17} height={1.5} rx={0.5} fill="hsl(var(--muted-foreground))" opacity="0.3" />
              <circle cx={392} cy={53} r={2} fill="hsl(265 90% 62%)" opacity="0.5" />
            </g>

            {/* Chains / pipes on ceiling */}
            <line x1={200} y1={0} x2={200} y2={12} stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.15" />
            <line x1={320} y1={0} x2={320} y2={10} stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.15" />
            <line x1={260} y1={0} x2={260} y2={8} stroke="hsl(var(--muted-foreground))" strokeWidth="1" opacity="0.15" />
            {/* Chandelier hint */}
            <motion.circle
              cx={260} cy={12} r={3} fill="hsl(40 90% 55%)" opacity="0"
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </svg>

          {/* Ember particles (HTML layer for better performance) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {embers.map((e, i) => (
              <Ember key={i} {...e} />
            ))}
          </div>

          {/* Status ticker */}
          <div className="px-4 md:px-6 pb-4 md:pb-6">
            <StatusTicker isInView={isInView} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
