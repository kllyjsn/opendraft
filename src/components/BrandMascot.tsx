import { motion } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";

const bounce = {
  y: [0, -12, 0],
  transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as const },
};

const sadBounce = {
  y: [0, -4, 0],
  transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const },
};

const thinkingBob = {
  rotate: [-3, 3, -3],
  transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" as const },
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

const sadTailDroop = {
  rotate: [5, 8, 5],
  transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const },
};

const thinkingPulse = {
  opacity: [0, 1, 0],
  y: [-2, -8, -2],
  transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" as const },
};

interface BrandMascotProps {
  size?: number;
  className?: string;
  variant?: "default" | "happy" | "wink" | "wave" | "confused" | "thinking";
}

export function BrandMascot({ size = 120, className = "", variant = "default" }: BrandMascotProps) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const bodyR = s * 0.34;
  const maxPupilShift = bodyR * 0.08;

  const ref = useRef<HTMLDivElement>(null);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });

  const isConfused = variant === "confused";
  const isThinking = variant === "thinking";

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isConfused || isThinking) return; // no tracking for these variants
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const elCx = rect.left + rect.width / 2;
    const elCy = rect.top + rect.height / 2;
    const dx = e.clientX - elCx;
    const dy = e.clientY - elCy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;
    const clamp = Math.min(dist / 200, 1);
    setPupilOffset({
      x: (dx / dist) * maxPupilShift * clamp,
      y: (dy / dist) * maxPupilShift * clamp,
    });
  }, [maxPupilShift, isConfused, isThinking]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  // Eye centers
  const leftEyeCx = cx - bodyR * 0.3;
  const leftEyeCy = cy - bodyR * 0.15;
  const rightEyeCx = cx + bodyR * 0.3;
  const rightEyeCy = cy - bodyR * 0.15;

  // Pupil positions — confused eyes look up/sideways, thinking looks up
  const leftPupilCx = isConfused ? leftEyeCx - bodyR * 0.04 : isThinking ? leftEyeCx : leftEyeCx + pupilOffset.x;
  const leftPupilCy = isConfused ? leftEyeCy - bodyR * 0.04 : isThinking ? leftEyeCy - bodyR * 0.06 : leftEyeCy + pupilOffset.y;
  const rightPupilCx = isConfused ? rightEyeCx + bodyR * 0.05 : isThinking ? rightEyeCx : rightEyeCx + pupilOffset.x;
  const rightPupilCy = isConfused ? rightEyeCy + bodyR * 0.02 : isThinking ? rightEyeCy - bodyR * 0.06 : rightEyeCy + pupilOffset.y;

  // Choose body animation
  const bodyAnim = isConfused ? sadBounce : isThinking ? thinkingBob : bounce;
  const tailAnim = isConfused ? sadTailDroop : tailWag;

  // Mouth path
  const getMouth = () => {
    if (isConfused) {
      // Sad/confused frown
      return (
        <path
          d={`M${cx - bodyR * 0.15} ${cy + bodyR * 0.32} Q${cx} ${cy + bodyR * 0.18} ${cx + bodyR * 0.15} ${cy + bodyR * 0.32}`}
          stroke="hsl(var(--foreground))" strokeWidth={s * 0.02} strokeLinecap="round" fill="none"
        />
      );
    }
    if (isThinking) {
      // Small "o" mouth
      return (
        <ellipse
          cx={cx}
          cy={cy + bodyR * 0.28}
          rx={bodyR * 0.08}
          ry={bodyR * 0.1}
          fill="hsl(var(--foreground))"
          opacity={0.8}
        />
      );
    }
    // Default happy smile
    return (
      <path
        d={`M${cx - bodyR * 0.2} ${cy + bodyR * 0.2} Q${cx} ${cy + bodyR * 0.45} ${cx + bodyR * 0.2} ${cy + bodyR * 0.2}`}
        stroke="hsl(var(--foreground))" strokeWidth={s * 0.02} strokeLinecap="round" fill="none"
      />
    );
  };

  // Eyebrow for confused variant
  const getEyebrows = () => {
    if (!isConfused) return null;
    return (
      <>
        {/* Worried/confused eyebrows */}
        <line
          x1={leftEyeCx - bodyR * 0.15} y1={leftEyeCy - bodyR * 0.3}
          x2={leftEyeCx + bodyR * 0.12} y2={leftEyeCy - bodyR * 0.22}
          stroke="hsl(var(--foreground))" strokeWidth={s * 0.02} strokeLinecap="round"
        />
        <line
          x1={rightEyeCx - bodyR * 0.12} y1={rightEyeCy - bodyR * 0.22}
          x2={rightEyeCx + bodyR * 0.15} y2={rightEyeCy - bodyR * 0.3}
          stroke="hsl(var(--foreground))" strokeWidth={s * 0.02} strokeLinecap="round"
        />
      </>
    );
  };

  // Thinking bubbles
  const getThinkingBubbles = () => {
    if (!isThinking) return null;
    return (
      <>
        <motion.circle
          cx={cx + bodyR * 0.6} cy={cy - bodyR * 0.7} r={bodyR * 0.06}
          fill="hsl(var(--muted-foreground))" opacity={0.4}
          animate={thinkingPulse}
        />
        <motion.circle
          cx={cx + bodyR * 0.8} cy={cy - bodyR * 0.95} r={bodyR * 0.09}
          fill="hsl(var(--muted-foreground))" opacity={0.3}
          animate={{ ...thinkingPulse, transition: { ...thinkingPulse.transition, delay: 0.3 } }}
        />
        <motion.circle
          cx={cx + bodyR * 0.95} cy={cy - bodyR * 1.2} r={bodyR * 0.12}
          fill="hsl(var(--muted-foreground))" opacity={0.2}
          animate={{ ...thinkingPulse, transition: { ...thinkingPulse.transition, delay: 0.6 } }}
        />
      </>
    );
  };

  // Sweat drop for confused
  const getSweatDrop = () => {
    if (!isConfused) return null;
    return (
      <motion.g
        animate={{ opacity: [0, 0.6, 0], y: [0, 4, 8] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5 }}
      >
        <path
          d={`M${cx + bodyR * 0.55} ${cy - bodyR * 0.45} Q${cx + bodyR * 0.6} ${cy - bodyR * 0.3} ${cx + bodyR * 0.5} ${cy - bodyR * 0.25}`}
          fill="hsl(185 90% 65%)" opacity={0.7}
        />
      </motion.g>
    );
  };

  return (
    <motion.div
      ref={ref}
      className={`inline-flex items-center justify-center select-none ${className}`}
      animate={bodyAnim}
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
        <ellipse cx={cx} cy={s * 0.88} rx={bodyR * 0.7} ry={s * 0.04} fill="hsl(var(--foreground))" opacity={0.08} />

        {/* Tail */}
        <motion.g style={{ originX: `${cx + bodyR * 0.6}px`, originY: `${cy + bodyR * 0.3}px` }} animate={tailAnim}>
          <path
            d={`M${cx + bodyR * 0.5} ${cy + bodyR * 0.2} Q${cx + bodyR * 1.1} ${cy - bodyR * 0.3} ${cx + bodyR * 0.9} ${cy - bodyR * 0.7}`}
            stroke="hsl(265 85% 58%)" strokeWidth={s * 0.05} strokeLinecap="round" fill="none"
          />
        </motion.g>

        {/* Body */}
        <circle cx={cx} cy={cy} r={bodyR} fill="hsl(265 85% 58%)" />

        {/* Belly */}
        <ellipse cx={cx} cy={cy + bodyR * 0.15} rx={bodyR * 0.55} ry={bodyR * 0.5} fill="hsl(265 85% 72%)" opacity={0.5} />

        {/* Left ear — droopy if confused */}
        <ellipse
          cx={cx - bodyR * 0.55} cy={cy - bodyR * 0.75}
          rx={bodyR * 0.22} ry={bodyR * 0.35}
          fill="hsl(265 85% 58%)"
          transform={`rotate(${isConfused ? -30 : -15} ${cx - bodyR * 0.55} ${cy - bodyR * 0.75})`}
        />
        <ellipse
          cx={cx - bodyR * 0.55} cy={cy - bodyR * 0.75}
          rx={bodyR * 0.12} ry={bodyR * 0.22}
          fill="hsl(330 90% 60%)" opacity={0.6}
          transform={`rotate(${isConfused ? -30 : -15} ${cx - bodyR * 0.55} ${cy - bodyR * 0.75})`}
        />

        {/* Right ear — droopy if confused */}
        <ellipse
          cx={cx + bodyR * 0.55} cy={cy - bodyR * 0.75}
          rx={bodyR * 0.22} ry={bodyR * 0.35}
          fill="hsl(265 85% 58%)"
          transform={`rotate(${isConfused ? 30 : 15} ${cx + bodyR * 0.55} ${cy - bodyR * 0.75})`}
        />
        <ellipse
          cx={cx + bodyR * 0.55} cy={cy - bodyR * 0.75}
          rx={bodyR * 0.12} ry={bodyR * 0.22}
          fill="hsl(330 90% 60%)" opacity={0.6}
          transform={`rotate(${isConfused ? 30 : 15} ${cx + bodyR * 0.55} ${cy - bodyR * 0.75})`}
        />

        {/* Eyebrows (confused only) */}
        {getEyebrows()}

        {/* Left eye white */}
        <ellipse cx={leftEyeCx} cy={leftEyeCy} rx={bodyR * 0.22} ry={bodyR * 0.26} fill="white" />
        {/* Left pupil */}
        <motion.g animate={isThinking ? undefined : blink}>
          <circle cx={leftPupilCx} cy={leftPupilCy} r={bodyR * 0.12} fill="hsl(var(--foreground))" />
          <circle cx={leftPupilCx + bodyR * 0.04} cy={leftPupilCy - bodyR * 0.07} r={bodyR * 0.045} fill="white" />
        </motion.g>

        {/* Right eye white */}
        <ellipse cx={rightEyeCx} cy={rightEyeCy} rx={bodyR * 0.22} ry={bodyR * 0.26} fill="white" />
        {/* Right pupil */}
        <motion.g animate={isThinking ? undefined : blink}>
          <circle cx={rightPupilCx} cy={rightPupilCy} r={bodyR * 0.12} fill="hsl(var(--foreground))" />
          <circle cx={rightPupilCx + bodyR * 0.04} cy={rightPupilCy - bodyR * 0.07} r={bodyR * 0.045} fill="white" />
        </motion.g>

        {/* Mouth */}
        {getMouth()}

        {/* Cheek blush — reduced for confused */}
        <circle cx={cx - bodyR * 0.5} cy={cy + bodyR * 0.1} r={bodyR * 0.1} fill="hsl(330 90% 60%)" opacity={isConfused ? 0.2 : 0.35} />
        <circle cx={cx + bodyR * 0.5} cy={cy + bodyR * 0.1} r={bodyR * 0.1} fill="hsl(330 90% 60%)" opacity={isConfused ? 0.2 : 0.35} />

        {/* Feet */}
        <ellipse cx={cx - bodyR * 0.3} cy={cy + bodyR * 0.85} rx={bodyR * 0.18} ry={bodyR * 0.1} fill="hsl(265 70% 48%)" />
        <ellipse cx={cx + bodyR * 0.3} cy={cy + bodyR * 0.85} rx={bodyR * 0.18} ry={bodyR * 0.1} fill="hsl(265 70% 48%)" />

        {/* Left arm / wave arm */}
        {variant === "wave" ? (
          <motion.g style={{ originX: `${cx - bodyR * 0.7}px`, originY: `${cy + bodyR * 0.05}px` }} animate={wave}>
            <ellipse cx={cx - bodyR * 0.85} cy={cy - bodyR * 0.2} rx={bodyR * 0.12} ry={bodyR * 0.2} fill="hsl(265 85% 58%)" transform={`rotate(30 ${cx - bodyR * 0.85} ${cy - bodyR * 0.2})`} />
          </motion.g>
        ) : (
          <ellipse cx={cx - bodyR * 0.8} cy={cy + bodyR * 0.15} rx={bodyR * 0.12} ry={bodyR * 0.18} fill="hsl(265 85% 58%)" transform={`rotate(-20 ${cx - bodyR * 0.8} ${cy + bodyR * 0.15})`} />
        )}

        {/* Right arm */}
        <ellipse cx={cx + bodyR * 0.8} cy={cy + bodyR * 0.15} rx={bodyR * 0.12} ry={bodyR * 0.18} fill="hsl(265 85% 58%)" transform={`rotate(20 ${cx + bodyR * 0.8} ${cy + bodyR * 0.15})`} />

        {/* Antenna */}
        <circle cx={cx} cy={cy - bodyR * 1.05} r={bodyR * 0.08} fill="hsl(185 90% 45%)" />
        <line x1={cx} y1={cy - bodyR * 0.95} x2={cx} y2={cy - bodyR * 0.7} stroke="hsl(185 90% 45%)" strokeWidth={s * 0.02} strokeLinecap="round" />

        {/* Sweat drop (confused) */}
        {getSweatDrop()}

        {/* Thinking bubbles */}
        {getThinkingBubbles()}
      </svg>
    </motion.div>
  );
}
