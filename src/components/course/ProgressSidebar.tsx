import { SECTION_ORDER, type SectionId, type SectionLocks, type StepStatus } from '../../hooks/useCourseState';
import { COURSE_SECTIONS } from './CourseOne';

export function ProgressSidebar({ steps, locks, active, onNavigate }: {
  steps: readonly StepStatus[];
  locks: SectionLocks;
  active: SectionId;
  onNavigate(section: SectionId): void;
}) {
  const learningSteps = steps.filter(step => step.key !== 'cert');
  const done = learningSteps.filter(step => step.done).length;
  return <aside className="course-outline" aria-label="Course progress">
    <div className="course-outline-heading"><strong>Course One</strong><span>{Math.round(done / learningSteps.length * 100)}% complete</span></div>
    <progress className="course-meter" max={learningSteps.length} value={done} aria-label="Course progress" />
    <nav aria-label="Course sections"><ol>
      {SECTION_ORDER.map((id, index) => <li key={id}>
        <button type="button" disabled={locks[id].locked} aria-current={active === id ? 'step' : undefined} onClick={() => onNavigate(id)}>
          <span className="course-outline-number" aria-hidden="true">{locks[id].complete ? '✓' : String(index + 1).padStart(2, '0')}</span>
          <span>{COURSE_SECTIONS[id]}<small>{id === '#certificate' && !locks[id].locked ? 'Ready to download' : locks[id].complete ? 'Complete' : locks[id].locked ? 'Not started' : 'Ready to continue'}</small></span>
        </button>
      </li>)}
    </ol></nav>
    <p className="course-save-note">Progress saves in this browser. You can come back whenever you’re ready.</p>
  </aside>;
}
