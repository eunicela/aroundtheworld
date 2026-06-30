"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface CityLabelProps {
  name: string;
  onDismiss: () => void;
}

export function CityLabel({ name, onDismiss }: CityLabelProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className="fixed bottom-8 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4"
      initial={reducedMotion ? {} : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="font-display text-xs tracking-[0.4em] text-charcoal uppercase">
        {name}
      </p>
      <button
        onClick={onDismiss}
        className="font-body text-xs tracking-wider text-charcoal/40 uppercase transition-colors hover:text-charcoal/70"
        aria-label="Dismiss city selection"
      >
        ✕
      </button>
    </motion.div>
  );
}
