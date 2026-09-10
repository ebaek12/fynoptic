import type { ButtonHTMLAttributes, ReactNode } from "react";

interface AnswerChoiceProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  index: number;
  children: ReactNode;
  state?: "correct" | "wrong" | "selected";
}

export function AnswerChoice({
  index,
  children,
  state,
  className = "",
  ...props
}: AnswerChoiceProps) {
  return (
    <button
      type="button"
      className={`mc-option session-answer ${className}`}
      {...props}
    >
      <span className="session-answer-letter" aria-hidden="true">
        {String.fromCharCode(65 + index)}
      </span>
      <span className="session-answer-copy">{children}</span>
      <span className="session-answer-mark" aria-hidden="true">
        {state === "correct"
          ? "✓"
          : state === "wrong"
            ? "×"
            : state === "selected"
              ? "●"
              : ""}
      </span>
    </button>
  );
}
