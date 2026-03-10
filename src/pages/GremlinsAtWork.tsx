import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

// ═══════════════════════════════════════════════════════════════
// SVG Gremlin Component — each one does a different task
// ═══════════════════════════════════════════════════════════════

interface GremlinWorkerProps {
  x: number;
  y: number;
  color: string;
  task: string;
  delay: number;
  size?: number;
}

function GremlinWorker({ x, y, color, task, delay, size = 60 }: GremlinWorkerProps) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const bodyR = s * 0.34;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", damping: 12 }}
    >
      <motion.g
        transform={`translate(${x}, ${y})`}
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 1.5 + delay * 0.3, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Shadow */}
        <ellipse cx={cx} cy={s * 0.92} rx={bodyR * 0.6} ry={s * 0.03} fill="rgba(0,0,0,0.15)" />

        {/* Body */}
        <circle cx={cx} cy={cy} r={bodyR} fill={color} />
        <ellipse cx={cx} cy={cy + bodyR * 0.15} rx={bodyR * 0.55} ry={bodyR * 0.5} fill="white" opacity={0.15} />

        {/* Eyes */}
        <ellipse cx={cx - bodyR * 0.25} cy={cy - bodyR * 0.15} rx={bodyR * 0.18} ry={bodyR * 0.22} fill="white" />
        <ellipse cx={cx + bodyR * 0.25} cy={cy - bodyR * 0.15} rx={bodyR * 0.18} ry={bodyR * 0.22} fill="white" />

        {/* Pupils — animated to look around */}
        <motion.circle
          cx={cx - bodyR * 0.25}
          cy={cy - bodyR * 0.15}
          r={bodyR * 0.1}
          fill="#1a1a2e"
          animate={{ cx: [cx - bodyR * 0.28, cx - bodyR * 0.22, cx - bodyR * 0.25] }}
          transition={{ duration: 2 + delay, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          cx={cx + bodyR * 0.25}
          cy={cy - bodyR * 0.15}
          r={bodyR * 0.1}
          fill="#1a1a2e"
          animate={{ cx: [cx + bodyR * 0.22, cx + bodyR * 0.28, cx + bodyR * 0.25] }}
          transition={{ duration: 2 + delay, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Pupil highlights */}
        <circle cx={cx - bodyR * 0.22} cy={cy - bodyR * 0.2} r={bodyR * 0.04} fill="white" />
        <circle cx={cx + bodyR * 0.28} cy={cy - bodyR * 0.2} r={bodyR * 0.04} fill="white" />

        {/* Smile */}
        <path
          d={`M${cx - bodyR * 0.15} ${cy + bodyR * 0.2} Q${cx} ${cy + bodyR * 0.38} ${cx + bodyR * 0.15} ${cy + bodyR * 0.2}`}
          stroke="#1a1a2e" strokeWidth={s * 0.02} strokeLinecap="round" fill="none"
        />

        {/* Ears */}
        <ellipse cx={cx - bodyR * 0.5} cy={cy - bodyR * 0.7} rx={bodyR * 0.18} ry={bodyR * 0.3} fill={color} transform={`rotate(-15 ${cx - bodyR * 0.5} ${cy - bodyR * 0.7})`} />
        <ellipse cx={cx + bodyR * 0.5} cy={cy - bodyR * 0.7} rx={bodyR * 0.18} ry={bodyR * 0.3} fill={color} transform={`rotate(15 ${cx + bodyR * 0.5} ${cy - bodyR * 0.7})`} />
        <ellipse cx={cx - bodyR * 0.5} cy={cy - bodyR * 0.7} rx={bodyR * 0.1} ry={bodyR * 0.18} fill="hsl(330 90% 60%)" opacity={0.5} transform={`rotate(-15 ${cx - bodyR * 0.5} ${cy - bodyR * 0.7})`} />
        <ellipse cx={cx + bodyR * 0.5} cy={cy - bodyR * 0.7} rx={bodyR * 0.1} ry={bodyR * 0.18} fill="hsl(330 90% 60%)" opacity={0.5} transform={`rotate(15 ${cx + bodyR * 0.5} ${cy - bodyR * 0.7})`} />

        {/* Antenna */}
        <line x1={cx} y1={cy - bodyR * 0.95} x2={cx} y2={cy - bodyR * 0.7} stroke="hsl(185 90% 45%)" strokeWidth={s * 0.02} strokeLinecap="round" />
        <motion.circle
          cx={cx} cy={cy - bodyR * 1.05} r={bodyR * 0.07}
          fill="hsl(185 90% 45%)"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: delay * 0.5 }}
        />

        {/* Feet */}
        <ellipse cx={cx - bodyR * 0.25} cy={cy + bodyR * 0.82} rx={bodyR * 0.15} ry={bodyR * 0.08} fill={color} filter="brightness(0.85)" />
        <ellipse cx={cx + bodyR * 0.25} cy={cy + bodyR * 0.82} rx={bodyR * 0.15} ry={bodyR * 0.08} fill={color} filter="brightness(0.85)" />

        {/* Arms — animated working motion */}
        <motion.ellipse
          cx={cx - bodyR * 0.75} cy={cy + bodyR * 0.1}
          rx={bodyR * 0.1} ry={bodyR * 0.16}
          fill={color}
          animate={{ rotate: [-20, -35, -20] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay }}
          style={{ originX: `${cx - bodyR * 0.6}px`, originY: `${cy}px` }}
        />
        <motion.ellipse
          cx={cx + bodyR * 0.75} cy={cy + bodyR * 0.1}
          rx={bodyR * 0.1} ry={bodyR * 0.16}
          fill={color}
          animate={{ rotate: [20, 35, 20] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: delay + 0.4 }}
          style={{ originX: `${cx + bodyR * 0.6}px`, originY: `${cy}px` }}
        />

        {/* Cheeks */}
        <circle cx={cx - bodyR * 0.45} cy={cy + bodyR * 0.08} r={bodyR * 0.08} fill="hsl(330 90% 60%)" opacity={0.3} />
        <circle cx={cx + bodyR * 0.45} cy={cy + bodyR * 0.08} r={bodyR * 0.08} fill="hsl(330 90% 60%)" opacity={0.3} />
      </motion.g>

      {/* Task label */}
      <motion.text
        x={x + cx}
        y={y + s + 14}
        textAnchor="middle"
        fill="hsl(var(--muted-foreground))"
        fontSize="10"
        fontWeight="600"
        fontFamily="system-ui"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.5 }}
      >
        {task}
      </motion.text>
    </motion.g>
  );
}

