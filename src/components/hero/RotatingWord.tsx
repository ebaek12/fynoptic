import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

const ROTATE_INTERVAL_MS = 2200;

interface RotatingWordProps {
  words: readonly string[];
  className?: string;
}

export function RotatingWord({ words, className }: RotatingWordProps) {
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  // SSR always renders the animated branch (matchMedia doesn't exist server-side).
  // Consulting prefersReducedMotion before mount would make the client's first
  // render diverge from that server output and trigger a hydration mismatch, so
  // the reduced-motion branch is only allowed to kick in post-mount.
  const reduceMotion = mounted && prefersReducedMotion;

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % words.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [words.length, reduceMotion]);

  // Widest word by character count — a stand-in for rendered width, not an
  // exact measurement. Fine for this component's word list, but wouldn't hold
  // up if future words used letters with very different glyph widths.
  const widestWord = useMemo(
    () => [...words].sort((a, b) => b.length - a.length)[0],
    [words],
  );

  const current = words[index];

  if (reduceMotion) {
    return <span className={className}>{words[0]}</span>;
  }

  return (
    <span className={cn('relative inline-grid', className)}>
      <AnimatePresence mode="wait">
        <motion.span
          key={current}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          className="col-start-1 row-start-1"
        >
          {current}
        </motion.span>
      </AnimatePresence>
      {/* Reserves layout width for the longest word so the sentence around it
          doesn't reflow every 2.2s — sized off the widest candidate ("setup"),
          invisible, same font/weight/size as the visible word above it. */}
      <span aria-hidden="true" className="invisible col-start-1 row-start-1">
        {widestWord}
      </span>
    </span>
  );
}
