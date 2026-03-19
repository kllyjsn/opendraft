import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useState, useMemo } from "react";
import { SpaceGremlin } from "@/components/SpaceGremlin";

/* ═══════════════════════════════════════════════════
   GREMLIN WORKSHOP — Interstellar Coolness Mode ✦
   Cosmic forge where AI gremlins craft apps among
   stars, nebulae, and holographic workstations
   ═══════════════════════════════════════════════════ */

// ── Seeded PRNG for deterministic layouts ──
function sr(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

// ── Starfield background ──
function Starfield() {
  const rng = sr(77);
  const stars = Array.from({ length: 80 }, () => ({
    cx: rng() * 760, cy: rng() * 380, r: rng() * 1.2 + 0.2,
    opacity: rng() * 0.5 + 0.1, twinkle: rng() * 4 + 2,
  }));
  return (
    <g>
      {stars.map((s, i) => (
        <motion.circle
          key={i} cx={s.cx} cy={s.cy} r={s.r}
          fill="white" opacity={s.opacity}
          animate={{ opacity: [s.opacity, s.opacity * 2.5, s.opacity] }}
          transition={{ duration: s.twinkle, repeat: Infinity, delay: i * 0.07 }}
        />
      ))}
    </g>
  );
}

// ── Nebula clouds ──
function Nebula() {
  return (
    <g>
      <defs>
        <radialGradient id="neb1" cx="30%" cy="40%"><stop offset="0%" stopColor="hsl(265 90% 62%)" stopOpacity="0.12" /><stop offset="100%" stopColor="transparent" /></radialGradient>
        <radialGradient id="neb2" cx="70%" cy="60%"><stop offset="0%" stopColor="hsl(175 95% 50%)" stopOpacity="0.08" /><stop offset="100%" stopColor="transparent" /></radialGradient>
        <radialGradient id="neb3" cx="50%" cy="30%"><stop offset="0%" stopColor="hsl(320 95% 60%)" stopOpacity="0.06" /><stop offset="100%" stopColor="transparent" /></radialGradient>
        <filter id="nebBlur"><feGaussianBlur stdDeviation="25" /></filter>
      </defs>
      <motion.ellipse cx="200" cy="150" rx="200" ry="120" fill="url(#neb1)" filter="url(#nebBlur)"
        animate={{ rx: [200, 220, 200], ry: [120, 130, 120] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.ellipse cx="550" cy="220" rx="180" ry="100" fill="url(#neb2)" filter="url(#nebBlur)"
        animate={{ rx: [180, 200, 180], cy: [220, 210, 220] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.ellipse cx="380" cy="100" rx="150" ry="80" fill="url(#neb3)" filter="url(#nebBlur)"
        animate={{ cx: [380, 400, 380], opacity: [1, 0.7, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
    </g>
  );
}

// ── Energy conduit (glowing pulsing line between two points) ──
function EnergyConduit({ x1, y1, x2, y2, color, delay = 0 }: {
  x1: number; y1: number; x2: number; y2: number; color: string; delay?: number;
}) {
  const midX = (x1 + x2) / 2;
  const midY = Math.min(y1, y2) - 20;
  const path = `M${x1},${y1} Q${midX},${midY} ${x2},${y2}`;
  return (
    <g>
      <path d={path} stroke={color} strokeWidth="1" fill="none" opacity="0.1" />
      <motion.path d={path} stroke={color} strokeWidth="1.5" fill="none" opacity="0"
        strokeLinecap="round"
        animate={{ opacity: [0, 0.6, 0], strokeWidth: [1, 2.5, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay, ease: "easeInOut" }}
      />
      {/* Traveling particle along the conduit */}
      <motion.circle r="2.5" fill={color} opacity="0"
        animate={{
          cx: [x1, midX, x2], cy: [y1, midY, y2],
          opacity: [0, 0.9, 0],
        }}
        transition={{ duration: 1.8, repeat: Infinity, delay: delay + 0.5, ease: "easeInOut" }}
      />
      <motion.circle r="5" fill={color} opacity="0"
        animate={{
          cx: [x1, midX, x2], cy: [y1, midY, y2],
          opacity: [0, 0.15, 0],
        }}
        transition={{ duration: 1.8, repeat: Infinity, delay: delay + 0.5, ease: "easeInOut" }}
      />
    </g>
  );
}

// ── Holographic screen / display ──
function HoloScreen({ x, y, w, h, color, label, delay = 0 }: {
  x: number; y: number; w: number; h: number; color: string; label: string; delay?: number;
}) {
  const rng = sr(x * 17 + y);
  const lines = Array.from({ length: 5 }, () => ({ indent: rng() * 6, width: 8 + rng() * (w - 20) }));
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay + 0.3, duration: 0.6, type: "spring" }}
    >
      {/* Glow behind */}
      <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} rx={5} fill={color} opacity="0.05" />
      {/* Screen frame */}
      <rect x={x} y={y} width={w} height={h} rx={3} fill="hsl(240 20% 5%)" opacity="0.85"
        stroke={color} strokeWidth="0.8" strokeOpacity="0.4" />
      {/* Scanline effect */}
      <motion.rect x={x} y={y} width={w} height={2} fill={color} opacity="0"
        animate={{ y: [y, y + h, y], opacity: [0, 0.08, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay }}
      />
      {/* Content lines */}
      {lines.map((l, i) => (
        <motion.rect
          key={i}
          x={x + 4 + l.indent} y={y + 5 + i * (h / 6.5)}
          width={l.width} height={2} rx={1}
          fill={color} opacity="0.25"
          animate={{ opacity: [0.15, 0.45, 0.15], width: [l.width, l.width + 3, l.width] }}
          transition={{ delay: delay + i * 0.3, duration: 1.5 + i * 0.2, repeat: Infinity }}
        />
      ))}
      {/* Label */}
      <text x={x + w / 2} y={y + h + 10} textAnchor="middle" fontSize="7" fontWeight="700"
        fill={color} opacity="0.6" letterSpacing="0.15em"
        className="uppercase font-mono"
      >{label}</text>
    </motion.g>
  );
}

// SpaceGremlin is now imported from @/components/SpaceGremlin

// ── Cosmic Forge (replaces stone forge with plasma reactor) ──
function PlasmaForge({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {/* Reactor housing */}
      <rect x={x} y={y + 5} width={55} height={50} rx={4} fill="hsl(240 20% 6%)" stroke="hsl(var(--border))" strokeWidth="0.8" opacity="0.9" />
      {/* Side panels */}
      <rect x={x + 3} y={y + 8} width={8} height={44} rx={2} fill="hsl(265 90% 62%)" opacity="0.05" />
      <rect x={x + 44} y={y + 8} width={8} height={44} rx={2} fill="hsl(265 90% 62%)" opacity="0.05" />
      {/* Inner chamber */}
      <rect x={x + 8} y={y + 10} width={39} height={40} rx={3} fill="hsl(240 30% 3%)" />
      {/* Core orb */}
      <motion.circle cx={x + 27.5} cy={y + 30} r="12" fill="hsl(265 90% 62%)" opacity="0.03"
        animate={{ r: [12, 15, 12], opacity: [0.03, 0.08, 0.03] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.circle cx={x + 27.5} cy={y + 30} r="8" fill="hsl(175 95% 50%)" opacity="0.08"
        animate={{ r: [8, 10, 8], opacity: [0.05, 0.15, 0.05] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
      />
      <motion.circle cx={x + 27.5} cy={y + 30} r="4" fill="white" opacity="0.1"
        animate={{ opacity: [0.05, 0.25, 0.05], r: [3, 5, 3] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
      {/* Energy rings */}
      <motion.ellipse cx={x + 27.5} cy={y + 30} rx="14" ry="5" fill="none"
        stroke="hsl(175 95% 50%)" strokeWidth="0.5" opacity="0.15"
        animate={{ ry: [5, 7, 5], opacity: [0.1, 0.25, 0.1], rotate: [0, 360] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: `${x + 27.5}px ${y + 30}px` }}
      />
      <motion.ellipse cx={x + 27.5} cy={y + 30} rx="16" ry="6" fill="none"
        stroke="hsl(265 90% 62%)" strokeWidth="0.5" opacity="0.1"
        animate={{ ry: [6, 4, 6], opacity: [0.05, 0.2, 0.05], rotate: [360, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: `${x + 27.5}px ${y + 30}px` }}
      />
      {/* Plasma sparks */}
      {[0, 1, 2, 3].map(i => (
        <motion.circle key={i} cx={x + 27.5} cy={y + 30} r="1" fill="hsl(175 95% 50%)"
          animate={{
            cx: [x + 27.5, x + 15 + i * 10, x + 27.5],
            cy: [y + 30, y + 15 + i * 5, y + 30],
            opacity: [0, 0.7, 0],
          }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
        />
      ))}
      {/* Top vent glow */}
      <motion.rect x={x + 18} y={y + 2} width={19} height={3} rx={1.5}
        fill="hsl(175 95% 50%)" opacity="0"
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </g>
  );
}

// ── Holographic Cauldron / Code Synthesizer ──
function CodeSynthesizer({ cx, cy }: { cx: number; cy: number }) {
  const rng = sr(42);
  const bubbles = Array.from({ length: 10 }, () => ({
    x: cx - 30 + rng() * 60, delay: rng() * 3, size: 1.5 + rng() * 3,
  }));
  const codeFrags = ["{ }", "</>", "=>", "fn()", "[ ]", ":::", "npm", "tsx"];

  return (
    <g>
      {/* Base platform */}
      <ellipse cx={cx} cy={cy + 20} rx="45" ry="8" fill="hsl(240 20% 6%)" stroke="hsl(var(--border))" strokeWidth="0.5" />
      {/* Glowing ring on platform */}
      <motion.ellipse cx={cx} cy={cy + 20} rx="42" ry="7" fill="none"
        stroke="hsl(175 95% 50%)" strokeWidth="1" opacity="0.1"
        animate={{ opacity: [0.05, 0.2, 0.05], strokeWidth: [0.5, 1.5, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* Vessel body — translucent */}
      <path d={`M${cx - 38},${cy} Q${cx - 42},${cy + 15} ${cx - 35},${cy + 20} L${cx + 35},${cy + 20} Q${cx + 42},${cy + 15} ${cx + 38},${cy}Z`}
        fill="hsl(240 20% 6%)" stroke="hsl(var(--border))" strokeWidth="0.8" opacity="0.8" />
      {/* Inner glass sheen */}
      <path d={`M${cx - 35},${cy + 2} Q${cx - 38},${cy + 14} ${cx - 33},${cy + 18} L${cx - 20},${cy + 18} Q${cx - 25},${cy + 14} ${cx - 28},${cy + 2}Z`}
        fill="white" opacity="0.02" />
      {/* Rim */}
      <ellipse cx={cx} cy={cy} rx="39" ry="7" fill="hsl(240 20% 8%)" stroke="hsl(265 90% 62%)" strokeWidth="0.5" strokeOpacity="0.3" />
      {/* Liquid surface */}
      <motion.ellipse cx={cx} cy={cy + 2} rx="35" ry="5.5" fill="hsl(175 95% 50%)" opacity="0.15"
        animate={{ opacity: [0.1, 0.25, 0.1], ry: [5.5, 6, 5.5] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      />
      {/* Secondary liquid glow */}
      <motion.ellipse cx={cx} cy={cy + 2} rx="25" ry="4" fill="hsl(265 90% 62%)" opacity="0"
        animate={{ opacity: [0, 0.12, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
      />
      {/* Bubbles */}
      {bubbles.map((b, i) => (
        <motion.circle key={i} cx={b.x} cy={cy} r={b.size} fill="hsl(175 95% 50%)" opacity="0"
          animate={{
            cy: [cy, cy - 15, cy - 35], opacity: [0, 0.5, 0],
            r: [b.size, b.size * 1.5, b.size * 0.3],
          }}
          transition={{ delay: b.delay, duration: 1.8, repeat: Infinity, repeatDelay: 2 + b.delay * 0.4 }}
        />
      ))}
      {/* Holographic code projections rising from cauldron */}
      {codeFrags.map((frag, i) => (
        <motion.text key={i}
          x={cx - 28 + i * 8} y={cy - 10}
          fontSize="6" fontWeight="700" fontFamily="monospace"
          fill={i % 2 === 0 ? "hsl(175 95% 50%)" : "hsl(265 90% 62%)"} opacity="0"
          animate={{
            y: [cy - 5, cy - 40, cy - 65],
            opacity: [0, 0.7, 0],
            x: [cx - 28 + i * 8, cx - 28 + i * 8 + (i % 2 === 0 ? 4 : -4)],
          }}
          transition={{ delay: i * 0.5, duration: 3, repeat: Infinity, repeatDelay: 4 }}
        >{frag}</motion.text>
      ))}
      {/* Handles */}
      <path d={`M${cx - 38},${cy + 5} Q${cx - 50},${cy} ${cx - 42},${cy - 8}`}
        stroke="hsl(var(--border))" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d={`M${cx + 38},${cy + 5} Q${cx + 50},${cy} ${cx + 42},${cy - 8}`}
        stroke="hsl(var(--border))" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  );
}

// ── Orbital Ring / Portal behind the scene ──
function OrbitalRing({ cx, cy, rx, ry, color, duration = 8, reverse = false }: {
  cx: number; cy: number; rx: number; ry: number; color: string; duration?: number; reverse?: boolean;
}) {
  return (
    <motion.ellipse cx={cx} cy={cy} rx={rx} ry={ry}
      fill="none" stroke={color} strokeWidth="0.5" opacity="0.12"
      strokeDasharray="4 8"
      animate={{ rotate: reverse ? [360, 0] : [0, 360] }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    />
  );
}

// ── Floating holographic crystal / data shard ──
function DataCrystal({ x, y, color, delay = 0 }: { x: number; y: number; color: string; delay?: number }) {
  return (
    <motion.g
      animate={{ y: [y, y - 6, y], rotate: [0, 10, -10, 0] }}
      transition={{ duration: 4, repeat: Infinity, delay, ease: "easeInOut" }}
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      <motion.polygon
        points={`${x},${y - 8} ${x + 5},${y} ${x},${y + 8} ${x - 5},${y}`}
        fill={color} opacity="0.15" stroke={color} strokeWidth="0.5" strokeOpacity="0.3"
      />
      <motion.polygon
        points={`${x},${y - 8} ${x + 5},${y} ${x},${y + 8} ${x - 5},${y}`}
        fill={color} opacity="0"
        animate={{ opacity: [0, 0.2, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay }}
      />
    </motion.g>
  );
}

// ── Status ticker ──
function StatusTicker({ isInView }: { isInView: boolean }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!isInView) return;
    const iv = setInterval(() => setTick(t => t + 1), 2800);
    return () => clearInterval(iv);
  }, [isInView]);

  const msgs = [
    "🧪 Synthesizing React components…",
    "⚡ Charging deploy warp drive…",
    "🔮 Conjuring pixel-perfect layouts…",
    "🛡️ Activating security force fields…",
    "🚀 Igniting production boosters…",
    "📦 Compressing quantum app bundle…",
    "💎 Polishing diamond-grade code…",
    "🌌 Warping through CI/CD pipeline…",
    "🔧 Calibrating API conduits…",
    "🎯 Locking onto deployment target…",
  ];

  return (
    <motion.div
      className="mt-6 rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm px-4 py-3 flex items-center gap-3 overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 1.5, duration: 0.5 }}
    >
      <div className="flex items-center gap-2 shrink-0">
        <motion.div className="h-2.5 w-2.5 rounded-full bg-green-500"
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Live</span>
      </div>
      <div className="h-4 w-px bg-border/40" />
      <div className="overflow-hidden flex-1 h-5 relative">
        <AnimatePresence mode="wait">
          <motion.p key={tick}
            className="text-[11px] font-mono text-muted-foreground whitespace-nowrap absolute inset-y-0 flex items-center"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }}
          >{msgs[tick % msgs.length]}</motion.p>
        </AnimatePresence>
      </div>
      <span className="text-[9px] text-primary font-bold shrink-0 tabular-nums font-mono">
        {((tick % 10) + 1)}/10
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

  return (
    <section ref={ref} className="relative py-16 md:py-28 overflow-hidden">
      {/* ── Background glows ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full bg-primary/5 blur-[180px]" />
        <div className="absolute top-1/4 left-[15%] w-[350px] h-[350px] rounded-full bg-secondary/3 blur-[120px]" />
        <div className="absolute bottom-1/4 right-[15%] w-[300px] h-[300px] rounded-full bg-accent/3 blur-[100px]" />
      </div>

      {/* ── Section heading ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="text-center mb-10 md:mb-16 px-4 relative z-10"
      >
        <motion.p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-primary mb-3"
          animate={isInView ? { opacity: [0, 1] } : {}} transition={{ delay: 0.2 }}
        >✦ Behind the scenes ✦</motion.p>
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight text-foreground">
          Gremlins build your app in real time
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground mt-3 max-w-lg mx-auto leading-relaxed">
          A swarm of AI agents analyze, design, code, and deploy — all in under 90 seconds.
        </p>
      </motion.div>

      {/* ── The Workshop SVG Scene ── */}
      <div className="relative max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative rounded-2xl border border-border/20 bg-[hsl(240_20%_3%)] overflow-hidden"
          style={{ boxShadow: "0 0 80px -20px hsl(265 90% 62% / 0.1), 0 0 40px -10px hsl(175 95% 50% / 0.05)" }}
        >
          {/* Subtle grid overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
            backgroundImage: "linear-gradient(hsl(175 95% 50%) 0.5px, transparent 0.5px), linear-gradient(90deg, hsl(175 95% 50%) 0.5px, transparent 0.5px)",
            backgroundSize: "20px 20px",
          }} />

          {/* SVG Scene */}
          <svg viewBox="0 0 760 380" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
            {/* ── Deep space background ── */}
            <rect width="760" height="380" fill="hsl(240 20% 3%)" />
            <Starfield />
            <Nebula />

            {/* ── Orbital rings ── */}
            <OrbitalRing cx={380} cy={190} rx={340} ry={50} color="hsl(265 90% 62%)" duration={20} />
            <OrbitalRing cx={380} cy={190} rx={280} ry={35} color="hsl(175 95% 50%)" duration={15} reverse />
            <OrbitalRing cx={380} cy={190} rx={200} ry={25} color="hsl(320 95% 60%)" duration={25} />

            {/* ── Floor / ground plane ── */}
            <defs>
              <linearGradient id="floor" x1="0" y1="300" x2="0" y2="380">
                <stop offset="0%" stopColor="hsl(240 20% 8%)" />
                <stop offset="100%" stopColor="hsl(240 20% 3%)" />
              </linearGradient>
            </defs>
            <rect x={0} y={295} width={760} height={85} fill="url(#floor)" />
            <line x1={0} y1={295} x2={760} y2={295} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.15" />
            {/* Floor grid lines */}
            {Array.from({ length: 15 }, (_, i) => (
              <line key={i} x1={20 + i * 52} y1={295} x2={20 + i * 52} y2={380}
                stroke="hsl(175 95% 50%)" strokeWidth="0.3" opacity="0.04" />
            ))}
            {[305, 320, 340, 360].map(y => (
              <line key={y} x1={0} y1={y} x2={760} y2={y}
                stroke="hsl(175 95% 50%)" strokeWidth="0.3" opacity="0.03" />
            ))}

            {/* ── Plasma Forge (left) ── */}
            <PlasmaForge x={40} y={230} />

            {/* ── Central Code Synthesizer ── */}
            <CodeSynthesizer cx={380} cy={255} />

            {/* ── Holographic screens ── */}
            <HoloScreen x={155} y={170} w={55} h={40} color="hsl(265 90% 62%)" label="frontend" delay={0.3} />
            <HoloScreen x={555} y={175} w={55} h={40} color="hsl(175 95% 50%)" label="backend" delay={0.6} />
            <HoloScreen x={285} y={120} w={48} h={35} color="hsl(320 95% 60%)" label="design" delay={0.9} />
            <HoloScreen x={430} y={125} w={48} h={35} color="hsl(40 95% 60%)" label="deploy" delay={1.2} />

            {/* ── Energy conduits connecting stations ── */}
            <EnergyConduit x1={183} y1={210} x2={345} y2={250} color="hsl(265 90% 62%)" delay={0} />
            <EnergyConduit x1={583} y1={215} x2={420} y2={250} color="hsl(175 95% 50%)" delay={1} />
            <EnergyConduit x1={309} y1={155} x2={360} y2={245} color="hsl(320 95% 60%)" delay={2} />
            <EnergyConduit x1={454} y1={160} x2={400} y2={245} color="hsl(40 95% 60%)" delay={3} />
            <EnergyConduit x1={67} y1={230} x2={345} y2={255} color="hsl(265 70% 55%)" delay={1.5} />

            {/* ── Floating data crystals ── */}
            <DataCrystal x={130} y={100} color="hsl(265 90% 62%)" delay={0} />
            <DataCrystal x={650} y={90} color="hsl(175 95% 50%)" delay={1} />
            <DataCrystal x={720} y={150} color="hsl(320 95% 60%)" delay={2} />
            <DataCrystal x={50} y={130} color="hsl(40 95% 60%)" delay={0.5} />
            <DataCrystal x={380} y={70} color="hsl(265 90% 62%)" delay={1.5} />

            {/* ═══ GREMLIN CHARACTERS ═══ */}

            {/* Lead Brewer — stirring the synthesizer */}
            <SpaceGremlin x={340} y={205} color="hsl(265 90% 62%)" scale={1}
              expression="mischief" task="architect" animDelay={0} hasHelmet />
            {/* Stirring wand */}
            <motion.g animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "355px 220px" }}
            >
              <line x1={355} y1={215} x2={385} y2={252} stroke="hsl(175 95% 50%)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
              <motion.circle cx={387} cy={254} r="3" fill="hsl(175 95% 50%)" opacity="0.3"
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </motion.g>

            {/* Coder — at left screen */}
            <SpaceGremlin x={183} y={215} color="hsl(320 95% 60%)" scale={0.8}
              expression="focused" task="coder" animDelay={0.5} />

            {/* Deployer — at right screen */}
            <SpaceGremlin x={583} y={220} color="hsl(175 95% 50%)" scale={0.8}
              expression="excited" task="deployer" animDelay={1} hasHelmet />

            {/* Designer — near design screen */}
            <SpaceGremlin x={310} y={160} color="hsl(40 95% 55%)" scale={0.65}
              expression="happy" task="designer" animDelay={1.5} />

            {/* Smith — near the forge */}
            <SpaceGremlin x={68} y={225} color="hsl(265 70% 55%)" scale={0.6}
              expression="happy" task="smith" animDelay={2} />

            {/* Jetpack courier */}
            <SpaceGremlin x={670} y={200} color="hsl(320 70% 60%)" scale={0.55}
              expression="excited" task="courier" animDelay={2.5} hasJetpack />

            {/* Tiny QA gremlin patrolling */}
            <motion.g animate={{ x: [0, 60, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            >
              <SpaceGremlin x={460} y={275} color="hsl(145 70% 50%)" scale={0.45}
                expression="focused" task="qa" animDelay={3} />
            </motion.g>
          </svg>

          {/* Status ticker */}
          <div className="px-4 md:px-6 pb-4 md:pb-6">
            <StatusTicker isInView={isInView} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
