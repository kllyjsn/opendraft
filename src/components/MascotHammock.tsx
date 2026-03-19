import { motion } from "framer-motion";
import mascotImg from "@/assets/gremlin-logo-advanced.png";

/**
 * Mascot chilling on a hammock — used in the footer.
 * Now uses the brand logo image instead of inline SVG.
 */
export function MascotHammock({ size = 200, className = "" }: { size?: number; className?: string }) {
  const s = size;
  const w = s * 1.8;

  return (
    <div className={`relative inline-flex items-end justify-center select-none ${className}`} style={{ width: w, height: s }}>
      <svg viewBox={`0 0 ${w} ${s}`} width={w} height={s} fill="none" xmlns="http://www.w3.org/2000/svg">

        {/* Left palm tree */}
        <line x1={w * 0.12} y1={s * 0.9} x2={w * 0.18} y2={s * 0.15} stroke="hsl(30 60% 35%)" strokeWidth={s * 0.04} strokeLinecap="round" />
        <path d={`M${w * 0.18} ${s * 0.15} Q${w * 0.05} ${s * 0.05} ${w * 0.0} ${s * 0.2}`} stroke="hsl(145 60% 40%)" strokeWidth={s * 0.025} strokeLinecap="round" fill="none" />
        <path d={`M${w * 0.18} ${s * 0.15} Q${w * 0.25} ${s * 0.0} ${w * 0.32} ${s * 0.12}`} stroke="hsl(145 55% 45%)" strokeWidth={s * 0.025} strokeLinecap="round" fill="none" />
        <path d={`M${w * 0.18} ${s * 0.15} Q${w * 0.08} ${s * 0.12} ${w * 0.02} ${s * 0.28}`} stroke="hsl(145 50% 35%)" strokeWidth={s * 0.02} strokeLinecap="round" fill="none" />

        {/* Right palm tree */}
        <line x1={w * 0.88} y1={s * 0.9} x2={w * 0.82} y2={s * 0.15} stroke="hsl(30 60% 35%)" strokeWidth={s * 0.04} strokeLinecap="round" />
        <path d={`M${w * 0.82} ${s * 0.15} Q${w * 0.95} ${s * 0.05} ${w} ${s * 0.2}`} stroke="hsl(145 60% 40%)" strokeWidth={s * 0.025} strokeLinecap="round" fill="none" />
        <path d={`M${w * 0.82} ${s * 0.15} Q${w * 0.75} ${s * 0.0} ${w * 0.68} ${s * 0.12}`} stroke="hsl(145 55% 45%)" strokeWidth={s * 0.025} strokeLinecap="round" fill="none" />
        <path d={`M${w * 0.82} ${s * 0.15} Q${w * 0.92} ${s * 0.12} ${w * 0.98} ${s * 0.28}`} stroke="hsl(145 50% 35%)" strokeWidth={s * 0.02} strokeLinecap="round" fill="none" />

        {/* Hammock ropes */}
        <line x1={w * 0.18} y1={s * 0.28} x2={w * 0.28} y2={s * 0.48} stroke="hsl(40 50% 55%)" strokeWidth={s * 0.012} />
        <line x1={w * 0.82} y1={s * 0.28} x2={w * 0.72} y2={s * 0.48} stroke="hsl(40 50% 55%)" strokeWidth={s * 0.012} />

        {/* Hammock body */}
        <path
          d={`M${w * 0.28} ${s * 0.48} Q${w * 0.5} ${s * 0.72} ${w * 0.72} ${s * 0.48}`}
          stroke="hsl(40 50% 55%)" strokeWidth={s * 0.025} strokeLinecap="round" fill="none"
        />
        <path
          d={`M${w * 0.3} ${s * 0.49} Q${w * 0.5} ${s * 0.7} ${w * 0.7} ${s * 0.49}`}
          fill="hsl(40 40% 70%)" opacity={0.3}
        />

        {/* Stars */}
        <circle cx={w * 0.08} cy={s * 0.1} r={2} fill="hsl(var(--foreground))" opacity={0.15} />
        <circle cx={w * 0.92} cy={s * 0.08} r={1.5} fill="hsl(var(--foreground))" opacity={0.12} />
        <circle cx={w * 0.6} cy={s * 0.05} r={1} fill="hsl(var(--foreground))" opacity={0.1} />

        {/* Ground */}
        <ellipse cx={w * 0.5} cy={s * 0.95} rx={w * 0.45} ry={s * 0.05} fill="hsl(var(--foreground))" opacity={0.05} />
      </svg>

      {/* Mascot image floating in the hammock */}
      <motion.img
        src={mascotImg}
        alt="Mascot in hammock"
        className="absolute drop-shadow-lg"
        style={{
          width: s * 0.4,
          height: s * 0.4,
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: s * 0.32,
        }}
        animate={{ y: [0, -4, 0], rotate: [-2, 2, -2] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
