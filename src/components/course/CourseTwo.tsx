import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { COURSE_TWO_SOURCES, readingSeconds, SUBSCRIPTION_FINAL, SUBSCRIPTION_LESSONS, SUBSCRIPTION_PREQUIZ } from '../../data/course-two';
import { useSubscriptionCourse } from '../../hooks/useSubscriptionCourse';
import { allAnswered, fieldCorrect, finalPassed, quizScore, subscriptionStep, type LessonProgress, type SubscriptionAction, type SubscriptionProgress } from '../../lib/subscription-progress';
import { CourseQuiz } from './CourseQuiz';

const TITLES = ['Your starting point', ...SUBSCRIPTION_LESSONS.map(lesson => lesson.title), 'Final assessment', 'Your certificate'];
const MINUTES = [3, ...SUBSCRIPTION_LESSONS.map(lesson => lesson.minutes), 8, 0];
const HASHES = ['#start', ...SUBSCRIPTION_LESSONS.map((_, i) => `#lesson-${i + 1}`), '#assessment', '#certificate'];
type Dispatch = (action: SubscriptionAction) => void;

function LockIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>;
}

function LessonReading({ index, progress, dispatch }: { index: number; progress: LessonProgress; dispatch: Dispatch }) {
  const lesson = SUBSCRIPTION_LESSONS[index]!;
  const [selected, setSelected] = useState(Math.min(progress.read, lesson.sections.length - 1));
  const [atEnd, setAtEnd] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousPart = useRef(selected);
  const lastActivity = useRef(0);
  const reading = lesson.sections[selected]!;
  const required = readingSeconds(reading);
  const seconds = progress.seconds[selected] ?? 0;
  const done = selected < progress.read;
  useEffect(() => { lastActivity.current = Date.now(); }, [index, selected]);
  useEffect(() => {
    const interact = () => { lastActivity.current = Date.now(); };
    window.addEventListener('scroll', interact, { passive: true });
    window.addEventListener('pointerdown', interact, { passive: true });
    window.addEventListener('keydown', interact);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - lastActivity.current < 120_000 && selected === progress.read) dispatch({ type: 'tick', lesson: index, section: selected });
    }, 1000);
    return () => {
      clearInterval(timer);
      window.removeEventListener('scroll', interact);
      window.removeEventListener('pointerdown', interact);
      window.removeEventListener('keydown', interact);
    };
  }, [dispatch, index, selected, progress.read]);
  useLayoutEffect(() => {
    setAtEnd(false);
    // Finish the navigation scroll before paint. A deferred animation frame
    // could otherwise move the page after the learner has started scrolling.
    if (previousPart.current !== selected) {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
      previousPart.current = selected;
    }
    if (!end.current) return;
    if (!('IntersectionObserver' in window)) { setAtEnd(true); return; }
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) setAtEnd(true); });
    observer.observe(end.current);
    return () => observer.disconnect();
  }, [selected]);
  const choose = (part: number) => {
    setSelected(part);
  };
  const complete = () => {
    if (!atEnd || seconds < required) return;
    dispatch({ type: 'read', lesson: index, section: selected });
    if (selected < lesson.sections.length - 1) choose(selected + 1);
  };
  return <article className="course-reading-panel">
    <div className="course-reading-top"><span className="course-eyebrow">01 / READ & UNDERSTAND</span><span>{progress.read} of {lesson.sections.length} parts complete</span></div>
    <nav className="course-reading-tabs" aria-label="Reading parts">
      {lesson.sections.map((section, i) => <button key={section.title} disabled={i > progress.read} aria-current={i === selected ? 'step' : undefined} onClick={() => choose(i)} aria-label={`Part ${i + 1}: ${section.title}${i < progress.read ? ', complete' : i > progress.read ? ', locked' : ''}`}><span>{i < progress.read ? '✓' : `0${i + 1}`}</span><span>{section.title}</span></button>)}
    </nav>
    <div className="course-longform">
      <p className="course-eyebrow">PART {selected + 1} OF {lesson.sections.length}</p>
      <h3 ref={heading} tabIndex={-1} className="course-reading-title">{reading.title}</h3>
      {reading.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
      {reading.bullets && <ul>{reading.bullets.map(item => <li key={item}>{item}</li>)}</ul>}
      {reading.table && <div className="course-table-scroll"><table><thead><tr>{reading.table.headings.map(title => <th key={title} scope="col">{title}</th>)}</tr></thead><tbody>{reading.table.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => j === 0 ? <th scope="row" key={j}>{cell}</th> : <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>}
      <aside className="course-takeaway"><span>THE TAKEAWAY</span><p>{reading.takeaway}</p></aside>
      <div ref={end} className="course-article-end" data-reading-end />
      <div className="course-reading-gate">
        <div><strong>{done ? 'Reading saved' : seconds < required ? 'Take a moment with this section' : 'Ready to check off this part'}</strong><p>{done ? 'You can revisit any completed part.' : seconds < required ? `${required - seconds}s of active reading remaining. The timer pauses when this tab is hidden.` : atEnd ? 'Continue when you have read and understood the section.' : 'Read to the end of this section to continue.'}</p></div>
        <button className="course-button" disabled={done || !atEnd || seconds < required} onClick={complete}>{done ? '✓ Part completed' : selected === lesson.sections.length - 1 ? 'Finish reading' : 'Complete part & continue →'}</button>
      </div>
    </div>
  </article>;
}

function LessonActivity({ index, progress, dispatch }: { index: number; progress: LessonProgress; dispatch: Dispatch }) {
  const lesson = SUBSCRIPTION_LESSONS[index]!;
  const [checked, setChecked] = useState(false);
  const allRead = progress.read === lesson.sections.length;
  if (!allRead) return <div className="course-locked-activity"><LockIcon /><div><strong>Practice opens after the reading</strong><p>Complete all four parts, then apply what you learned to a worked case.</p></div></div>;
  return <div className="course-practice-panel" id={`activity-${index + 1}`}>
    <span className="course-eyebrow">02 / PUT IT TO WORK</span>
    <h3>{lesson.activity.title}</h3>
    <p className="course-intro">{lesson.activity.brief}</p>
    <div className="course-case-file"><span>YOUR CASE FILE · FICTIONAL EXAMPLE</span><ul>{lesson.activity.facts.map(fact => <li key={fact}>{fact}</li>)}</ul></div>
    <form onSubmit={event => { event.preventDefault(); setChecked(true); dispatch({ type: 'check-activity', lesson: index }); }}>
      <div className="course-lab-fields">
        {lesson.activity.fields.map((field, i) => {
          const id = `lab-${index}-${i}`;
          const correct = fieldCorrect(index, i, progress.fields[i] ?? '');
          const showResult = checked || progress.activityPassed;
          const props = { id, value: progress.fields[i] ?? '', disabled: progress.activityPassed, required: true, 'aria-invalid': showResult && !correct || undefined, 'aria-describedby': showResult ? `${id}-feedback` : undefined, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => dispatch({ type: 'field', lesson: index, index: i, value: event.target.value }) };
          return <div key={id}><label htmlFor={id}>{field.label}</label>{field.type === 'select' ? <select {...props}><option value="">Choose an answer</option>{field.options?.map(option => <option key={option}>{option}</option>)}</select> : <input {...props} type={field.type} min={field.type === 'number' ? '0' : undefined} step={field.type === 'number' ? 'any' : undefined} />}
            {showResult && <p id={`${id}-feedback`} className={`course-field-feedback ${correct ? 'correct' : 'incorrect'}`}>{correct ? '✓ Correct. ' : 'Try again. '}{field.explanation}</p>}
          </div>;
        })}
      </div>
      <button type="submit" className="course-button" disabled={progress.activityPassed || !lesson.activity.fields.every((_, i) => progress.fields[i]?.trim())}>{progress.activityPassed ? '✓ Activity complete' : 'Check my work'}</button>
      <p role="status" className="course-lab-status">{progress.activityPassed ? 'Your worked case is saved. Complete the knowledge check below to unlock the next step.' : checked ? 'Review the feedback and correct any answers that need another look.' : 'Every answer must be correct. You can revise your work as often as needed.'}</p>
    </form>
  </div>;
}

function KnowledgeCheck({ index, progress, dispatch }: { index: number; progress: LessonProgress; dispatch: Dispatch }) {
  const lesson = SUBSCRIPTION_LESSONS[index]!;
  const passed = progress.checked && quizScore(lesson.questions, progress.answers) === 100;
  if (!progress.activityPassed) return null;
  return <div className="course-check-panel">
    <span className="course-eyebrow">03 / CHECK YOUR UNDERSTANDING</span>
    <h3>Two decisions. Make them count.</h3>
    <p className="course-intro">Answer both correctly to finish this module. Feedback will help you revise.</p>
    {lesson.questions.map((question, i) => <fieldset className="course-check-question" key={question.stem}><legend>{i + 1}. {question.stem}</legend>
      <div className="course-answers">{question.options.map((option, j) => <label className="course-answer" key={option} data-state={progress.answers[i] === j ? 'selected' : undefined}>
        <input type="radio" name={`check-${index}-${i}`} value={j} checked={progress.answers[i] === j} disabled={passed} onChange={() => dispatch({ type: 'lesson-answer', lesson: index, index: i, value: j })} />
        <span className="course-answer-letter" aria-hidden="true">{String.fromCharCode(65 + j)}</span><span>{option}</span>
      </label>)}</div>
      {progress.checked && <p className={`course-field-feedback ${progress.answers[i] === question.answerIndex ? 'correct' : 'incorrect'}`}>{progress.answers[i] === question.answerIndex ? '✓ Correct. ' : 'Review this one. '}{question.rationale}</p>}
    </fieldset>)}
    <button className="course-button" disabled={passed || !allAnswered(lesson.questions, progress.answers)} onClick={() => dispatch({ type: 'check-lesson', lesson: index })}>{passed ? '✓ Knowledge check passed' : 'Check understanding'}</button>
    <p role="status" className="course-lab-status">{passed ? 'Module complete. Your next step is unlocked.' : progress.checked ? 'Both answers need to be correct. Review the feedback, make changes, and check again.' : ''}</p>
  </div>;
}

function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function CourseCompletion({ state, dispatch }: { state: SubscriptionProgress; dispatch: Dispatch }) {
  const [name, setName] = useState(state.certificate?.name ?? '');
  if (!finalPassed(state)) return null;
  const score = quizScore(SUBSCRIPTION_FINAL, state.final.answers);
  const print = () => {
    if (!name.trim() && !state.certificate) return;
    flushSync(() => dispatch({ type: 'certificate', name, date: new Date().toISOString().slice(0, 10), id: `FYN-SM-${crypto.randomUUID().slice(0, 8).toUpperCase()}` }));
    window.print();
  };
  const worksheet = () => {
    const record = SUBSCRIPTION_LESSONS.map((lesson, i) => `${i + 1}. ${lesson.title}\n${lesson.activity.fields.map((field, j) => `${field.label}: ${state.lessons[i]!.fields[j]}`).join('\n')}`).join('\n\n');
    downloadText('Fynoptic-Subscription-Workbook.txt', `FYNOPTIC — SUBSCRIPTIONS & MEMBERSHIPS\nCourse completed. Final assessment: ${score}%\n\nYOUR WORKED CASES (FICTIONAL)\n${record}\n\nYOUR REUSABLE SUBSCRIPTION WORKSHEET\nCopy this block for each service. Use nicknames; leave out passwords and full payment numbers.\n\nService and purpose:\nBilling provider / account nickname:\nPrice today:\nNormal price and billing interval:\nMinimum commitment:\nNext payment amount and date / time zone:\nCancellation route and cutoff:\nTrial or renewal review reminder:\nActual use / reason to keep:\nDecision: keep / change / cancel / investigate\nCancellation requested on:\nCancellation effective on:\nAccess ends on:\nEvidence saved at:\nRefund status (if applicable):\nFollow-up date and result:\n\nMONTHLY REVIEW\nReconcile receipts and statements. Review upcoming renewals. Finish pending cancellations. Verify expected credits.\n\nLEARNING REFERENCES\n${COURSE_TWO_SOURCES.map(source => `${source.title}\n${source.url}`).join('\n\n')}\n\nEducational course completion; not a professional credential. Examples are fictional.\n`);
  };
  return <>
    <span className="course-eyebrow">COURSE 02 / COMPLETE</span><h2 id="subscription-heading" tabIndex={-1}>A little more control.<br />Every single month.</h2>
    <p className="course-intro">You’ve completed all six modules, solved every case, and passed the final assessment with {score}%. Keep the method, your worked examples, and a certificate of completion.</p>
    <div className="course-award"><div className="course-award-seal" aria-hidden="true">✓</div><div><span className="course-eyebrow">FYNOPTIC CLASSROOM</span><h3>Subscription Savvy</h3><p>Costs understood. Renewals planned. Decisions documented.</p></div></div>
    <div className="content-card"><label htmlFor="subscription-certificate-name">Name on your certificate</label><input id="subscription-certificate-name" value={state.certificate?.name ?? name} disabled={!!state.certificate} maxLength={100} onChange={event => setName(event.target.value)} autoComplete="name" placeholder="Your name" />
      <div className="gate"><button className="course-button" disabled={!state.certificate && !name.trim()} onClick={print}>Print or save certificate</button><button className="course-button secondary" onClick={worksheet}>Download workbook (.txt)</button></div><p className="course-muted">Choose “Save as PDF” in the print dialog. Your workbook includes the worked cases and a reusable subscription tracker.</p>
    </div>
    <div className="course-completion-note"><h3>Keep the habit going</h3><p>Choose a monthly review date, check your next renewal, and put the worksheet somewhere you will use it. More courses are being prepared; you can revisit either completed course anytime.</p><a className="course-button secondary" href="/courses">Back to all courses →</a></div>
    <div className="certificate-sheet" aria-hidden="true"><div className="cert-header"><span className="course-certificate-brand">FYNOPTIC</span><p>THE CLASSROOM / COURSE 02</p></div><p className="course-eyebrow">CERTIFICATE OF COMPLETION</p><h2>Subscriptions & Memberships</h2><p className="cert-body-text">Awarded to <strong>{state.certificate?.name ?? name}</strong> for completing six guided modules, all practical exercises, and the final assessment with a score of <strong>{score}%</strong>.</p><p>Issued: {state.certificate?.date} · Record: {state.certificate?.id}</p><p>Free educational course · Approximately 60 minutes · Fynoptic</p></div>
  </>;
}

export function CourseTwo() {
  const { state, dispatch, hydrated, unlocked, saveFailed } = useSubscriptionCourse();
  const step = subscriptionStep(state);
  const [selected, setSelected] = useState<number | null>(null);
  const active = selected !== null && selected <= step ? selected : step;
  const main = useRef<HTMLDivElement>(null);
  const previousStep = useRef(active);
  useLayoutEffect(() => {
    if (active !== previousStep.current && hydrated && unlocked) {
      main.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
      document.getElementById('subscription-heading')?.focus({ preventScroll: true });
      previousStep.current = active;
    }
  }, [active, hydrated, unlocked]);
  useEffect(() => {
    if (!hydrated || !unlocked) return;
    const readHash = () => {
      const requested = HASHES.indexOf(location.hash);
      if (requested >= 0 && requested <= step) setSelected(requested);
      else if (location.hash) { setSelected(step); history.replaceState(null, '', HASHES[step]); }
    };
    readHash(); window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, [hydrated, unlocked, step]);
  const navigate = (next: number) => {
    if (next > step || !unlocked) return;
    setSelected(next); history.replaceState(null, '', HASHES[next]);
  };
  if (!hydrated) return <div className="course-workspace"><p role="status" className="course-load-state">Loading your course progress…</p></div>;
  if (!unlocked) return <div className="course-prerequisite">
    <div className="course-prerequisite-copy"><div className="course-lock-symbol"><LockIcon /></div><span className="course-eyebrow">BUILD ON YOUR FOUNDATIONS</span><h2>First, finish Course 1.</h2><p>Complete the Dark Patterns lessons, exercises, and final quiz with at least 80% to unlock this course. Your progress is checked here as well as in the course library.</p><a className="course-button" href="/courseone">Continue Course 1 →</a><p className="course-save-note">Use the same browser and device where you saved your progress.</p></div>
    <div className="course-syllabus-preview"><span className="course-eyebrow">WAITING FOR YOU / ABOUT 60 MINUTES</span><h3>Your next six skills</h3><ol>{SUBSCRIPTION_LESSONS.map(lesson => <li key={lesson.title}><span>{lesson.title}</span><small>{lesson.minutes} min</small></li>)}</ol><p>Plus a 3-minute starting quiz and an 8-minute final assessment.</p></div>
  </div>;
  const lesson = active >= 1 && active <= 6 ? SUBSCRIPTION_LESSONS[active - 1]! : null;
  return <div className="course-workspace">
    <aside className="course-outline" aria-label="Course progress"><div className="course-outline-heading"><strong>Course Two</strong><span>{Math.round(step / 8 * 100)}% complete</span></div><progress className="course-meter" max={8} value={step} aria-label="Course progress" />
      <nav aria-label="Course sections"><ol>{TITLES.map((title, i) => <li key={title}><button disabled={i > step} aria-current={active === i ? 'step' : undefined} onClick={() => navigate(i)} title={i > step ? `Complete ${TITLES[step]} first` : undefined}><span className="course-outline-number" aria-hidden="true">{i > step ? <LockIcon /> : i < step || i === 8 && finalPassed(state) ? '✓' : String(i).padStart(2, '0')}</span><span>{title}<small>{i < step ? 'Complete · Revisit anytime' : i > step ? 'Locked · Finish the previous step' : i === 8 ? 'Ready to save' : `${MINUTES[i]} min · Ready to continue`}</small></span></button></li>)}</ol></nav>
      <p className="course-save-note">{saveFailed ? 'Progress cannot be saved in this browser right now. Keep this tab open to retain your work for this session.' : 'Your place and answers save in this browser. Take a break and pick up where you left off.'}</p>
    </aside>
    <div className="course-main" ref={main} aria-busy="false">
      {saveFailed && <p className="course-storage-warning" role="alert">Browser storage is unavailable. Your work is available in this session, but may be lost if you reload or close the tab.</p>}
      <section className="course-section" id={HASHES[active]!.slice(1)} aria-labelledby="subscription-heading" key={active}>
        {active === 0 && <><span className="course-eyebrow">START HERE / 3 MINUTES</span><h2 id="subscription-heading" tabIndex={-1}>Know what you’re signing up for.</h2><p className="course-intro">A little knowledge changes every renewal. Start with four questions, then work through six guided modules. No passing score is required on this starting quiz.</p>
          <div className="course-roadmap"><div><strong>Read with purpose</strong><p>Four focused readings per module. Each opens in order and includes an active-reading check.</p></div><div><strong>Practice the decisions</strong><p>Solve a realistic case, then answer both knowledge checks correctly to move on.</p></div><div><strong>Make the skill stick</strong><p>Pass the 12-question final with at least 80% and save your certificate and workbook.</p></div></div>
          <p className="course-context-note">Plan for about 60 minutes including reading, calculations, and review. Work at your pace; breaks are welcome. Examples are fictional and use U.S. consumer context.</p>
          <CourseQuiz id="subscription-pre" items={SUBSCRIPTION_PREQUIZ} answers={state.diagnostic.answers} completed={state.diagnostic.submitted} score={quizScore(SUBSCRIPTION_PREQUIZ, state.diagnostic.answers)} diagnostic onAnswerChange={(index, value) => dispatch({ type: 'diagnostic-answer', index, value })} onSubmit={() => { setSelected(0); dispatch({ type: 'diagnostic-submit' }); }} />
        </>}
        {lesson && <><span className="course-eyebrow">MODULE {String(active).padStart(2, '0')} OF 06 / ABOUT {lesson.minutes} MINUTES</span><h2 id="subscription-heading" tabIndex={-1}>{lesson.title}</h2><p className="course-intro">{lesson.subtitle}</p><div className="course-objective"><span>YOUR GOAL</span><p>{lesson.objective}</p></div><LessonReading index={active - 1} progress={state.lessons[active - 1]!} dispatch={dispatch} /><LessonActivity index={active - 1} progress={state.lessons[active - 1]!} dispatch={dispatch} /><KnowledgeCheck index={active - 1} progress={state.lessons[active - 1]!} dispatch={action => { setSelected(active); dispatch(action); }} /></>}
        {active === 7 && <><span className="course-eyebrow">THE FINAL ASSESSMENT / ABOUT 8 MINUTES</span><h2 id="subscription-heading" tabIndex={-1}>Put the whole method together.</h2><p className="course-intro">Twelve fresh scenarios. You need at least 80% (10 of 12 correct) to pass. Use a calculator and revisit any lesson. After submitting, review every explanation; if needed, retry with a fresh answer sheet.</p><CourseQuiz id="subscription-final" items={SUBSCRIPTION_FINAL} answers={state.final.answers} completed={state.final.submitted} score={quizScore(SUBSCRIPTION_FINAL, state.final.answers)} onAnswerChange={(index, value) => dispatch({ type: 'final-answer', index, value })} onSubmit={() => { setSelected(7); dispatch({ type: 'final-submit' }); }} onRetake={() => dispatch({ type: 'final-retry' })} /></>}
        {active === 8 && <CourseCompletion state={state} dispatch={dispatch} />}
        {active < 8 && <div className="course-section-next"><p>{active < step ? 'Step complete. Your next step is ready.' : lesson ? 'Finish all reading, the practical activity, and both knowledge checks to continue.' : active === 0 ? 'Answer all four starting questions and submit to open module 1.' : 'Pass the final assessment to earn your certificate.'}</p><button className="course-button" disabled={active + 1 > step} onClick={() => navigate(active + 1)}>Continue to {active === 0 ? 'module 1' : active < 6 ? `module ${active + 1}` : active === 6 ? 'final assessment' : 'your certificate'} →</button></div>}
      </section>
      <details className="course-sources"><summary>Course references & learning notes</summary><p>Original lessons and fictional worked examples. Provider instructions and consumer guidance checked November 1, 2026. Specific rights, deadlines, and refunds depend on the terms and applicable law.</p><ul>{COURSE_TWO_SOURCES.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a></li>)}</ul><p>Completion records are saved on this device and are educational acknowledgments, not professional credentials.</p></details>
    </div>
  </div>;
}
