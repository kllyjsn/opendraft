import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";

const COLORS = [
  "hsl(265 85% 58%)",  // primary
  "hsl(330 90% 60%)",  // accent
  "hsl(185 90% 45%)",  // secondary
  "hsl(45 90% 55%)",   // gold
  "hsl(140 70% 45%)",  // green
];

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  shape: "circle" | "rect" | "star";
}

interface ConfettiExplosionProps {
  trigger: boolean;
  onComplete?: () => void;
}

export function ConfettiExplosion({ trigger, onComplete }: ConfettiExplosionProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  const createParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 30; i++) {
      newParticles.push({
        id: i,
        x: (Math.random() - 0.5) * 300,
        y: -(Math.random() * 200 + 100),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 720 - 360,
        scale: Math.random() * 0.5 + 0.5,
        shape: ["circle", "rect", "star"][Math.floor(Math.random() * 3)] as Particle["shape"],
      });
    }
    setParticles(newParticles);
    setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, 2000);
  }, [onComplete]);

  useEffect(() => {
    if (trigger) createParticles();
  }, [trigger, createParticles]);

  return (
    <AnimatePresence>
      {particles.length > 0 && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute"
              style={{
                left: "50%",
                top: "50%",
                width: p.shape === "circle" ? 8 : 10,
                height: p.shape === "circle" ? 8 : 6,
                borderRadius: p.shape === "circle" ? "50%" : p.shape === "star" ? "2px" : "1px",
                backgroundColor: p.color,
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
              animate={{
                x: p.x,
                y: [p.y, p.y + 400],
                opacity: [1, 1, 0],
                scale: p.scale,
                rotate: p.rotation,
              }}
              transition={{ duration: 1.8, ease: "easeOut" }}
              exit={{ opacity: 0 }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
