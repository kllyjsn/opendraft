import { motion } from "framer-motion";
import mascotImg from "@/assets/gremlin-logo-advanced.png";

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

const waveBounce = {
  y: [0, -8, 0],
  rotate: [0, -3, 0],
  transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" as const },
};

interface BrandMascotProps {
  size?: number;
  className?: string;
  variant?: "default" | "happy" | "wink" | "wave" | "confused" | "thinking";
}

export function BrandMascot({ size = 120, className = "", variant = "default" }: BrandMascotProps) {
  const anim =
    variant === "confused" ? sadBounce
    : variant === "thinking" ? thinkingBob
    : variant === "wave" ? waveBounce
    : bounce;

  return (
    <motion.div
      className={`inline-flex items-center justify-center select-none ${className}`}
      animate={anim}
      style={{ width: size, height: size }}
    >
      <img
        src={mascotImg}
        alt="OpenDraft mascot"
        width={size}
        height={size}
        className="object-contain drop-shadow-lg"
        style={{
          filter: variant === "confused" ? "saturate(0.6) brightness(0.85)" : undefined,
          opacity: variant === "confused" ? 0.8 : 1,
        }}
      />
    </motion.div>
  );
}
