import { useEffect, useRef } from "react";

/** Align the whole session below the sticky navigation after setup is removed. */
export function useStudySessionViewport(itemKey: string | number | undefined) {
  const sessionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let cancelled = false;
    function alignSession() {
      const session = sessionRef.current;
      if (!session || cancelled) return;
      const workspace = session.querySelector(".session-workspace");
      if (workspace) workspace.scrollTop = 0;
      const header = document.querySelector(".header");
      const headerHeight = header?.getBoundingClientRect().height ?? 58;
      session.style.setProperty("--study-header-height", `${headerHeight}px`);
      const inset =
        headerHeight + (parseFloat(getComputedStyle(session).marginTop) || 12);
      window.scrollTo({
        top: Math.max(
          0,
          window.scrollY + session.getBoundingClientRect().top - inset,
        ),
        behavior: "instant",
      });
    }
    // Let the browser remove the setup layout before measuring its replacement.
    const frame = requestAnimationFrame(alignSession);
    void document.fonts?.ready.then(alignSession);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [itemKey]);

  return sessionRef;
}
