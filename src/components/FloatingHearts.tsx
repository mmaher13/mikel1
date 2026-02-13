import { useMemo } from "react";
import { motion } from "framer-motion";

const FloatingHearts = () => {
  const hearts = useMemo(() => 
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 6,
      duration: 4 + Math.random() * 4,
      size: 12 + Math.random() * 20,
      opacity: 0.15 + Math.random() * 0.25,
    })), []
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {hearts.map((h) => (
        <motion.div
          key={h.id}
          className="absolute text-primary"
          style={{ left: `${h.left}%`, bottom: -30, fontSize: h.size }}
          animate={{
            y: [0, -window.innerHeight - 60],
            x: [0, Math.sin(h.id) * 40],
            rotate: [0, 360],
            opacity: [0, h.opacity, h.opacity, 0],
          }}
          transition={{
            duration: h.duration,
            delay: h.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        >
          ♥
        </motion.div>
      ))}
    </div>
  );
};

export default FloatingHearts;
