import { useEffect, useRef } from 'react';
import { useEnhancedMotion } from '../../hooks/useEnhancedMotion';
import { RACK_ITEMS } from './rack-data';
import '../../styles/learning-resources.css';

/** Scroll focus is decorative. Every card remains a native, fully visible link. */
export function RackFocus() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const enhancedMotion = useEnhancedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!enhancedMotion || !section || !track || !stage) return;
    const cards = Array.from(stage.querySelectorAll<HTMLElement>('.learning-card'));
    let fits = false;
    let pinTop = 0;

    const render = () => {
      if (!fits) return;
      const bounds = track.getBoundingClientRect();
      if (bounds.bottom < 0 || bounds.top > innerHeight) return;
      const travel = Math.max(1, track.offsetHeight - stage.offsetHeight);
      const progress = Math.max(0, Math.min(1, (pinTop - bounds.top) / travel));
      const position = progress * (cards.length - 1);
      cards.forEach((card, index) => {
        const focus = Math.max(0, 1 - Math.abs(position - index));
        card.style.setProperty('--card-lift', `${-6 * focus}px`);
        card.dataset.focused = String(Math.round(position) === index);
      });
    };
    const measure = () => {
      pinTop = parseFloat(getComputedStyle(stage).top) || 0;
      // Content size, including enlarged text, decides whether pinning is safe.
      fits = stage.offsetHeight + pinTop + 32 <= innerHeight;
      section.dataset.scrollFocus = String(fits);
      if (!fits) cards.forEach(card => {
        card.style.removeProperty('--card-lift');
        delete card.dataset.focused;
      });
      render();
    };

    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(stage);
    window.addEventListener('resize', measure);
    // No animation loop or delayed scrub: throttled frames cannot lock the links.
    window.addEventListener('scroll', render, { passive: true });
    return () => {
      resize.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', render);
      delete section.dataset.scrollFocus;
      cards.forEach(card => {
        card.style.removeProperty('--card-lift');
        delete card.dataset.focused;
      });
    };
  }, [enhancedMotion]);

  return (
    <section ref={sectionRef} className="learning-resources" aria-labelledby="rack-heading">
      <div ref={trackRef} className="learning-track">
        <div ref={stageRef} className="learning-stage">
          <div className="learning-lead">
            <h2 id="rack-heading">Get smarter with your money.</h2>
            <p>Spot the fees, read the fine print, and know when to walk away. Start with a course or pick something to practice.</p>
          </div>
          <div className="learning-grid">
            {RACK_ITEMS.map((item, index) => (
              <a className="learning-card" href={item.href} key={item.id} data-rack-panel={item.id}>
                <span className="learning-card-number" aria-hidden="true">0{index + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <span className="learning-card-action">Explore {item.title} <span aria-hidden="true">↗</span></span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default RackFocus;
