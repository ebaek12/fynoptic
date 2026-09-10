import { useEffect, useRef, type ReactNode } from "react";

export function StudySetup({
  id,
  step,
  labels,
  title,
  description,
  onBack,
  children,
  summary,
  actions,
}: {
  id: string;
  step: 1 | 2;
  labels: [string, string];
  title: string;
  description: string;
  onBack: () => void;
  children: ReactNode;
  summary: ReactNode;
  actions: ReactNode;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);
  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    heading.current?.focus({ preventScroll: true });
    const top = heading.current?.getBoundingClientRect().top ?? 0;
    if (top < 90 || top > window.innerHeight - 120)
      heading.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [step]);

  return (
    <div id={id} className="study-setup" data-step={step}>
      <nav className="study-steps" aria-label="Session setup">
        <button
          type="button"
          onClick={onBack}
          aria-current={step === 1 ? "step" : undefined}
        >
          {labels[0]}
        </button>
        <span aria-hidden="true">→</span>
        <span aria-current={step === 2 ? "step" : undefined}>{labels[1]}</span>
      </nav>
      <section className="study-panel" aria-labelledby={`${id}-heading`}>
        <div className="study-heading">
          <h2 id={`${id}-heading`} ref={heading} tabIndex={-1}>
            {title}
          </h2>
          <p>{description}</p>
        </div>
        <div className="study-body" key={step}>
          {children}
        </div>
        <footer className="study-footer">
          <div className="study-summary" role="status">
            {summary}
          </div>
          <div className="study-actions">{actions}</div>
        </footer>
      </section>
    </div>
  );
}

export function SelectionMark({ radio = false }: { radio?: boolean }) {
  return (
    <span
      className={`study-check${radio ? " study-check--radio" : ""}`}
      aria-hidden="true"
    >
      ✓
    </span>
  );
}

export function SelectionTools({
  selected,
  total,
  onSelectAll,
  onClear,
  allId,
  clearId,
}: {
  selected: number;
  total: number;
  onSelectAll: () => void;
  onClear: () => void;
  allId: string;
  clearId: string;
}) {
  return (
    <div className="study-tools">
      <span>
        {selected} of {total} topics selected
      </span>
      <div>
        <button id={allId} type="button" onClick={onSelectAll}>
          Select all
        </button>
        <button
          id={clearId}
          type="button"
          onClick={onClear}
          disabled={!selected}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
