import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import "../../styles/spot-the-red-flag.css";

const choices = [
  { id: "fee", label: "The small delivery fee" },
  { id: "url", label: "The weird URL" },
  { id: "package", label: "The message mentions a package" },
] as const;

type Choice = (typeof choices)[number]["id"];

const feedback = {
  fee: {
    title: "Good catch. The fee is a red flag, too.",
    copy: "USPS redelivery is free. A tiny charge can be bait for your card details. Now inspect the URL: who does it really belong to?",
    source: "https://faq.usps.com/articles/Knowledge/Scams-Scheme-Alerts",
  },
  url: {
    title: "Exactly. The address gives it away.",
    copy: "This domain isn’t usps.com. Adding “USPS” to a web address doesn’t make it official. Open usps.com yourself to check your delivery, instead of following the text.",
    source:
      "https://www.uspis.gov/news/scam-article/smishing-package-tracking-text-scams",
  },
  package: {
    title: "A familiar story. Look a little closer.",
    copy: "A package notification alone doesn’t prove it’s a scam. Scammers borrow everyday situations to sound believable. Inspect the fee and the web address.",
    source:
      "https://www.uspis.gov/news/scam-article/smishing-package-tracking-text-scams",
  },
};

export default function SpotTheRedFlag() {
  const [selected, setSelected] = useState<Choice | null>(null);
  const [inspecting, setInspecting] = useState<Choice | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const firstChoiceRef = useRef<HTMLButtonElement>(null);
  const retryRef = useRef<HTMLButtonElement>(null);
  const solved = selected === "url";
  const response = selected ? feedback[selected] : null;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        section.dataset.entered = "true";
        observer.disconnect();
      },
      { threshold: 0.15 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  function reset() {
    // Narrow layouts swap the choices for feedback. Restore the choices
    // before focusing so keyboard users do not land on a hidden button.
    flushSync(() => {
      setSelected(null);
      setInspecting(null);
    });
    firstChoiceRef.current?.focus({ preventScroll: true });
  }

  function choose(answer: Choice) {
    flushSync(() => setSelected(answer));
    if (window.matchMedia?.("(max-width: 800px)").matches) {
      retryRef.current?.focus({ preventScroll: true });
    }
  }

  return (
    <section
      id="spot-the-red-flag"
      className="red-flag"
      ref={sectionRef}
      aria-labelledby="red-flag-heading"
      data-solved={solved}
      data-answered={Boolean(response)}
      data-inspecting={inspecting ?? selected ?? undefined}
    >
      <div className="rf-container">
        <div className="rf-topline">
          <span>
            <span className="rf-crosshair" aria-hidden="true" /> Spot the red
            flag
          </span>
        </div>

        <div className="rf-layout">
          <div className="rf-intro">
            <h2 id="red-flag-heading">
              Think you can
              <br />
              spot the <span>scam?</span>
            </h2>
            <p className="rf-description">
              Learn to recognize the small things scammers hope you overlook.
            </p>
            <div className="rf-invitation">
              <span>Try one before you start learning.</span>
              <svg viewBox="0 0 64 32" fill="none" aria-hidden="true">
                <path d="M2 6c15 20 38 21 57 10M48 8l12 7-8 13" />
              </svg>
            </div>
          </div>

          <div className="rf-demo">
            <div className="rf-message-stage">
              <article
                className="rf-message"
                aria-label="Example delivery text message"
              >
                <div className="rf-message-header">
                  <span className="rf-sender-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="m12 3 9 4.5v9L12 21l-9-4.5v-9L12 3Zm0 9 9-4.5M12 12 3 7.5m9 4.5v9M7.5 5.25l9 4.5v4.5" />
                    </svg>
                  </span>
                  <div>
                    <strong>USPS</strong>
                    <span>Text message</span>
                  </div>
                  <span className="rf-message-time">now</span>
                </div>
                <p className="rf-message-copy">
                  <span className="rf-package">
                    Your package could not be delivered.
                  </span>{" "}
                  Pay <span className="rf-fee">$0.30</span> to schedule
                  redelivery.
                </p>
                <div className="rf-url-wrap">
                  <span className="rf-url">
                    usps<span className="rf-impostor">-redelivery-support</span>
                    .com
                  </span>
                  <svg
                    className="rf-pencil"
                    viewBox="0 0 400 58"
                    preserveAspectRatio="none"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      pathLength="1"
                      d="M356 7C286-1 120 1 46 10S-6 43 67 48s242 2 296-9 40-28-28-33C226-2 76 0 18 20"
                    />
                  </svg>
                </div>
                <div className="rf-message-footer">
                  <span>Example message</span>
                </div>
              </article>
              <span className="rf-stamp" aria-hidden="true">
                Red flag found
              </span>
            </div>

            <div className="rf-answer-slot">
              <div className="rf-question" id="rf-question">
                What’s the biggest red flag?
              </div>
              <div
                className="rf-choices"
                role="group"
                aria-labelledby="rf-question"
              >
                {choices.map((choice, index) => (
                  <button
                    key={choice.id}
                    ref={index === 0 ? firstChoiceRef : undefined}
                    type="button"
                    className="rf-choice"
                    aria-pressed={selected === choice.id}
                    aria-controls="rf-feedback"
                    data-choice={choice.id}
                    onClick={() => choose(choice.id)}
                    onMouseEnter={() => setInspecting(choice.id)}
                    onMouseLeave={() => setInspecting(null)}
                    onFocus={() => setInspecting(choice.id)}
                    onBlur={() => setInspecting(null)}
                  >
                    <span className="rf-choice-letter" aria-hidden="true">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span>{choice.label}</span>
                    <span className="rf-choice-mark" aria-hidden="true">
                      {selected === choice.id ? (solved ? "✓" : "↗") : "↗"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <noscript>
              <p className="rf-nojs">
                The URL is the giveaway: it isn’t usps.com. The fee is another
                clue - USPS redelivery is free. Check your delivery by opening
                usps.com yourself.
              </p>
            </noscript>
          </div>
          <div
            className="rf-feedback"
            id="rf-feedback"
            data-open={Boolean(response)}
          >
            <div className="rf-feedback-inner">
              <div
                className="rf-feedback-text"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                {response && (
                  <>
                    <strong>{response.title}</strong>
                    <p>{response.copy}</p>
                  </>
                )}
              </div>
              {response && (
                <div className="rf-feedback-actions">
                  <button
                    ref={retryRef}
                    type="button"
                    className="rf-reset"
                    onClick={reset}
                  >
                    Try again <span aria-hidden="true">↺</span>
                  </button>
                  <a
                    className="rf-source"
                    href={response.source}
                    target="_blank"
                    rel="noreferrer"
                  >
                    USPS guidance <span aria-hidden="true">↗</span>
                  </a>
                </div>
              )}
              {solved && (
                <a className="rf-continue" href="/practice">
                  Put your instincts to work <span aria-hidden="true">↗</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
