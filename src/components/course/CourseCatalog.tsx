import { COURSE_ONE_LOCK_MESSAGE, outlineHref, type CourseOutline } from '../../data/course-catalog';
import { useCourseAccess } from '../../hooks/useCourseAccess';

export type CourseCardData = Pick<CourseOutline, 'number' | 'id' | 'title' | 'subtitle' | 'description' | 'ready' | 'lessonHref' | 'duration'> & { moduleCount: number };

export function CourseCatalog({ courses }: { courses: CourseCardData[] }) {
  const { hydrated, courseOneDone, subscriptionStep } = useCourseAccess();
  return <div id="catalog" className="library-grid" aria-busy={!hydrated}>
    {courses.map(course => {
      const locked = course.number > 1 && !courseOneDone;
      const available = course.ready && !locked;
      const complete = course.number === 1 ? courseOneDone : course.number === 2 && subscriptionStep === 8;
      return <article key={course.id} className={`library-card ${available ? 'library-card--available' : 'library-card--locked'}`} data-course-id={course.id}>
        <div className="library-card-top"><span>Course {String(course.number).padStart(2, '0')}</span><span className={available ? 'library-available' : undefined}>{locked ? 'Locked' : complete ? 'Completed' : available ? 'Available now' : 'Outline available'}</span></div>
        <h2>{course.title}</h2><p className="library-subtitle">{course.subtitle}</p>
        <p className="library-description">{course.description}</p>
        <div className="library-card-bottom">
          <p className="library-format">{course.moduleCount} modules · {course.duration}</p>
          {locked ? <><p className="library-lock">{COURSE_ONE_LOCK_MESSAGE}</p><p className="library-lock-hint">Finish its lessons, exercises, and final quiz with at least 80%.</p></> : available ? <>
            <a className="btn btn-primary" href={course.lessonHref} aria-label={`Open course ${course.title}${course.number === 1 ? ': How to Spot Them' : ''}`}>{complete ? 'Revisit Course' : course.number === 2 && subscriptionStep > 0 ? 'Continue Course' : 'Open Course'} <span aria-hidden="true">→</span></a>
            {course.number === 2 && subscriptionStep > 0 && <p className="library-lock-hint">{Math.round(subscriptionStep / 8 * 100)}% complete · Saved in this browser</p>}
          </> : <><p className="library-lock">Course 1 complete</p><p className="library-lock-hint">Explore the outline. Full lessons are being prepared.</p></>}
          <a className="library-preview" href={outlineHref(course)} aria-label={`View course outline: ${course.title}`}>View course outline →</a>
        </div>
      </article>;
    })}
  </div>;
}
