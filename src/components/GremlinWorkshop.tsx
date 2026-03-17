import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

/* ── Tiny SVG gremlin factory ── */
function Gremlin({ color, size = 40, expression = "happy" }: { color: string; size?: number; expression?: "happy" | "focused" | "excited" }) {
  const eyes = expression === "focused" ? (
    <>
      <circle cx="12" cy="13" r="2.2" fill="hsl(var(--foreground))" />
      <circle cx="22" cy="13" r="2.2" fill="hsl(var(--foreground))" />
      <rect x="10" y="12" width="4" height="1" rx="0.5" fill="hsl(var(--foreground))" opacity="0.5" />
      <rect x="20" y="12" width="4" height="1" rx="0.5" fill="hsl(var(--foreground))" opacity="0.5" />
    </>
  ) : expression === "excited" ? (
    <>
      <circle cx="12" cy="13" r="2.8" fill="hsl(var(--foreground))" />
      <circle cx="22" cy="13" r="2.8" fill="hsl(var(--foreground))" />
      <circle cx="13" cy="12.5" r="0.8" fill={color} />
      <circle cx="23" cy="12.5" r="0.8" fill={color} />
    </>
  ) : (
    <>
      <circle cx="12" cy="13" r="2.4" fill="hsl(var(--foreground))" />
      <circle cx="22" cy="13" r="2.4" fill="hsl(var(--foreground))" />
      <circle cx="12.8" cy="12.5" r="0.7" fill={color} />
      <circle cx="22.8" cy="12.5" r="0.7" fill={color} />
    </>
  );

  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none">
      {/* Ears */}
      <ellipse cx="5" cy="10" rx="4" ry="6" fill={color} opacity="0.8" />
      <ellipse cx="29" cy="10" rx="4" ry="6" fill={color} opacity="0.8" />
      {/* Head */}
      <ellipse cx="17" cy="16" rx="13" ry="14" fill={color} />
      {/* Face area */}
      <ellipse cx="17" cy="18" rx="9" ry="8" fill={color} style={{ filter: "brightness(1.15)" }} />
      {/* Eyes */}
      {eyes}
      {/* Mouth */}
      {expression === "excited" ? (
        <ellipse cx="17" cy="21" rx="3" ry="2" fill="hsl(var(--background))" />
      ) : (
        <path d="M13 20 Q17 24 21 20" stroke="hsl(var(--background))" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      )}
    </svg>
  );
}

