import { motion, useReducedMotion } from "framer-motion";

export interface FlashcardCardProps {
  term: string;
  definition: string;
  isFront: boolean;
  revealed: boolean;
  onReveal: () => void;
}

export function FlashcardCard({
  term,
  definition,
  isFront,
  revealed,
  onReveal,
}: FlashcardCardProps) {
  const reducedMotion = useReducedMotion();
  const transition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.35, ease: [0.2, 0.8, 0.2, 1] as const };
  return (
    <button
      type="button"
      className="fc-card"
      aria-label={revealed ? "Answer revealed" : "Reveal answer"}
      aria-describedby={isFront ? "term-text" : "def-text"}
      disabled={revealed}
      onClick={onReveal}
    >
      <span className="session-card-faces">
        <motion.span
          id="term-side"
          className={isFront ? "side is-front" : "side"}
          aria-hidden={!isFront}
          style={{ transition: "none" }}
          animate={{ rotateY: isFront ? 0 : 180, opacity: isFront ? 1 : 0 }}
          transition={transition}
        >
          <span className="session-prompt-label">Term</span>
          <span id="term-text" className="session-card-text">
            {term || " - "}
          </span>
        </motion.span>
        <motion.span
          id="def-side"
          className={!isFront ? "side is-front" : "side"}
          aria-hidden={isFront}
          style={{ transition: "none" }}
          animate={{ rotateY: !isFront ? 0 : 180, opacity: !isFront ? 1 : 0 }}
          transition={transition}
        >
          <span className="session-prompt-label">Definition</span>
          <span id="def-text" className="session-card-text">
            {definition || " - "}
          </span>
        </motion.span>
      </span>
      <span className="session-card-hint">
        {revealed ? "Answer revealed" : "Click the card to reveal the answer"}{" "}
        <span aria-hidden="true">↻</span>
      </span>
    </button>
  );
}
