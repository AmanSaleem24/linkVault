"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

// ─── SectionReveal ────────────────────────────────────────────────────────────

interface SectionRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function SectionReveal({
  children,
  className = "",
  delay = 0,
}: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ y: 60, opacity: 0 }}
      animate={isInView ? { y: 0, opacity: 1 } : {}}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── AnimatedCounter ─────────────────────────────────────────────────────────

interface AnimatedCounterProps {
  value: number;
  suffix: string;
  duration?: number;
  decimals?: number;
}

export function AnimatedCounter({
  value,
  suffix,
  duration = 2,
  decimals = 0,
}: AnimatedCounterProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(spanRef, { once: true, margin: "-80px" });
  const display = useCountUp(isInView ? value : 0, duration, decimals);

  return <span ref={spanRef}>{display}{suffix}</span>;
}

// ─── useCountUp hook ─────────────────────────────────────────────────────────

function useCountUp(target: number, duration: number, decimals: number): string {
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (target === 0) return;
    const startTime = performance.now();
    let rafId: number;
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;
      setDisplay(current.toFixed(decimals));
      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration, decimals]);

  return display;
}
