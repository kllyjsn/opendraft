import { motion } from "framer-motion";
import { BrandMascot } from "@/components/BrandMascot";

interface MascotPeekProps {
  variant?: "default" | "happy" | "wink" | "wave" | "confused" | "thinking";
  size?: number;
  direction?: "left" | "right" | "bottom";
  className?: string;
  /** Delay before peeking in (seconds) */
  delay?: number;
}

/**
 * Mascot that peeks in from an edge when scrolled into view.
 * Strategic use: section transitions, empty states, CTAs.
 */
export function MascotPeek({
  variant = "wave",
  size = 64,
  direction = "right",
  className = "",
  delay = 0.2,
}: MascotPeekProps) {
  const offsets = {
    left: { initial: { x: -size * 0.6, opacity: 0 }, animate: { x: 0, opacity: 1 } },
    right: { initial: { x: size * 0.6, opacity: 0 }, animate: { x: 0, opacity: 1 } },
    bottom: { initial: { y: size * 0.5, opacity: 0 }, animate: { y: 0, opacity: 1 } },
  };

  const { initial, animate } = offsets[direction];

  return (
    <motion.div
      className={`inline-flex ${className}`}
      initial={initial}
      whileInView={animate}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <BrandMascot size={size} variant={variant} />
    </motion.div>
  );
}