// ═══════════════════════════════════════════════════════════════
// Floating particles / sparkles
// ═══════════════════════════════════════════════════════════════
function Particles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 800,
    y: Math.random() * 500,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 3,
    duration: Math.random() * 3 + 2,
  }));

  return (
    <>
      {particles.map((p) => (
        <motion.circle
          key={p.id}
          cx={p.x}
          cy={p.y}
          r={p.size}
          fill="hsl(265 85% 58%)"
          opacity={0.15}
          animate={{
            y: [p.y, p.y - 30, p.y],
            opacity: [0.05, 0.25, 0.05],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// Activity log ticker
// ═══════════════════════════════════════════════════════════════
const LOG_MESSAGES = [
  "🔍 SEO Gremlin optimized meta tags on 3 listings",
  "🛡️ Security Gremlin patched XSS vulnerability",
  "📸 Screenshot Gremlin regenerated 12 previews",
  "🏥 Doctor Gremlin healed a broken deploy",
  "🤖 QA Gremlin tested 47 app endpoints",
  "📊 Analytics Gremlin processed daily metrics",
  "💌 Outreach Gremlin drafted 8 personalized emails",
  "🔄 Sync Gremlin updated 5 listing descriptions",
  "🎯 Product Gremlin identified 3 trending categories",
  "🐛 Bug Gremlin squashed a race condition at 3:47 AM",
  "⚡ Deploy Gremlin pushed hotfix to production",
  "🔐 Auth Gremlin rotated API keys",
  "📈 Growth Gremlin analyzed conversion funnels",
  "🧹 Cleanup Gremlin archived 6 stale listings",
  "🌐 CDN Gremlin optimized asset delivery",
  "🔔 Notification Gremlin sent 15 welcome emails",
];

function ActivityTicker() {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    // Add initial messages
    const initial = LOG_MESSAGES.slice(0, 3);
    setMessages(initial);

    const interval = setInterval(() => {
      setMessages((prev) => {
        const available = LOG_MESSAGES.filter((m) => !prev.includes(m));
        const next = available.length > 0
          ? available[Math.floor(Math.random() * available.length)]
          : LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
        return [next, ...prev.slice(0, 5)];
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-1.5 max-h-[180px] overflow-hidden">
      <AnimatePresence mode="popLayout">
        {messages.map((msg, i) => (
          <motion.div
            key={msg + i}
            initial={{ opacity: 0, x: -20, height: 0 }}
            animate={{ opacity: 1 - i * 0.15, x: 0, height: "auto" }}
            exit={{ opacity: 0, x: 20, height: 0 }}
            transition={{ duration: 0.3 }}
            className="text-xs font-mono text-muted-foreground bg-muted/30 rounded-lg px-3 py-1.5 border border-border/30"
          >
            {msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main page
// ═══════════════════════════════════════════════════════════════

const GREMLIN_WORKERS = [
  { x: 40, y: 100, color: "hsl(265 85% 58%)", task: "SEO Gremlin", delay: 0 },
  { x: 160, y: 60, color: "hsl(185 90% 45%)", task: "Security Gremlin", delay: 0.2 },
  { x: 280, y: 110, color: "hsl(330 90% 55%)", task: "QA Gremlin", delay: 0.4 },
  { x: 400, y: 50, color: "hsl(145 70% 45%)", task: "Deploy Gremlin", delay: 0.6 },
  { x: 520, y: 100, color: "hsl(35 95% 55%)", task: "Screenshot Gremlin", delay: 0.8 },
  { x: 640, y: 70, color: "hsl(265 60% 70%)", task: "Outreach Gremlin", delay: 1.0 },
];

// Conveyor belt items flowing between gremlins
function ConveyorBelt() {
  return (
    <>
      {/* Belt line */}
      <line x1="60" y1="200" x2="700" y2="200" stroke="hsl(var(--border))" strokeWidth="2" strokeDasharray="8 4" />

      {/* Moving items */}
      {[0, 1, 2, 3].map((i) => (
        <motion.g key={i}>
          <motion.rect
            x={0}
            y={192}
            width={16}
            height={16}
            rx={3}
            fill="hsl(265 85% 58%)"
            opacity={0.6}
            animate={{ x: [60 + i * 160, 700] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              delay: i * 1.5,
              ease: "linear",
            }}
          />
          <motion.text
            x={8}
            y={204}
            textAnchor="middle"
            fontSize="10"
            fill="white"
            animate={{ x: [68 + i * 160, 708] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              delay: i * 1.5,
              ease: "linear",
            }}
          >
            {["📦", "🔧", "✅", "🚀"][i]}
          </motion.text>
        </motion.g>
      ))}
    </>
  );
}

// Status dashboard floating above
function StatusDashboard() {
  const [uptime, setUptime] = useState(99.97);
  const [tasksCompleted, setTasksCompleted] = useState(12847);

  useEffect(() => {
    const interval = setInterval(() => {
      setTasksCompleted((n) => n + Math.floor(Math.random() * 3) + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {[
        { label: "Uptime", value: `${uptime}%`, color: "text-green-400" },
        { label: "Tasks Today", value: tasksCompleted.toLocaleString(), color: "text-primary" },
        { label: "Bugs Squashed", value: "∞", color: "text-pink-400" },
      ].map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + i * 0.15 }}
          className="rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm p-3 text-center"
        >
          <div className={`text-xl font-black tabular-nums ${stat.color}`}>{stat.value}</div>
          <div className="text-[10px] text-muted-foreground font-medium">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );
}

export default function GremlinsAtWork() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-3xl">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-6 text-muted-foreground hover:text-foreground gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ rotate: [0, 2, -2, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="text-5xl mb-3"
          >
            🔧
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
            Gremlins at Work
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Right now, 14 AI gremlins are maintaining, optimizing, and protecting every app on OpenDraft. Here's a peek behind the curtain.
          </p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1"
          >
            <motion.div
              className="h-2 w-2 rounded-full bg-green-500"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-xs font-bold text-green-500">ALL SYSTEMS OPERATIONAL</span>
          </motion.div>
        </motion.div>

        {/* Stats */}
        <StatusDashboard />

        {/* Main animation scene */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="rounded-2xl border border-border/30 bg-card/30 backdrop-blur-sm p-4 mb-6 overflow-hidden"
        >
          <svg
            viewBox="0 0 760 260"
            className="w-full h-auto"
            style={{ minHeight: 200 }}
          >
            <Particles />
            <ConveyorBelt />
            {GREMLIN_WORKERS.map((g) => (
              <GremlinWorker key={g.task} {...g} />
            ))}
          </svg>
        </motion.div>

        {/* Live activity feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="rounded-2xl border border-border/30 bg-card/30 backdrop-blur-sm p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <motion.div
              className="h-2 w-2 rounded-full bg-primary"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Live Activity Feed</span>
          </div>
          <ActivityTicker />
        </motion.div>

        {/* Easter egg footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="text-center text-[10px] text-muted-foreground/40 mt-8 font-mono"
        >
          🥚 You found the easter egg. The gremlins appreciate your curiosity.
        </motion.p>
      </div>
    </div>
  );
}
