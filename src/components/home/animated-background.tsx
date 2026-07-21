"use client";

import { motion, useReducedMotion } from "framer-motion";

const BLOBS = [
  { x: "-5%",  y: "5%",   w: 500, h: 500, color: "#3D52A0", opacity: 0.18, dur: 22, delay: 0,  dx: 40,  dy: 30  },
  { x: "50%",  y: "25%",  w: 420, h: 420, color: "#7091E6", opacity: 0.15, dur: 26, delay: 2,  dx: -35, dy: 45  },
  { x: "75%",  y: "45%",  w: 380, h: 380, color: "#ADBBDA", opacity: 0.14, dur: 24, delay: 4,  dx: -25, dy: -30 },
  { x: "15%",  y: "55%",  w: 440, h: 440, color: "#3D52A0", opacity: 0.12, dur: 28, delay: 1,  dx: 30,  dy: -35 },
  { x: "55%",  y: "75%",  w: 400, h: 400, color: "#7091E6", opacity: 0.13, dur: 20, delay: 3,  dx: -40, dy: 25  },
  { x: "30%",  y: "90%",  w: 360, h: 360, color: "#8697C4", opacity: 0.11, dur: 30, delay: 5,  dx: 20,  dy: -20 },
];

function Blob({ x, y, w, h, color, opacity, dur, delay: d, dx, dy }: (typeof BLOBS)[number]) {
  return (
    <motion.div
      className="pointer-events-none absolute rounded-full"
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        opacity,
        filter: `blur(120px)`,
        willChange: "transform",
      }}
      animate={{
        x: [0, dx, 0],
        y: [0, dy, 0],
        scale: [1, 1.08, 0.95, 1],
      }}
      transition={{
        x:   { duration: dur, repeat: Infinity, ease: "easeInOut", delay: d },
        y:   { duration: dur * 1.15, repeat: Infinity, ease: "easeInOut", delay: d * 0.7 },
        scale: { duration: dur * 0.8, repeat: Infinity, ease: "easeInOut", delay: d * 1.3 },
      }}
    />
  );
}

export function AnimatedBackground() {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {BLOBS.map((b, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: b.x,
              top: b.y,
              width: b.w,
              height: b.h,
              background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
              opacity: b.opacity * 0.5,
              filter: `blur(120px)`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {BLOBS.map((b, i) => (
        <Blob key={i} {...b} />
      ))}
    </div>
  );
}
