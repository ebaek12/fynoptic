import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

const ROTATE_INTERVAL_MS = 2200;

interface RotatingWordProps {
  words: readonly string[];
  className?: string;
}

export function RotatingWord({ words, className }: RotatingWordProps) {
  const [index, setIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return; // frozen on the first word, no interval
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % words.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [words.length, prefersReducedMotion]);

  const current = words[index];

  if (prefersReducedMotion) {
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
        {[...words].sort((a, b) => b.length - a.length)[0]}
      </span>
    </span>
  );
}
