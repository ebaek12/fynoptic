import { useEffect, useState } from 'react';

type Connection = EventTarget & { saveData?: boolean };

/** Honor explicit preferences. Hardware estimates must not disable the normal site. */
export function useEnhancedMotion({ minWidth = 0, minHeight = 0 } = {}) {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: Connection }).connection;
    const media = matchMedia(`(prefers-reduced-motion: no-preference) and (min-width: ${minWidth}px) and (min-height: ${minHeight}px)`);
    const update = () => setEnabled(media.matches && !connection?.saveData);
    update();
    media.addEventListener('change', update);
    connection?.addEventListener('change', update);
    return () => {
      media.removeEventListener('change', update);
      connection?.removeEventListener('change', update);
    };
  }, [minWidth, minHeight]);
  return enabled;
}
