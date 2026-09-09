import { useEffect, useId, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import RackFocus from "../rack/RackFocus";
import { createMagnifierLanding } from "./magnifier-landing";
import "../../styles/magnifier-scroll.css";

/** A solid lens, enlarged around its optical centre until it covers the viewport. */
export function MagnifierScrollZoom() {
  const experienceRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const glassRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<SVGGElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [introActive, setIntroActive] = useState(true);
  const id = useId().replace(/:/g, "");

  useEffect(() => {
    const section = sectionRef.current;
    const experience = experienceRef.current;
    const glass = glassRef.current;
    const zoom = zoomRef.current;
    const portal = portalRef.current;
    const content = contentRef.current;
    if (!section || !experience || !glass || !zoom || !portal || !content)
      return;

    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();

    media.add(
      "(prefers-reduced-motion: no-preference)",
      () => {
        section.dataset.animated = "true";
        experience.dataset.animated = "true";
        const pin = section.querySelector<HTMLElement>(".magnifier-pin")!;
        const caption =
          section.querySelector<HTMLElement>(".magnifier-caption")!;
        const header = document.querySelector<HTMLElement>(
          'header.header[role="banner"]',
        );
        const headerWasInert = header?.inert ?? false;
        const restoreHeader = () => {
          if (!header) return;
          delete header.dataset.magnifying;
          header.style.removeProperty("--magnifier-nav-scale");
          header.style.removeProperty("--magnifier-nav-opacity");
          header.inert = headerWasInert;
        };

        // The lens's clear radius is 138 / 480 of the SVG width. Cover the
        // viewport diagonal, not a fixed 4500px: this also fits portrait/ultrawide.
        const playhead = { progress: 0 };
        let initialRadius = 0;
        let finalScale = 1;
        let scrollDistance = 1;
        let previousComplete: boolean | undefined;
        const measure = () => {
          initialRadius = (glass.clientWidth * 138) / 480;
          scrollDistance = Math.max(1, section.clientHeight - pin.clientHeight);
          finalScale =
            (Math.hypot(pin.clientWidth, pin.clientHeight) / 2 + 16) /
            initialRadius;
          // The real section temporarily leaves flow during the dive. Reserve
          // its full height so docking cannot move the footer or scrollbar.
          experience.style.setProperty(
            "--learning-height",
            `${content.offsetHeight}px`,
          );
        };
        const render = () => {
          const progress = playhead.progress;
          const scale = 1 + Math.pow(progress, 2.3) * (finalScale - 1);
          // Browsers round scroll positions to pixels. Treat the last pixel
          // as the landing, including native #learning anchor navigation.
          const complete = progress >= 1 - 1 / scrollDistance;
          zoom.setAttribute(
            "transform",
            `translate(200 200) scale(${scale}) translate(-200 -200)`,
          );
          caption.style.opacity = String(
            1 - Math.min(1, Math.max(0, (progress - 0.08) / 0.22)),
          );
          experience.dataset.phase = complete
            ? "complete"
            : progress > 0
              ? "zooming"
              : "before";
          portal.inert = !complete;
          portal.style.clipPath = complete
            ? "none"
            : `circle(${initialRadius * scale}px at 50% 50%)`;
          content.style.transform = complete
            ? "none"
            : `scale(${scale / finalScale})`;
          content.style.opacity = String(Math.min(1, progress / 0.12));
          // Scale the real navigation around the same viewport centre as the
          // learning section. At the landing it is already in its normal pose.
          if (header && progress > 0 && !complete) {
            header.dataset.magnifying = "true";
            header.style.setProperty(
              "--magnifier-nav-scale",
              String(scale / finalScale),
            );
            header.style.setProperty(
              "--magnifier-nav-opacity",
              String(Math.min(1, progress / 0.12)),
            );
            header.inert = true;
          } else {
            restoreHeader();
          }
          if (complete !== previousComplete) {
            previousComplete = complete;
            setIntroActive(!complete);
          }
        };
        measure();
        render();

        let landing: ReturnType<typeof createMagnifierLanding> | undefined;
        const dive = gsap.to(playhead, {
          progress: 1,
          duration: 1,
          ease: "none",
          onUpdate: render,
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: 1.2,
            onRefresh: () => {
              measure();
              render();
            },
            // Catch only recent wheel/touch momentum. Anchors, keyboard and
            // restored scroll positions continue directly to their destination.
            onLeave: (self) => {
              if (landing?.land()) return;
              self.getTween()?.progress(1);
              playhead.progress = 1;
              render();
            },
            onLeaveBack: (self) => {
              self.getTween()?.progress(1);
              playhead.progress = 0;
              render();
            },
          },
        });
        landing = createMagnifierLanding({
          section,
          pin,
          experience,
          settle: () => {
            dive.scrollTrigger?.getTween()?.pause();
            const finishZoom = gsap.to(playhead, {
              progress: 1,
              duration: 0.55,
              ease: "power2.out",
              onUpdate: render,
            });
            return () => {
              finishZoom.kill();
              dive.scrollTrigger?.getTween()?.progress(1);
              playhead.progress = dive.scrollTrigger?.progress ?? 1;
              render();
            };
          },
        });
        const resize = new ResizeObserver(measure);
        resize.observe(content);

        // A restored scroll position or late font load must use fresh bounds.
        let live = true;
        document.fonts.ready.then(() => {
          if (live) ScrollTrigger.refresh();
        });

        return () => {
          live = false;
          landing?.destroy();
          resize.disconnect();
          delete section.dataset.animated;
          delete experience.dataset.animated;
          delete experience.dataset.phase;
          experience.style.removeProperty("--learning-height");
          zoom.removeAttribute("transform");
          caption.style.removeProperty("opacity");
          portal.inert = false;
          portal.style.removeProperty("clip-path");
          content.style.removeProperty("transform");
          content.style.removeProperty("opacity");
          restoreHeader();
          setIntroActive(false);
        };
      },
      section,
    );

    return () => media.revert();
  }, []);

  return (
    <div ref={experienceRef} className="magnifier-experience">
      <section
        ref={sectionRef}
        className="magnifier-transition"
        aria-label="Look closer"
      >
        <div className="magnifier-pin">
          <div className="magnifier-caption">
            <span className="magnifier-eyebrow">
              A little curiosity changes everything.
            </span>
            <h2>Look closer.</h2>
          </div>

          <div className="magnifier-art" aria-hidden="true">
            <svg
              ref={glassRef}
              className="magnifier-glass"
              viewBox="0 0 480 480"
              fill="none"
            >
              <defs>
                <linearGradient
                  id={`${id}-handle`}
                  x1="184"
                  y1="0"
                  x2="216"
                  y2="0"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#111111" />
                  <stop offset="0.25" stopColor="#303030" />
                  <stop offset="0.65" stopColor="#1b1b1b" />
                  <stop offset="1" stopColor="#090909" />
                </linearGradient>
                <linearGradient
                  id={`${id}-rim`}
                  x1="65"
                  y1="52"
                  x2="330"
                  y2="358"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#393939" />
                  <stop offset="0.3" stopColor="#181818" />
                  <stop offset="0.7" stopColor="#0a0a0a" />
                  <stop offset="1" stopColor="#282828" />
                </linearGradient>
              </defs>
              <g ref={zoomRef}>
                <g transform="rotate(-45 200 200)">
                  <rect
                    x="189"
                    y="339"
                    width="22"
                    height="27"
                    rx="2"
                    fill="#333333"
                  />
                  <rect
                    x="187"
                    y="359"
                    width="26"
                    height="7"
                    rx="1"
                    fill="#8b8b8b"
                  />
                  <rect
                    x="184"
                    y="365"
                    width="32"
                    height="131"
                    rx="5"
                    fill={`url(#${id}-handle)`}
                  />
                  <path d="M187 373v113" stroke="#555555" strokeWidth="1" />
                </g>
                <circle cx="200" cy="200" r="154" fill={`url(#${id}-rim)`} />
                <circle
                  cx="200"
                  cy="200"
                  r="152.5"
                  stroke="#777777"
                  strokeWidth="1"
                />
                <circle
                  cx="200"
                  cy="200"
                  r="141.5"
                  stroke="#666666"
                  strokeWidth="1"
                />
                {/* Fully opaque, with the same paint as the section it hands off to. */}
                <circle
                  className="magnifier-lens"
                  cx="200"
                  cy="200"
                  r="140"
                  fill="var(--surface-0)"
                />
              </g>
            </svg>
          </div>

          <a className="magnifier-skip" href="#learning">
            Skip to learning resources
          </a>
        </div>
      </section>
      <div id="learning" className="magnifier-learning" tabIndex={-1}>
        <div ref={portalRef} className="magnifier-portal">
          <div ref={contentRef} className="magnifier-content">
            <RackFocus introActive={introActive} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MagnifierScrollZoom;
