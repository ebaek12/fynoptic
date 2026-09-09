/** A bounded landing for wheel/touch momentum, never a document scroll lock. */
export function createMagnifierLanding({
  section,
  pin,
  experience,
  settle,
}: {
  section: HTMLElement;
  pin: HTMLElement;
  experience: HTMLElement;
  settle: () => () => void;
}) {
  let used = false;
  let active = false;
  let eligibleUntil = 0;
  let landingY = 0;
  let touchY = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let finish: (() => void) | undefined;

  const bounds = () => {
    const start = scrollY + section.getBoundingClientRect().top;
    return { start, end: start + section.clientHeight - pin.clientHeight };
  };
  const release = () => {
    eligibleUntil = 0;
    active = false;
    clearTimeout(timer);
    delete experience.dataset.settling;
    finish?.();
    finish = undefined;
  };
  const land = () => {
    if (active) return true;
    if (used || performance.now() > eligibleUntil) return false;
    used = true;
    active = true;
    landingY = Math.ceil(bounds().end);
    experience.dataset.settling = "true";
    window.scrollTo({ top: landingY, behavior: "instant" });
    finish = settle();
    // 550ms to finish the zoom, then 300ms to read the revealed first panel.
    // This timer never extends with repeated input; continued scrolling wins.
    timer = setTimeout(release, 850);
    return true;
  };
  const ignoresTarget = (target: EventTarget | null, delta: number) => {
    if (!(target instanceof Element)) return false;
    if (
      target.closest(
        'dialog, [role="dialog"], input, textarea, select, [contenteditable="true"]',
      )
    )
      return true;
    // Leave independently scrolling menus and panels alone.
    for (
      let el: Element | null = target;
      el && el !== document.body;
      el = el.parentElement
    ) {
      if (!/(auto|scroll)/.test(getComputedStyle(el).overflowY)) continue;
      if (delta > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1)
        return true;
      if (delta < 0 && el.scrollTop > 0) return true;
    }
    return false;
  };
  const input = (
    event: WheelEvent | TouchEvent,
    delta: number,
    momentumMs: number,
  ) => {
    if (delta <= 0 || ignoresTarget(event.target, delta)) {
      release();
      return;
    }
    const { start, end } = bounds();
    if (!used && scrollY >= start - innerHeight && scrollY < end) {
      eligibleUntil = performance.now() + momentumMs;
    }
    if (event.cancelable && (active || (scrollY + delta >= end && land()))) {
      event.preventDefault();
    }
  };
  const wheel = (event: WheelEvent) => {
    if (
      event.ctrlKey ||
      event.metaKey ||
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
    )
      return;
    const unit =
      event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
    input(event, event.deltaY * unit, 250);
  };
  const touchStart = (event: TouchEvent) => {
    release();
    touchY = event.touches[0]?.clientY ?? 0;
  };
  const touchMove = (event: TouchEvent) => {
    if (event.touches.length !== 1) {
      release();
      return;
    }
    const nextY = event.touches[0]!.clientY;
    input(event, touchY - nextY, 1000);
    touchY = nextY;
  };
  const scroll = () => {
    if (active) {
      if (scrollY < landingY - 2) release();
      // Touch inertia can continue after touchend, when it cannot be cancelled.
      else if (scrollY > landingY + 1)
        window.scrollTo({ top: landingY, behavior: "instant" });
    } else if (scrollY < bounds().start - 16) {
      used = false;
    }
  };

  window.addEventListener("wheel", wheel, { passive: false });
  window.addEventListener("touchstart", touchStart, { passive: true });
  window.addEventListener("touchmove", touchMove, { passive: false });
  window.addEventListener("touchcancel", release);
  window.addEventListener("scroll", scroll, { passive: true });
  // A fresh action always wins, including keyboard navigation, links and tabs.
  window.addEventListener("keydown", release, true);
  window.addEventListener("pointerdown", release, true);
  window.addEventListener("hashchange", release);
  window.addEventListener("resize", release);

  return {
    land,
    destroy() {
      release();
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("touchstart", touchStart);
      window.removeEventListener("touchmove", touchMove);
      window.removeEventListener("touchcancel", release);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("keydown", release, true);
      window.removeEventListener("pointerdown", release, true);
      window.removeEventListener("hashchange", release);
      window.removeEventListener("resize", release);
    },
  };
}
