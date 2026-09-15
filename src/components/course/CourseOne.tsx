import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useCourseState, SECTION_ORDER, type PostQuizSubmission, type QuizSubmission, type SectionId } from '../../hooks/useCourseState';
import type { CourseState } from '../../lib/progress';
import { PreQuiz } from './PreQuiz';
import { Module } from './Module';
import { IdExercise } from './IdExercise';
import { RiskAudit } from './RiskAudit';
import { PostQuiz } from './PostQuiz';
import { Certificate } from './Certificate';
import { ProgressSidebar } from './ProgressSidebar';

export interface PreQuizProps {
  state: CourseState['preQuiz'];
  locked: boolean;
  /** Fires on every choice change, before submit (autosave parity with course-one.ts:800-803). */
  onAnswerChange(idx: number, value: number): void;
  /** Caller grades PRE_ITEMS itself and passes the result; toast/track/scroll-into-view stay here, not in the hook. */
  onSubmit(result: QuizSubmission): void;
}

export type ModuleProps =
  | {
      unit: 1 | 2 | 3;
      locked: boolean;
      videoDone: boolean;
      articleDone: boolean;
      mdPath: string;
      onVideoDone(): void;
      onArticleDone(): void;
      /** unit 3 only — #drills/#drills-check/#drill-checklist (course-one.ts:1028-1044). Does not affect any lock. */
      onDrillsChecked?: () => void;
    }
  | {
      unit: 4;
      locked: boolean;
      articleDone: boolean;
      mdPath: string;
      onArticleDone(): void;
    };

export interface IdExerciseProps {
  locked: boolean;
  done: boolean;
  onComplete(): void;
}

export interface RiskAuditProps {
  locked: boolean;
  auditSubmitted: boolean;
  auditId: string | null;
  /**
   * `ff_risk_audits` (Appendix B) is a SEPARATE localStorage key from
   * CourseState — an append-only array of full audit entries
   * ({id, dateISO, merchant, action, date, channel, saw, patterns, evidence}).
   * It is not part of `useCourseState`'s contract. RiskAudit.tsx should own
   * reading/writing it directly (course-one.ts:1102-1119 is the exact
   * shape to port) — e.g. add getRiskAudits/appendRiskAudit to
   * src/lib/storage.ts, following the getCourseProgress/getArticlesRead
   * convention already there. Call `onSubmit(entry.id)` after appending, to
   * update the CourseState side (m4.auditSubmitted/auditId).
   */
  onSubmit(auditId: string): void;
}

export interface PostQuizProps {
  state: CourseState['postQuiz'];
  locked: boolean;
  onAnswerChange(idx: number, value: number): void;
  onSubmit(result: PostQuizSubmission): void;
  onRetake(): void;
}

export interface CertificateProps {
  /** state.postQuiz.score, for '#cert-score'. */
  postQuizScore: number;
  certificate: CourseState['certificate'];
  /**
   * Mints (or, if already issued, returns the existing) id/date and marks
   * `certificate.issued`. Call this from both '#download-cert' and
   * '#download-badge' click handlers, exactly like course-one.ts's
   * prepareCertificate() did before window.print()/the badge export.
   */
  onIssue(): { id: string; date: string };
  /**
   * NOT sourced from CourseOne/useCourseState — Certificate.tsx should read
   * this itself: `getUserName() ?? user.displayName ?? 'Learner'` (O5/O6).
   * `#learner-name`/`#save-name` never existed in courseone.astro's markup
   * (Appendix E) and are not being reintroduced; ff_user_name's sole writer
   * is ProfileSettings.tsx (already shipped, Phase 10c).
   */
}


export const COURSE_SECTIONS: Record<SectionId, string> = {
  '#pre-quiz': 'Prequiz', '#module-1': 'Foundations', '#module-2': 'Spot the pattern',
  '#module-3': 'Push back', '#module-4': 'Keep the evidence', '#post-quiz': 'Final quiz', '#certificate': 'Your certificate',
};
const headings: Record<SectionId, string> = {
  '#pre-quiz': 'pre-title', '#module-1': 'm1-title', '#module-2': 'm2-title', '#module-3': 'm3-title',
  '#module-4': 'm4-title', '#post-quiz': 'post-title', '#certificate': 'cert-title',
};
const paths = { 1: '/content/01-foundations.md', 2: '/content/02-families.md', 3: '/content/03-counter-moves.md', 4: '/content/04-evidence.md' };

