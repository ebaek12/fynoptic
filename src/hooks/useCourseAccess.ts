import { useEffect, useState } from 'react';
import { loadCourseState } from '../lib/progress';
import { courseOneComplete, parseSubscriptionProgress, SUBSCRIPTION_KEY, subscriptionStep } from '../lib/subscription-progress';

/** Keep catalog and outline prerequisites consistent across reloads and tabs. */
export function useCourseAccess() {
  const [access, setAccess] = useState({ hydrated: false, courseOneDone: false, subscriptionStep: 0 });
  useEffect(() => {
    const refresh = () => {
      let step = 0;
      try { step = subscriptionStep(parseSubscriptionProgress(localStorage.getItem(SUBSCRIPTION_KEY))); } catch { /* Storage may be disabled. */ }
      setAccess({ hydrated: true, courseOneDone: courseOneComplete(loadCourseState()), subscriptionStep: step });
    };
    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('pageshow', refresh);
    };
  }, []);
  return access;
}
