import { motion } from "framer-motion";

/**
 * Mascot chilling on a hammock with a tropical drink — used in the footer.
 * Pure SVG, no external assets.
 */
export function MascotHammock({ size = 200, className = "" }: { size?: number; className?: string }) {
  const s = size;
  const w = s * 1.8; // wider than tall for hammock scene

  return (
    <div className={`inline-flex items-end justify-center select-none ${className}`} style={{ width: w, height: s }}>
      <svg viewBox={`0 0 ${w} ${s}`} width={w} height={s} fill="none" xmlns="http://www.w3.org/2000/svg">

        {/* Left palm tree */}
        <line x1={w * 0.12} y1={s * 0.9} x2={w * 0.18} y2={s * 0.15} stroke="hsl(30 60% 35%)" strokeWidth={s * 0.04} strokeLinecap="round" />
        {/* Left palm fronds */}
        <path d={`M${w * 0.18} ${s * 0.15} Q${w * 0.05} ${s * 0.05} ${w * 0.0} ${s * 0.2}`} stroke="hsl(145 60% 40%)" strokeWidth={s * 0.025} strokeLinecap="round" fill="none" />
        <path d={`M${w * 0.18} ${s * 0.15} Q${w * 0.25} ${s * 0.0} ${w * 0.32} ${s * 0.12}`} stroke="hsl(145 55% 45%)" strokeWidth={s * 0.025} strokeLinecap="round" fill="none" />
        <path d={`M${w * 0.18} ${s * 0.15} Q${w * 0.08} ${s * 0.12} ${w * 0.02} ${s * 0.28}`} stroke="hsl(145 50% 35%)" strokeWidth={s * 0.02} strokeLinecap="round" fill="none" />

        {/* Right palm tree */}
        <line x1={w * 0.88} y1={s * 0.9} x2={w * 0.82} y2={s * 0.15} stroke="hsl(30 60% 35%)" strokeWidth={s * 0.04} strokeLinecap="round" />
        {/* Right palm fronds */}
        <path d={`M${w * 0.82} ${s * 0.15} Q${w * 0.95} ${s * 0.05} ${w} ${s * 0.2}`} stroke="hsl(145 60% 40%)" strokeWidth={s * 0.025} strokeLinecap="round" fill="none" />
        <path d={`M${w * 0.82} ${s * 0.15} Q${w * 0.75} ${s * 0.0} ${w * 0.68} ${s * 0.12}`} stroke="hsl(145 55% 45%)" strokeWidth={s * 0.025} strokeLinecap="round" fill="none" />
        <path d={`M${w * 0.82} ${s * 0.15} Q${w * 0.92} ${s * 0.12} ${w * 0.98} ${s * 0.28}`} stroke="hsl(145 50% 35%)" strokeWidth={s * 0.02} strokeLinecap="round" fill="none" />

        {/* Hammock ropes */}
        <line x1={w * 0.18} y1={s * 0.28} x2={w * 0.28} y2={s * 0.48} stroke="hsl(40 50% 55%)" strokeWidth={s * 0.012} />
        <line x1={w * 0.82} y1={s * 0.28} x2={w * 0.72} y2={s * 0.48} stroke="hsl(40 50% 55%)" strokeWidth={s * 0.012} />

        {/* Hammock curve */}
        <path
          d={`M${w * 0.28} ${s * 0.48} Q${w * 0.5} ${s * 0.72} ${w * 0.72} ${s * 0.48}`}
          stroke="hsl(40 50% 55%)" strokeWidth={s * 0.018} fill="none" strokeLinecap="round"
        />
        {/* Hammock netting fill */}
        <path
          d={`M${w * 0.28} ${s * 0.48} Q${w * 0.5} ${s * 0.72} ${w * 0.72} ${s * 0.48}`}
          fill="hsl(40 40% 50%)" opacity={0.15}
        />
        {/* Hammock net lines */}
        {[0.35, 0.42, 0.5, 0.58, 0.65].map((xf, i) => (
          <line key={i}
            x1={w * xf} y1={s * 0.47}
            x2={w * xf} y2={s * (0.52 + Math.sin((xf - 0.28) / 0.44 * Math.PI) * 0.15)}
            stroke="hsl(40 50% 55%)" strokeWidth={s * 0.006} opacity={0.5}
          />
        ))}

        {/* ── Mascot lying in hammock ── */}
        <motion.g
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" as const }}
        >
          {/* Body (slightly tilted, lounging) */}
          <g transform={`translate(${w * 0.5}, ${s * 0.52}) rotate(-8)`}>
            {/* Main body */}
            <circle cx={0} cy={0} r={s * 0.14} fill="hsl(265 85% 58%)" />
            {/* Belly */}
            <ellipse cx={0} cy={s * 0.02} rx={s * 0.08} ry={s * 0.07} fill="hsl(265 85% 72%)" opacity={0.5} />

            {/* Left ear */}
            <ellipse cx={-s * 0.08} cy={-s * 0.11} rx={s * 0.03} ry={s * 0.05} fill="hsl(265 85% 58%)" transform="rotate(-20)" />
            <ellipse cx={-s * 0.08} cy={-s * 0.11} rx={s * 0.015} ry={s * 0.03} fill="hsl(330 90% 60%)" opacity={0.6} transform="rotate(-20)" />
            {/* Right ear */}
            <ellipse cx={s * 0.08} cy={-s * 0.11} rx={s * 0.03} ry={s * 0.05} fill="hsl(265 85% 58%)" transform="rotate(20)" />
            <ellipse cx={s * 0.08} cy={-s * 0.11} rx={s * 0.015} ry={s * 0.03} fill="hsl(330 90% 60%)" opacity={0.6} transform="rotate(20)" />

            {/* Eyes — happy/closed (relaxed) */}
            <path d={`M${-s * 0.06} ${-s * 0.025} Q${-s * 0.04} ${-s * 0.055} ${-s * 0.02} ${-s * 0.025}`} stroke="hsl(var(--foreground))" strokeWidth={s * 0.012} strokeLinecap="round" fill="none" />
            <path d={`M${s * 0.02} ${-s * 0.025} Q${s * 0.04} ${-s * 0.055} ${s * 0.06} ${-s * 0.025}`} stroke="hsl(var(--foreground))" strokeWidth={s * 0.012} strokeLinecap="round" fill="none" />

            {/* Happy smile */}
            <path d={`M${-s * 0.03} ${s * 0.04} Q${0} ${s * 0.07} ${s * 0.03} ${s * 0.04}`} stroke="hsl(var(--foreground))" strokeWidth={s * 0.01} strokeLinecap="round" fill="none" />

            {/* Cheeks */}
            <circle cx={-s * 0.08} cy={s * 0.01} r={s * 0.015} fill="hsl(330 90% 60%)" opacity={0.35} />
            <circle cx={s * 0.08} cy={s * 0.01} r={s * 0.015} fill="hsl(330 90% 60%)" opacity={0.35} />

            {/* Antenna */}
            <line x1={0} y1={-s * 0.13} x2={0} y2={-s * 0.17} stroke="hsl(185 90% 45%)" strokeWidth={s * 0.01} strokeLinecap="round" />
            <circle cx={0} cy={-s * 0.18} r={s * 0.015} fill="hsl(185 90% 45%)" />

            {/* Feet dangling */}
            <ellipse cx={-s * 0.04} cy={s * 0.13} rx={s * 0.025} ry={s * 0.015} fill="hsl(265 70% 48%)" />
            <ellipse cx={s * 0.04} cy={s * 0.13} rx={s * 0.025} ry={s * 0.015} fill="hsl(265 70% 48%)" />

            {/* Right arm holding drink */}
            <ellipse cx={s * 0.13} cy={-s * 0.02} rx={s * 0.02} ry={s * 0.025} fill="hsl(265 85% 58%)" transform="rotate(15)" />
          </g>

          {/* ── Tropical drink ── */}
          <g transform={`translate(${w * 0.57}, ${s * 0.42})`}>
            {/* Glass */}
            <path d={`M${-s * 0.025} ${0} L${-s * 0.015} ${s * 0.06} L${s * 0.015} ${s * 0.06} L${s * 0.025} ${0} Z`} fill="hsl(185 80% 55%)" opacity={0.7} />
            {/* Drink liquid */}
            <path d={`M${-s * 0.022} ${s * 0.01} L${-s * 0.015} ${s * 0.06} L${s * 0.015} ${s * 0.06} L${s * 0.022} ${s * 0.01} Z`} fill="hsl(25 95% 55%)" opacity={0.6} />
            {/* Straw */}
            <line x1={s * 0.01} y1={-s * 0.03} x2={s * 0.005} y2={s * 0.04} stroke="hsl(330 90% 60%)" strokeWidth={s * 0.006} strokeLinecap="round" />
            {/* Umbrella */}
            <path d={`M${s * 0.01} ${-s * 0.03} L${s * 0.035} ${-s * 0.015} L${-s * 0.015} ${-s * 0.015} Z`} fill="hsl(50 90% 55%)" />
            <line x1={s * 0.01} y1={-s * 0.03} x2={s * 0.01} y2={-s * 0.015} stroke="hsl(30 50% 40%)" strokeWidth={s * 0.004} />
          </g>
        </motion.g>

      </svg>
    </div>
  );
}
