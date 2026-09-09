import { useEffect, useId, useRef } from "react";

export function ScamIllustration() {
  const id = useId().replace(/:/g, "");
  const messagesId = `${id}-messages`;
  const lensId = `${id}-lens`;
  const shadowId = `${id}-shadow`;
  const titleId = `${id}-title`;
  const illustration = useRef<SVGSVGElement>(null);
  const lens = useRef<SVGGElement>(null);
  const magnifiedMessages = useRef<SVGGElement>(null);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      frame = 0;
      const progress = preference.matches
        ? 0
        : Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.7)));
      const x = progress * -24;
      const y = progress * -8;
      lens.current?.setAttribute("transform", `translate(${x} ${y})`);
      // Keep the enlarged copy registered with the cards beneath the moving lens.
      magnifiedMessages.current?.setAttribute(
        "transform",
        `translate(265 156) scale(1.16) translate(-265 -156) translate(${-x} ${-y})`,
      );
    };
    const schedule = () => {
      if (frame) return;
      const bounds = illustration.current?.getBoundingClientRect();
      if (bounds && (bounds.bottom < 0 || bounds.top > window.innerHeight))
        return;
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    preference.addEventListener("change", update);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      preference.removeEventListener("change", update);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <svg
      ref={illustration}
      className="scam-illustration"
      viewBox="0 0 440 310"
      role="img"
      aria-labelledby={titleId}
    >
      <title id={titleId}>
        Spot suspicious messages: check the sender, unexpected fees, and offers
        that seem too good to be true.
      </title>
      <defs>
        <filter id={shadowId} x="-25%" y="-30%" width="155%" height="180%">
          <feDropShadow
            dx="0"
            dy="6"
            stdDeviation="7"
            floodColor="var(--scan-shadow)"
            floodOpacity=".12"
          />
        </filter>
        <clipPath id={lensId}>
          <circle cx="265" cy="156" r="64" />
        </clipPath>
        <g id={messagesId}>
          <rect
            className="scan-card"
            x="24"
            y="20"
            width="332"
            height="74"
            rx="12"
          />
          <rect
            className="scan-icon-tile"
            x="39"
            y="36"
            width="40"
            height="40"
            rx="10"
          />
          <g
            className="scan-icon"
            fill="none"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="48" y="47" width="22" height="17" rx="3" />
            <path d="m49 49 10 7 10-7" />
          </g>
          <text className="scan-label" x="93" y="47">
            Check the sender
          </text>
          <text className="scan-message" x="93" y="70">
            support@paymnt.example
          </text>
          <circle className="scan-warning-fill" cx="333" cy="42" r="11" />
          <path
            className="scan-warning-mark"
            d="M333 36v6m0 4v1"
            strokeWidth="2"
            strokeLinecap="round"
          />

          <rect
            className="scan-card"
            x="40"
            y="107"
            width="330"
            height="90"
            rx="12"
          />
          <rect
            className="scan-icon-tile"
            x="55"
            y="124"
            width="40"
            height="40"
            rx="10"
          />
          <path
            className="scan-icon"
            d="M67 134h16a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9l-7 5v-5a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3Z"
            fill="none"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <text className="scan-label" x="110" y="133">
            Delivery
          </text>
          <rect
            className="scan-fee-highlight"
            x="211"
            y="143"
            width="105"
            height="31"
            rx="6"
          />
          <text className="scan-label" x="110" y="155">
            notice
          </text>
          <text className="scan-fee-text" x="224" y="164">
            Extra fee
          </text>

          <rect
            className="scan-card"
            x="24"
            y="211"
            width="306"
            height="72"
            rx="12"
          />
          <rect
            className="scan-icon-tile"
            x="39"
            y="227"
            width="40"
            height="40"
            rx="10"
          />
          <g
            className="scan-icon"
            fill="none"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M50 241h18l2 16H48l2-16Z" />
            <path d="M54 241v-4a5 5 0 0 1 10 0v4" />
          </g>
          <text className="scan-label" x="94" y="239">
            Too good to be true?
          </text>
          <text className="scan-message" x="94" y="261">
            A new phone for $99
          </text>
        </g>
      </defs>

      <g filter={`url(#${shadowId})`} aria-hidden="true">
        <use href={`#${messagesId}`} />
      </g>
      <g ref={lens} className="scan-lens" aria-hidden="true">
        <path
          className="scan-handle"
          d="m311 203 67 67"
          strokeWidth="24"
          strokeLinecap="round"
        />
        <path
          className="scan-handle-highlight"
          d="m327 220 49 49"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle
          className="scan-lens-base"
          cx="265"
          cy="156"
          r="68"
          filter={`url(#${shadowId})`}
        />
        <g clipPath={`url(#${lensId})`}>
          <g
            ref={magnifiedMessages}
            transform="translate(265 156) scale(1.16) translate(-265 -156)"
          >
            <use href={`#${messagesId}`} />
          </g>
          <circle className="scan-lens-tint" cx="265" cy="156" r="64" />
        </g>
        <circle
          className="scan-lens-rim"
          cx="265"
          cy="156"
          r="68"
          fill="none"
          strokeWidth="8"
        />
        <path
          className="scan-lens-reflection"
          d="M211 147a55 55 0 0 1 47-45"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
