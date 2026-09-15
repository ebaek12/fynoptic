import { useEffect, useRef, useState } from 'react';

export interface CourseQuestion {
  stem: string;
  options: readonly string[];
  answerIndex: number;
  rationale?: string;
}

interface Props {
  id: string;
  items: readonly CourseQuestion[];
  answers: readonly (number | null)[];
  completed: boolean;
  score: number;
  diagnostic?: boolean;
  onAnswerChange(index: number, value: number): void;
  onSubmit(): void;
  onRetake?: () => void;
}

/** One question at a time, with native radio controls and saved answers owned by the course. */
export function CourseQuiz({ id, items, answers, completed, score, diagnostic, onAnswerChange, onSubmit, onRetake }: Props) {
  const [index, setIndex] = useState(0);
  const prompt = useRef<HTMLHeadingElement>(null);
  const result = useRef<HTMLDivElement>(null);
  const question = items[index];
  const valid = (i: number) => Number.isInteger(answers[i]) && answers[i]! >= 0 && answers[i]! < items[i]!.options.length;
  const answered = items.filter((_, i) => valid(i)).length;
  const allAnswered = answered === items.length && items.length > 0;
  const choice = answers[index] ?? null;
  const previousIndex = useRef(index);
  const previousCompleted = useRef(completed);
  useEffect(() => {
    if (previousIndex.current !== index) {
      prompt.current?.focus({ preventScroll: true });
      prompt.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
      previousIndex.current = index;
    }
  }, [index]);
  useEffect(() => {
    if (completed) {
      result.current?.focus({ preventScroll: true });
      if (result.current?.getClientRects().length) result.current.scrollIntoView({ behavior: 'instant', block: 'start' });
    } else if (previousCompleted.current) {
      prompt.current?.focus({ preventScroll: true });
      prompt.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
    previousCompleted.current = completed;
  }, [completed]);
  if (!question) return null;

  return (
    <div className="course-quiz" id={`${id}-quiz-root`}>
      {completed && (
        <div className="course-quiz-result" id={`${id}-result`} ref={result} tabIndex={-1} role="status">
          <span className="course-eyebrow">{diagnostic ? 'Your starting point' : score >= 80 ? 'Assessment passed' : 'Keep going'}</span>
          <h3>{score}% <span>{diagnostic ? 'on your prequiz' : 'on the final quiz'}</span></h3>
          <p>{diagnostic ? 'This score is just a starting point. Review your answers below, or continue to the first lesson.' : score >= 80 ? 'You’ve completed the course. Your certificate is ready.' : 'You need 80% to pass. Review the explanations, then try again when you’re ready.'}</p>
          {onRetake && score < 80 && <button id="post-retake" className="course-button" onClick={() => { setIndex(0); onRetake(); }}>Try again</button>}
        </div>
      )}
      <div className="course-quiz-meta">
        <span>{completed ? 'Review' : 'Question'} {index + 1} of {items.length}</span>
        <span>{answered} answered</span>
      </div>
      <progress className="course-meter" max={items.length} value={answered} aria-label="Questions answered" />
      <div className="course-question" key={index}>
        <h3 ref={prompt} tabIndex={-1} id={`${id}-question`} className="course-question-title">{question.stem}</h3>
        <fieldset className="course-answers" aria-labelledby={`${id}-question`}>
          <legend className="sr-only">Choose one answer</legend>
          {question.options.map((option, i) => {
            const status = completed ? i === question.answerIndex ? 'correct' : i === choice ? 'wrong' : undefined : choice === i ? 'selected' : undefined;
            return (
              <label className="course-answer" data-state={status} key={i}>
                <input type="radio" name={`${id}-question-${index}`} value={i} checked={choice === i} disabled={completed} onChange={() => onAnswerChange(index, i)} />
                <span className="course-answer-letter" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
                <span>{option}</span>
                {completed && i === question.answerIndex && <span className="course-answer-status">Correct answer</span>}
                {completed && i === choice && i !== question.answerIndex && <span className="course-answer-status">Your answer</span>}
              </label>
            );
          })}
        </fieldset>
        {completed && question.rationale && <p className="course-explanation">{question.rationale}</p>}
      </div>
      <div className="course-question-nav">
        <button className="course-button secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}>Previous</button>
        {index < items.length - 1 ? (
          <button className="course-button" disabled={!completed && !valid(index)} onClick={() => setIndex(index + 1)}>Next question <span aria-hidden="true">→</span></button>
        ) : !completed ? (
          <button className="course-button" id={`${id}-submit`} disabled={!allAnswered} onClick={onSubmit}>{diagnostic ? 'Finish prequiz' : 'Submit answers'}</button>
        ) : <span className="course-muted">End of review</span>}
      </div>
      <nav className="course-question-jumps" aria-label={diagnostic ? 'Prequiz questions' : 'Final quiz questions'}>
        {items.map((_, i) => <button key={i} type="button" aria-label={`Question ${i + 1}${valid(i) ? ', answered' : ', unanswered'}`} aria-current={i === index ? 'step' : undefined} data-answered={valid(i)} onClick={() => setIndex(i)}>{i + 1}</button>)}
      </nav>
    </div>
  );
}
