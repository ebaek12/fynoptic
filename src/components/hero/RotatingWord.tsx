import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

import { useEnhancedMotion } from "../../hooks/useEnhancedMotion";

const ROTATE_INTERVAL_MS = 2200;
const SWAP_TRANSITION = { duration: 0.32, ease: "easeOut" } as const;

interface RotatingWordProps {
  words: readonly string[];
  className?: string;
  suffix?: string;
}

export function RotatingWord({
  words,
  className,
  suffix = "",
}: RotatingWordProps) {
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const reduceMotion = !useEnhancedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (reduceMotion || words.length < 2) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % words.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [words.length, reduceMotion]);

  const current = words[reduceMotion ? 0 : index] ?? "";
  const content = (
    <>
      <span className={cn("rotating-word-text", className)}>{current}</span>
      {suffix && <span className="rotating-word-suffix">{suffix}</span>}
    </>
  );

  // Natural text width preserves glyph overhangs and keeps punctuation attached.
  // SSR and reduced-motion users get the same complete, readable phrase.
  if (!mounted || reduceMotion) {
    return <span className="rotating-word">{content}</span>;
  }

  return (
    <span className="rotating-word">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={current}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={SWAP_TRANSITION}
          className="rotating-word-frame"
        >
          {content}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