export function CourseOne() {
  const { state, steps, currentStepIndex, locks, actions, hydrated } = useCourseState();
  const [selected, setSelected] = useState<SectionId | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const current = steps[currentStepIndex]?.section ?? '#pre-quiz';
  const active = selected && !locks[selected].locked ? selected : current;
  const navigate = (section: SectionId) => {
    if (locks[section].locked) return;
    document.querySelectorAll<HTMLVideoElement>('.course-workspace video').forEach(video => video.pause());
    setSelected(section);
    history.replaceState(null, '', section);
    contentRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
  };
  useEffect(() => {
    if (!hydrated) return;
    const readHash = () => {
      const requested = location.hash;
      const lesson = requested.match(/^#lesson-0([1-4])-/);
      const hash = (lesson ? `#module-${lesson[1]}` : requested) as SectionId;
      if (SECTION_ORDER.includes(hash) && !locks[hash].locked) setSelected(hash);
    };
    readHash();
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, [hydrated, locks]);
  useEffect(() => {
    if (selected) {
      const heading = document.getElementById(headings[active]);
      heading?.setAttribute('tabindex', '-1');
      heading?.focus({ preventScroll: true });
    }
  }, [active, selected]);

  function section(id: SectionId, children: ReactNode) {
    const next = SECTION_ORDER[SECTION_ORDER.indexOf(id) + 1];
    return <section key={id} id={id.slice(1)} className="course-section" hidden={active !== id} aria-labelledby={headings[id]}>
      {children}
      {next && <div className="course-section-next">
        <p>{locks[id].complete ? 'Section complete. Ready for the next one?' : id === '#pre-quiz' ? 'Finish the prequiz to open your first lesson.' : id === '#post-quiz' ? 'Pass the final quiz to earn your certificate.' : 'Complete the lesson activities to continue.'}</p>
        <button className="course-button" disabled={locks[next].locked} onClick={() => navigate(next)}>Continue to {COURSE_SECTIONS[next].toLowerCase()} <span aria-hidden="true">→</span></button>
      </div>}
    </section>;
  }
  return <div className="course-workspace">
    <ProgressSidebar steps={steps} locks={locks} active={active} onNavigate={navigate} />
    <div className="course-main" ref={contentRef} aria-busy={!hydrated}>
      {!hydrated ? <p role="status" className="course-load-state">Loading your progress…</p> : <>
        {section('#pre-quiz', <PreQuiz state={state.preQuiz} locked={false} onAnswerChange={actions.setPreQuizAnswer} onSubmit={result => { setSelected('#pre-quiz'); actions.submitPreQuiz(result); }} />)}
        {([1, 2, 3] as const).map(unit => {
          const id = `#module-${unit}` as SectionId;
          return !locks[id].locked && section(id, <>
            <Module unit={unit} locked={false} videoDone={state[`m${unit}`].video} articleDone={state[`m${unit}`].article} mdPath={paths[unit]}
              onVideoDone={() => { setSelected(id); actions.setModuleVideoDone(unit); }}
              onArticleDone={() => { setSelected(id); actions.setModuleArticleDone(unit); }}
              onDrillsChecked={actions.setDrillsChecked} />
            {unit === 2 && <IdExercise locked={false} done={state.m2.idExercise} onComplete={() => { setSelected(id); actions.completeIdExercise(); }} />}
          </>);
        })}
        {!locks['#module-4'].locked && section('#module-4', <>
          <Module unit={4} locked={false} articleDone={state.m4.article} mdPath={paths[4]} onArticleDone={() => { setSelected('#module-4'); actions.setModuleArticleDone(4); }} />
          <RiskAudit locked={false} auditSubmitted={state.m4.auditSubmitted} auditId={state.m4.auditId} onSubmit={id => { setSelected('#module-4'); actions.completeAudit(id); }} />
        </>)}
        {!locks['#post-quiz'].locked && section('#post-quiz', <PostQuiz state={state.postQuiz} locked={false} onAnswerChange={actions.setPostQuizAnswer} onSubmit={result => { setSelected('#post-quiz'); actions.submitPostQuiz(result); }} onRetake={actions.retakePostQuiz} />)}
        {state.postQuiz.pass && section('#certificate', <Certificate postQuizScore={state.postQuiz.score} certificate={state.certificate} onIssue={actions.issueCertificate} />)}
      </>}
    </div>
  </div>;
}
