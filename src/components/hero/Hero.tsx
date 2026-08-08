import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { RotatingWord } from './RotatingWord';

const ROTATING_WORDS = ['scam', 'setup', 'lie', 'con', 'trap'] as const;

export function Hero() {
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

  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* redesign.css's sitewide `h1 { font-family: var(--display-face) !important }`
          (used for the legacy Spectral display headings) outranks a plain inline
          style — !important always beats a non-important declaration regardless of
          specificity. An ID-scoped !important rule is the minimal way to let this
          heading keep the hero-only Helvetica stack without touching that file. */}
      <style>{'#hero-heading{font-family:var(--font-hero) !important}'}</style>
      <h1
        id="hero-heading"
        className="max-w-[22ch] text-[clamp(2rem,3.4vw,3.15rem)] font-bold leading-[1.06] tracking-[-0.02em] text-foreground"
        style={{ fontFamily: 'var(--font-hero)' }}
      >
        See through the{' '}
        <RotatingWord
          words={ROTATING_WORDS}
          className="text-primary"
        />
        .
      </h1>

      <p className="hero-sub mt-4 max-w-[54ch] text-[clamp(1rem,1.15vw,1.12rem)] text-muted-foreground">
        Fynoptic is the ultimate free learning platform for consumer awareness.
        Interactive lessons, informative articles, and practice questions.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild size="hero" data-track="cta_click">
          <a href="/courses">Start the free course</a>
        </Button>
        <Button asChild size="hero" variant="outline">
          <a href="/practice">Try Practice mode</a>
        </Button>
      </div>
    </motion.div>
  );
}

export default Hero;