/* ── Floating App Window ── */
function AppWindow({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-lg border border-border/60 bg-card/80 backdrop-blur-sm shadow-lg overflow-hidden ${className}`}
    >
      {/* Title bar */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted/50 border-b border-border/40">
        <span className="h-2 w-2 rounded-full bg-destructive/60" />
        <span className="h-2 w-2 rounded-full bg-yellow-500/60" />
        <span className="h-2 w-2 rounded-full bg-green-500/60" />
        <span className="ml-2 text-[8px] text-muted-foreground/60 font-mono">app.tsx</span>
      </div>
      <div className="p-2">
        {children}
      </div>
    </motion.div>
  );
}

/* ── Spark particle ── */
function Spark({ x, y, delay, color }: { x: number; y: number; delay: number; color: string }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: 3,
        height: 3,
        left: x,
        top: y,
        background: color,
        boxShadow: `0 0 6px ${color}`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0, 1.5, 1, 0],
        y: [0, -20, -35, -50],
        x: [0, (Math.random() - 0.5) * 30],
      }}
      transition={{
        delay,
        duration: 1.2,
        repeat: Infinity,
        repeatDelay: 2 + Math.random() * 3,
        ease: "easeOut",
      }}
    />
  );
}

/* ── Animated code lines ── */
function CodeLines() {
  const lines = [
    { width: "70%", color: "hsl(var(--primary))" },
    { width: "50%", color: "hsl(var(--secondary))" },
    { width: "85%", color: "hsl(var(--accent))" },
    { width: "40%", color: "hsl(var(--primary))" },
    { width: "65%", color: "hsl(var(--muted-foreground))" },
  ];
  return (
    <div className="space-y-1">
      {lines.map((line, i) => (
        <motion.div
          key={i}
          className="h-[3px] rounded-full"
          style={{ width: line.width, background: line.color, opacity: 0.5 }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ delay: i * 0.3, duration: 2, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

/* ── Tool animation (wrench/hammer) ── */
function AnimatedTool({ type, x, y }: { type: "wrench" | "hammer" | "brush"; x: number; y: number }) {
  const rotation = type === "hammer" ? { rotate: [0, -30, 0] } : type === "wrench" ? { rotate: [0, 20, -20, 0] } : { rotate: [0, 15, -10, 0] };
  const emoji = type === "hammer" ? "🔨" : type === "wrench" ? "🔧" : "🖌️";

  return (
    <motion.span
      className="absolute text-sm select-none pointer-events-none"
      style={{ left: x, top: y }}
      animate={rotation}
      transition={{ duration: type === "hammer" ? 0.6 : 1.2, repeat: Infinity, repeatDelay: 0.5, ease: "easeInOut" }}
    >
      {emoji}
    </motion.span>
  );
}

/* ── Main Workshop Scene ── */
export function GremlinWorkshop() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-50px" });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(interval);
  }, [isInView]);

  const statusMessages = [
    "Deploying CRM module…",
    "Optimizing dashboard layout…",
    "Building scheduler component…",
    "Running security scan…",
    "Generating API routes…",
    "Compiling your portal…",
  ];

  return (
    <section ref={ref} className="relative py-16 md:py-24 overflow-hidden">
      {/* Section heading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        className="text-center mb-12 md:mb-16 px-4"
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">Behind the scenes</p>
        <h2 className="text-2xl md:text-4xl font-black tracking-tight text-foreground">
          Gremlins build your app in real time
        </h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          A swarm of AI agents analyze, design, code, and deploy — all in under 90 seconds.
        </p>
      </motion.div>

      {/* Workshop scene */}
      <div className="relative max-w-3xl mx-auto px-4">
        {/* Glow behind the scene */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-primary/8 blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[200px] h-[200px] rounded-full bg-secondary/6 blur-[80px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[200px] h-[200px] rounded-full bg-accent/6 blur-[80px]" />
        </div>

        {/* Workbench */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          {/* The workshop table */}
          <div className="relative rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6 md:p-8">
            {/* Workbench surface line */}
            <div className="absolute bottom-[38%] left-0 right-0 h-px bg-border/30" />

            {/* ── Three Gremlin Stations ── */}
            <div className="grid grid-cols-3 gap-3 md:gap-6">

              {/* Station 1: Coder Gremlin */}
              <motion.div
                className="relative flex flex-col items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <AppWindow delay={0.5} className="w-full mb-3">
                  <CodeLines />
                </AppWindow>
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="relative"
                >
                  <Gremlin color="hsl(265 90% 62%)" size={44} expression="focused" />
                  <AnimatedTool type="wrench" x={36} y={8} />
                </motion.div>
                <p className="text-[9px] md:text-[10px] font-bold text-primary mt-1.5 tracking-wide">CODER</p>
              </motion.div>

              {/* Station 2: Designer Gremlin */}
              <motion.div
                className="relative flex flex-col items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <AppWindow delay={0.7} className="w-full mb-3">
                  {/* Mini UI mockup */}
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      <motion.div
                        className="h-6 rounded bg-primary/20 flex-1"
                        animate={{ backgroundColor: ["hsl(265 90% 62% / 0.2)", "hsl(320 95% 60% / 0.2)", "hsl(265 90% 62% / 0.2)"] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                      <div className="h-6 w-6 rounded bg-accent/20" />
                    </div>
                    <div className="flex gap-1">
                      <div className="h-3 rounded bg-muted flex-1" />
                      <div className="h-3 rounded bg-muted flex-1" />
                    </div>
                    <motion.div
                      className="h-4 rounded-md flex-1"
                      style={{ background: "var(--gradient-hero)" }}
                      animate={{ opacity: [0.4, 0.8, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                </AppWindow>
                <motion.div
                  animate={{ y: [0, -4, 0], rotate: [0, 2, -2, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="relative"
                >
                  <Gremlin color="hsl(320 95% 60%)" size={48} expression="excited" />
                  <AnimatedTool type="brush" x={40} y={6} />
                </motion.div>
                <p className="text-[9px] md:text-[10px] font-bold text-accent mt-1.5 tracking-wide">DESIGNER</p>

                {/* Sparks from the designer's work */}
                {[...Array(5)].map((_, i) => (
                  <Spark
                    key={i}
                    x={30 + i * 12}
                    y={50}
                    delay={i * 0.4}
                    color={i % 2 === 0 ? "hsl(320 95% 60%)" : "hsl(265 90% 62%)"}
                  />
                ))}
              </motion.div>

              {/* Station 3: Deployer Gremlin */}
              <motion.div
                className="relative flex flex-col items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.7, duration: 0.6 }}
              >
                <AppWindow delay={0.9} className="w-full mb-3">
                  {/* Deploy progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <motion.div
                        className="h-2 w-2 rounded-full bg-green-500"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      <span className="text-[7px] text-muted-foreground font-mono">deploying…</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: "var(--gradient-hero)" }}
                        animate={{ width: ["10%", "100%"] }}
                        transition={{ duration: 3, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
                      />
                    </div>
                    <div className="flex gap-0.5">
                      {["✓ Built", "✓ Tested", "⟳ Ship"].map((s, i) => (
                        <span key={i} className="text-[6px] text-muted-foreground/70 font-mono">{s}</span>
                      ))}
                    </div>
                  </div>
                </AppWindow>
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="relative"
                >
                  <Gremlin color="hsl(175 95% 50%)" size={42} expression="happy" />
                  <AnimatedTool type="hammer" x={34} y={10} />
                </motion.div>
                <p className="text-[9px] md:text-[10px] font-bold text-secondary mt-1.5 tracking-wide">DEPLOYER</p>
              </motion.div>
            </div>

            {/* ── Conveyor belt / status ticker ── */}
            <motion.div
              className="mt-6 rounded-lg border border-border/30 bg-muted/30 px-3 py-2 flex items-center gap-2 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <motion.div
                className="h-2 w-2 rounded-full bg-green-500 shrink-0"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <div className="overflow-hidden flex-1 h-4 relative">
                <motion.p
                  key={tick}
                  className="text-[10px] font-mono text-muted-foreground whitespace-nowrap absolute"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.4 }}
                >
                  {statusMessages[tick % statusMessages.length]}
                </motion.p>
              </div>
              <span className="text-[8px] text-primary font-bold shrink-0 tabular-nums">
                {(tick % 6) + 1}/6
              </span>
            </motion.div>

            {/* Floating tool icons around the scene */}
            {[
              { emoji: "⚡", x: "5%", y: "15%", delay: 0 },
              { emoji: "🧩", x: "92%", y: "20%", delay: 1 },
              { emoji: "📦", x: "88%", y: "70%", delay: 2 },
              { emoji: "🚀", x: "8%", y: "75%", delay: 1.5 },
            ].map((item, i) => (
              <motion.span
                key={i}
                className="absolute text-sm select-none pointer-events-none opacity-40"
                style={{ left: item.x, top: item.y }}
                animate={{
                  y: [0, -8, 0],
                  rotate: [0, 10, -10, 0],
                  opacity: [0.25, 0.5, 0.25],
                }}
                transition={{
                  delay: item.delay,
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {item.emoji}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
