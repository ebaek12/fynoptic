import { useEffect, useState } from 'react';
import { loadCourseState } from '../../lib/progress';
import { courseOneComplete, parseSubscriptionProgress, SUBSCRIPTION_KEY, subscriptionStep } from '../../lib/subscription-progress';

export function CourseTwoCard() {
  const [unlocked, setUnlocked] = useState(false);
  const [step, setStep] = useState(0);
  useEffect(() => {
    const refresh = () => {
      setUnlocked(courseOneComplete(loadCourseState()));
      try { setStep(subscriptionStep(parseSubscriptionProgress(localStorage.getItem(SUBSCRIPTION_KEY)))); } catch { /* No saved progress. */ }
    };
    refresh();
    window.addEventListener('storage', refresh); window.addEventListener('focus', refresh); window.addEventListener('pageshow', refresh);
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener('focus', refresh); window.removeEventListener('pageshow', refresh); };
  }, []);
  return <article className={`library-card ${unlocked ? 'library-card--available' : 'library-card--locked'}`} data-course-id="subscriptions">
    <div className="library-card-top"><span>Course 02</span><span className={unlocked ? 'library-available' : undefined}>{unlocked ? step === 8 ? 'Completed' : 'Available now' : 'Unlock with Course 1'}</span></div>
    <h2>Subscriptions & Memberships</h2><p className="library-subtitle">Costs, renewals, and cancellations</p>
    <p className="library-description">Decode offers, plan trial deadlines, practice cancellation, and build your own renewal routine.</p>
    <div className="library-card-bottom"><p className="library-format">6 modules · About 60 minutes</p>
      {unlocked ? <><a className="btn btn-primary" href="/coursetwo" aria-label="Open course Subscriptions & Memberships">{step === 8 ? 'Revisit Course' : step > 0 ? 'Continue Course' : 'Open Course'} <span aria-hidden="true">→</span></a>{step > 0 && <p className="library-lock-hint">{Math.round(step / 8 * 100)}% complete · Saved in this browser</p>}</> : <><p className="library-lock">Locked until Course 1 is complete</p><p className="library-lock-hint">Finish its lessons, exercises, and final quiz with at least 80%.</p><a className="library-preview" href="/coursetwo">View course outline →</a></>}
    </div>
  </article>;
}
