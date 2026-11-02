import { useEffect, useState } from 'react';
import { loadCourseState } from '../../lib/progress';
import { courseOneComplete, parseSubscriptionProgress, subscriptionStep, SUBSCRIPTION_KEY } from '../../lib/subscription-progress';

export function SubscriptionProfileProgress() {
  const [progress, setProgress] = useState({ unlocked: false, step: 0 });
  useEffect(() => {
    const read = () => {
      let step = 0;
      try { step = subscriptionStep(parseSubscriptionProgress(localStorage.getItem(SUBSCRIPTION_KEY))); } catch { /* Storage is optional. */ }
      setProgress({ unlocked: courseOneComplete(loadCourseState()), step });
    };
    read(); window.addEventListener('storage', read); window.addEventListener('focus', read); window.addEventListener('pageshow', read);
    return () => { window.removeEventListener('storage', read); window.removeEventListener('focus', read); window.removeEventListener('pageshow', read); };
  }, []);
  return <div className="account-subscription-course">
    <h3>Subscriptions & Memberships</h3><p>Six guided modules on costs, renewals, and cancellations.</p>
    {progress.unlocked ? <><div className="account-progress-meta"><span>{Math.round(progress.step / 8 * 100)}% complete</span><span>About 60 minutes</span></div><div className="account-progress" role="progressbar" aria-label="Subscriptions course progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.step / 8 * 100)}><div style={{ width: `${progress.step / 8 * 100}%` }} /></div><a className="btn btn-primary" href="/coursetwo">{progress.step === 8 ? 'Revisit Course 2' : progress.step ? 'Continue Course 2' : 'Start Course 2'}</a></> : <p>Complete Course 1 and its final quiz to unlock this course.</p>}
  </div>;
}
