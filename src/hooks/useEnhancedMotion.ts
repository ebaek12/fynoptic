import { useEffect, useState } from 'react';

type Connection = EventTarget & { saveData?: boolean };

/** Start with ordinary document flow. Only opt into decorative motion after hydration. */
export function useEnhancedMotion() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const device = navigator as Navigator & { deviceMemory?: number; connection?: Connection };
    const media = matchMedia('(prefers-reduced-motion: no-preference) and (min-width: 900px) and (min-height: 700px)');
    const update = () => setEnabled(
      media.matches && !device.connection?.saveData &&
      !(device.deviceMemory && device.deviceMemory <= 4) &&
      !(device.hardwareConcurrency && device.hardwareConcurrency <= 2)
    );
    update();
    media.addEventListener('change', update);
    device.connection?.addEventListener('change', update);
    return () => {
      media.removeEventListener('change', update);
      device.connection?.removeEventListener('change', update);
    };
  }, []);
  return enabled;
}
