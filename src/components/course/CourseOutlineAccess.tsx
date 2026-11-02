import { COURSE_ONE_LOCK_MESSAGE } from '../../data/course-catalog';
import { useCourseAccess } from '../../hooks/useCourseAccess';

export function CourseOutlineAccess({ number, ready, lessonHref }: { number: number; ready: boolean; lessonHref?: string }) {
  const { hydrated, courseOneDone } = useCourseAccess();
  const locked = number > 1 && !courseOneDone;
  return <div className="course-outline-access" aria-busy={!hydrated}>
    <div className="course-lock-symbol" aria-hidden="true">{locked ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg> : '✓'}</div>
    <span className="course-eyebrow">{number === 1 ? 'YOUR STARTING POINT' : locked ? 'BUILD ON YOUR FOUNDATIONS' : 'PREREQUISITE COMPLETE'}</span>
    <h2>{number === 1 ? 'Start with the foundations.' : locked ? 'First, finish Course 1.' : ready ? 'Your next course is ready.' : 'Your foundation is complete.'}</h2>
    <p className="course-outline-status">{locked ? COURSE_ONE_LOCK_MESSAGE : number === 1 ? 'No prerequisite. Start here.' : 'You’ve completed the Course 1 prerequisite.'}</p>
    <p>{number === 1 ? 'Learn to recognise misleading design, practise your response, and complete the final quiz. This is the foundation for every other course.' : locked ? 'Complete the Dark Patterns lessons, exercises, and final quiz with at least 80%. You can explore this course’s outline while you work toward that milestone.' : ready ? 'Your prerequisite is saved in this browser. Open the course to begin or pick up where you left off.' : 'The complete outline is available below. The full lessons and assessment are still being prepared.'}</p>
    {locked ? <a className="course-button" href="/courseone">Continue Course 1 →</a> : ready ? <a className="course-button" href={lessonHref}>{number === 1 && courseOneDone ? 'Revisit Course 1' : `Open Course ${number}`} →</a> : <a className="course-button secondary" href="/courses">Explore all courses →</a>}
    <p className="course-save-note">{!ready && locked ? 'This is a preview of the planned course. Full lessons are being prepared.' : 'Course progress saves in this browser. Use the same device to continue.'}</p>
  </div>;
}
