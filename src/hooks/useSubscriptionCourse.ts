import { useCallback, useEffect, useRef, useState } from 'react';
import { loadCourseState } from '../lib/progress';
import { courseOneComplete, initialSubscriptionProgress, parseSubscriptionProgress, reduceSubscription, SUBSCRIPTION_KEY, type SubscriptionAction } from '../lib/subscription-progress';

export function useSubscriptionCourse() {
  const [state, setState] = useState(initialSubscriptionProgress);
  const [hydrated, setHydrated] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const lastSaved = useRef('');
  useEffect(() => {
    const refresh = () => {
      setUnlocked(courseOneComplete(loadCourseState()));
      try {
        const raw = localStorage.getItem(SUBSCRIPTION_KEY);
        lastSaved.current = raw ?? '';
        setState(parseSubscriptionProgress(raw));
      } catch { setSaveFailed(true); }
      setHydrated(true);
    };
    refresh();
    const onStorage = (event: StorageEvent) => { if (!event.key || [SUBSCRIPTION_KEY, 'ff_dp_state'].includes(event.key)) refresh(); };
    const onFocus = () => setUnlocked(courseOneComplete(loadCourseState()));
    const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) refresh(); };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    window.addEventListener('pageshow', onPageShow);
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('focus', onFocus); window.removeEventListener('pageshow', onPageShow); };
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    const raw = JSON.stringify(state);
    if (raw === lastSaved.current) return;
    try { localStorage.setItem(SUBSCRIPTION_KEY, raw); lastSaved.current = raw; setSaveFailed(false); }
    catch { setSaveFailed(true); }
  }, [state, hydrated]);
  const dispatch = useCallback((action: SubscriptionAction) => {
    const allowed = courseOneComplete(loadCourseState());
    setUnlocked(allowed);
    setState(previous => reduceSubscription(previous, action, allowed));
  }, []);
  return { state, dispatch, hydrated, unlocked, saveFailed };
}
