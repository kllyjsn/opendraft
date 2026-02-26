import { motion } from "framer-motion";

const bounce = {
  y: [0, -12, 0],
  transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as const },
};

const blink = {
  scaleY: [1, 1, 0.1, 1, 1],
  transition: { duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] },
};

const wave = {
  rotate: [0, 15, -5, 10, 0],
  transition: { duration: 1.8, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" as const },
};

const tailWag = {
  rotate: [-10, 10, -10],
  transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" as const },
};

interface BrandMascotProps {
  size?: number;
  className?: string;
  variant?: "default" | "happy" | "wink" | "wave";
}

export function BrandMascot({ size = 120, className = "", variant = "default" }: BrandMascotProps) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const bodyR = s * 0.34;

  return (
    <motion.div
      className={`inline-flex items-center justify-center select-none ${className}`}
      animate={bounce}
      style={{ width: s, height: s }}
    >
      <svg
        viewBox={`0 0 ${s} ${s}`}
        width={s}
        height={s}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shadow */}
        <ellipse
          cx={cx}
          cy={s * 0.88}
          rx={bodyR * 0.7}
          ry={s * 0.04}
          fill="hsl(var(--foreground))"
          opacity={0.08}
        />

        {/* Tail */}
        <motion.g
          style={{ originX: `${cx + bodyR * 0.6}px`, originY: `${cy + bodyR * 0.3}px` }}
          animate={tailWag}
        >
          <path
            d={`M${cx + bodyR * 0.5} ${cy + bodyR * 0.2} Q${cx + bodyR * 1.1} ${cy - bodyR * 0.3} ${cx + bodyR * 0.9} ${cy - bodyR * 0.7}`}
            stroke="hsl(265 85% 58%)"
            strokeWidth={s * 0.05}
            strokeLinecap="round"
            fill="none"
          />
        </motion.g>

        {/* Body */}
        <circle cx={cx} cy={cy} r={bodyR} fill="hsl(265 85% 58%)" />

        {/* Belly */}
        <ellipse
          cx={cx}
          cy={cy + bodyR * 0.15}
          rx={bodyR * 0.55}
          ry={bodyR * 0.5}
          fill="hsl(265 85% 72%)"
          opacity={0.5}
        />

        {/* Left ear */}
        <ellipse
          cx={cx - bodyR * 0.55}
          cy={cy - bodyR * 0.75}
          rx={bodyR * 0.22}
          ry={bodyR * 0.35}
          fill="hsl(265 85% 58%)"
          transform={`rotate(-15 ${cx - bodyR * 0.55} ${cy - bodyR * 0.75})`}
        />
        <ellipse
          cx={cx - bodyR * 0.55}
          cy={cy - bodyR * 0.75}
          rx={bodyR * 0.12}
          ry={bodyR * 0.22}
          fill="hsl(330 90% 60%)"
          opacity={0.6}
          transform={`rotate(-15 ${cx - bodyR * 0.55} ${cy - bodyR * 0.75})`}
        />

        {/* Right ear */}
        <ellipse
          cx={cx + bodyR * 0.55}
          cy={cy - bodyR * 0.75}
          rx={bodyR * 0.22}
          ry={bodyR * 0.35}
          fill="hsl(265 85% 58%)"
          transform={`rotate(15 ${cx + bodyR * 0.55} ${cy - bodyR * 0.75})`}
        />
        <ellipse
          cx={cx + bodyR * 0.55}
          cy={cy - bodyR * 0.75}
          rx={bodyR * 0.12}
          ry={bodyR * 0.22}
          fill="hsl(330 90% 60%)"
          opacity={0.6}
          transform={`rotate(15 ${cx + bodyR * 0.55} ${cy - bodyR * 0.75})`}
        />

        {/* Left eye white */}
        <ellipse
          cx={cx - bodyR * 0.3}
          cy={cy - bodyR * 0.15}
          rx={bodyR * 0.22}
          ry={bodyR * 0.26}
          fill="white"
        />
        {/* Left pupil */}
        <motion.g animate={blink}>
          <circle
            cx={cx - bodyR * 0.25}
            cy={cy - bodyR * 0.1}
            r={bodyR * 0.12}
            fill="hsl(var(--foreground))"
          />
          {/* Left eye shine */}
          <circle
            cx={cx - bodyR * 0.2}
            cy={cy - bodyR * 0.18}
            r={bodyR * 0.045}
            fill="white"
          />
        </motion.g>

        {/* Right eye white */}
        <ellipse
          cx={cx + bodyR * 0.3}
          cy={cy - bodyR * 0.15}
          rx={bodyR * 0.22}
          ry={bodyR * 0.26}
          fill="white"
        />
        {/* Right pupil */}
        <motion.g animate={blink}>
          <circle
            cx={cx + bodyR * 0.35}
            cy={cy - bodyR * 0.1}
            r={bodyR * 0.12}
            fill="hsl(var(--foreground))"
          />
          <circle
            cx={cx + bodyR * 0.4}
            cy={cy - bodyR * 0.18}
            r={bodyR * 0.045}
            fill="white"
          />
        </motion.g>

        {/* Mouth - happy smile */}
        <path
          d={`M${cx - bodyR * 0.2} ${cy + bodyR * 0.2} Q${cx} ${cy + bodyR * 0.45} ${cx + bodyR * 0.2} ${cy + bodyR * 0.2}`}
          stroke="hsl(var(--foreground))"
          strokeWidth={s * 0.02}
          strokeLinecap="round"
          fill="none"
        />

        {/* Cheek blush left */}
        <circle
          cx={cx - bodyR * 0.5}
          cy={cy + bodyR * 0.1}
          r={bodyR * 0.1}
          fill="hsl(330 90% 60%)"
          opacity={0.35}
        />
        {/* Cheek blush right */}
        <circle
          cx={cx + bodyR * 0.5}
          cy={cy + bodyR * 0.1}
          r={bodyR * 0.1}
          fill="hsl(330 90% 60%)"
          opacity={0.35}
        />

        {/* Feet left */}
        <ellipse
          cx={cx - bodyR * 0.3}
          cy={cy + bodyR * 0.85}
          rx={bodyR * 0.18}
          ry={bodyR * 0.1}
          fill="hsl(265 70% 48%)"
        />
        {/* Feet right */}
        <ellipse
          cx={cx + bodyR * 0.3}
          cy={cy + bodyR * 0.85}
          rx={bodyR * 0.18}
          ry={bodyR * 0.1}
          fill="hsl(265 70% 48%)"
        />

        {/* Left arm / wave arm */}
        {variant === "wave" ? (
          <motion.g
            style={{ originX: `${cx - bodyR * 0.7}px`, originY: `${cy + bodyR * 0.05}px` }}
            animate={wave}
          >
            <ellipse
              cx={cx - bodyR * 0.85}
              cy={cy - bodyR * 0.2}
              rx={bodyR * 0.12}
              ry={bodyR * 0.2}
              fill="hsl(265 85% 58%)"
              transform={`rotate(30 ${cx - bodyR * 0.85} ${cy - bodyR * 0.2})`}
            />
          </motion.g>
        ) : (
          <ellipse
            cx={cx - bodyR * 0.8}
            cy={cy + bodyR * 0.15}
            rx={bodyR * 0.12}
            ry={bodyR * 0.18}
            fill="hsl(265 85% 58%)"
            transform={`rotate(-20 ${cx - bodyR * 0.8} ${cy + bodyR * 0.15})`}
          />
        )}

        {/* Right arm */}
        <ellipse
          cx={cx + bodyR * 0.8}
          cy={cy + bodyR * 0.15}
          rx={bodyR * 0.12}
          ry={bodyR * 0.18}
          fill="hsl(265 85% 58%)"
          transform={`rotate(20 ${cx + bodyR * 0.8} ${cy + bodyR * 0.15})`}
        />

        {/* Crown / antenna */}
        <circle
          cx={cx}
          cy={cy - bodyR * 1.05}
          r={bodyR * 0.08}
          fill="hsl(185 90% 45%)"
        />
        <line
          x1={cx}
          y1={cy - bodyR * 0.95}
          x2={cx}
          y2={cy - bodyR * 0.7}
          stroke="hsl(185 90% 45%)"
          strokeWidth={s * 0.02}
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  );
}
