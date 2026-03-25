import { motion } from "framer-motion";
import mascotImg from "@/assets/gremlin-logo-advanced.png";

/**
 * Fun animated brand mascots scattered on the homepage hero.
 * Responsive — smaller on mobile, larger on desktop.
 */
export function HomepageGremlins() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-[1]">
      {/* Top-right gremlin */}
      <motion.img
        src={mascotImg}
        alt=""
        initial={{ opacity: 0, y: 20, rotate: 12 }}
        animate={{ opacity: 1, y: [0, -8, 0], rotate: 12 }}
        transition={{
          opacity: { duration: 0.6, delay: 0.3 },
          y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.3 },
        }}
        className="absolute top-16 right-3 w-10 h-10 md:top-20 md:right-12 md:w-16 md:h-16 object-contain drop-shadow-md"
      />

      {/* Bottom-left gremlin */}
      <motion.img
        src={mascotImg}
        alt=""
        initial={{ opacity: 0, y: 20, rotate: -8 }}
        animate={{ opacity: 0.7, y: [0, -6, 0], rotate: -8 }}
        transition={{
          opacity: { duration: 0.6, delay: 0.8 },
          y: { duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 },
        }}
        className="absolute bottom-24 left-2 w-8 h-8 md:bottom-16 md:left-10 md:w-14 md:h-14 object-contain drop-shadow-md"
      />

      {/* Top-left gremlin (desktop only) */}
      <motion.img
        src={mascotImg}
        alt=""
        initial={{ opacity: 0, y: 20, rotate: -15 }}
        animate={{ opacity: 0.6, y: [0, -10, 0], rotate: -15 }}
        transition={{
          opacity: { duration: 0.6, delay: 0.5 },
          y: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
        }}
        className="hidden md:block absolute top-28 left-8 w-12 h-12 object-contain drop-shadow-md"
      />
    </div>
  );
}
