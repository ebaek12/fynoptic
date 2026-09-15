import type { PreQuizProps } from './CourseOne';
import { CourseQuiz, type CourseQuestion } from './CourseQuiz';
import { track } from '../../lib/track';

const PRE_ITEMS: readonly CourseQuestion[] = [
  {
    stem: 'A checkout shows a $19 warranty box pre-checked. What do you do first?',
    options: [
      'Uncheck the warranty, screenshot the cart, then continue checkout.',
      'Uncheck the warranty and proceed without taking any screenshots.',
      'Leave the warranty checked, then contact support after receiving any charges.',
      'Close the tab and search for a cheaper seller before buying.',
    ],
    answerIndex: 0,
  },
  {
    stem: 'The cancel flow highlights “Pause” with a large button while “Cancel” is tiny and gray. Best next step?',
    options: [
      'Click the prominent Pause option and assume it cancels later.',
      'Search the page for explicit cancel wording, screenshot the UI, then choose cancel.',
      'Call support immediately to ask what Pause actually does.',
      'Close the site and try again another day without screenshots.',
    ],
    answerIndex: 1,
  },
  {
    stem: 'A service requires phone calls only, weekdays 9–5 to cancel. You can call once this week. What protects you most?',
    options: [
      'Call once, request cancellation, and keep a dated note of the agent’s name.',
      'Call multiple times until you reach a supervisor and take no notes.',
      'Skip calling; instead file a complaint with your card issuer immediately.',
      'Visit the company in person and rely on verbal confirmation.',
    ],
    answerIndex: 0,
  },
  {
    stem: 'A banner says “62 people viewing now” with no source. What’s the reasonable consumer action?',
    options: [
      'Rush to buy because the number likely means low stock.',
      'Ignore the banner and open another tab to compare price and stock.',
      'Ask chat support to confirm the banner’s accuracy before deciding.',
      'Add to cart, then wait 24 hours to see if price drops.',
    ],
    answerIndex: 1,
  },
  {
    stem: 'After clicking “No thanks,” a modal re-labels buttons with vague text. What should you do before clicking?',
    options: [
      'Use keyboard/tab keys to select the intended action, then screenshot before and after.',
      'Click the large button quickly to avoid extra popups.',
      'Reload the page and attempt the flow without any screenshots.',
      'Contact support to ask which button is correct before proceeding.',
    ],
    answerIndex: 0,
  },
  {
    stem: 'A free trial requires a credit card and hides renewal terms in Billing Details. What’s the safest pre-signup step?',
    options: [
      'Sign up and rely on your calendar memory to cancel in time.',
      'Record the billing page, note trial length, and set a calendar reminder before signing.',
      'Never use free trials; ignore the product entirely.',
      'Use your main email and enable autofill to speed registration.',
    ],
    answerIndex: 1,
  },
  {
    stem: 'You notice an unexpected line item in your cart total you didn’t add. Which evidence is most useful?',
    options: [
      'Screenshot of the cart showing the unexpected line item and the full total.',
      'Photo of the product page after checkout.',
      'The merchant’s merchant ID number on their homepage.',
      'A comment from another buyer complaining about extra charges.',
    ],
    answerIndex: 0,
  },
  {
    stem: 'The signup form bundles marketing emails with required consent. What’s the safest approach?',
    options: [
      'Check the box and assume you can opt out later from settings.',
      'Look for separate marketing or communications settings, or use an alternate email address.',
      'Abandon the signup entirely because bundled consent is always enforceable.',
      'Call support to request the checkbox be removed before signing up.',
    ],
    answerIndex: 1,
  },
  {
    stem: 'You see a pop-up claiming “Only loyal customers keep this.” What does this aim to do and what should you do?',
    options: [
      'It is a loyalty program notice; enroll now for benefits.',
      'It uses guilt to discourage leaving; proceed with your plan and save confirmation.',
      'It is a legal requirement to disclose fees; read the TOS immediately.',
      'It’s a sign of a broken site; try again later.',
    ],
    answerIndex: 1,
  },
  {
    stem: 'A cancellation page says your request is complete, but no email arrives. What should you keep?',
    options: [
      'A dated screenshot of the confirmation page and a copy of your cancellation request.',
      'Only the company’s homepage address.',
      'A note saying you probably cancelled last week.',
      'Nothing; closing the page is enough.',
    ],
    answerIndex: 0,
  },
];

export function PreQuiz({ state, onAnswerChange, onSubmit }: PreQuizProps) {
  function submit() {
    if (state.completed || !PRE_ITEMS.every((q, i) => Number.isInteger(state.answers[i]) && state.answers[i]! >= 0 && state.answers[i]! < q.options.length)) return;
    const correctness = PRE_ITEMS.map((q, i) => state.answers[i] === q.answerIndex);
    const score = Math.round(correctness.filter(Boolean).length / PRE_ITEMS.length * 100);
    onSubmit({ score, answers: [...state.answers], correctness });
    track('pre_quiz_submit', { score });
  }
  return <>
    <span className="course-eyebrow">Before you start · 10 questions</span>
    <h2 id="pre-title">What would you do?</h2>
    <p className="course-intro">Answer 10 questions before the first lesson. There’s no passing score. You can change your answers before submitting.</p>
    <CourseQuiz id="pre" items={PRE_ITEMS} answers={state.answers} completed={state.completed} score={state.score} diagnostic onAnswerChange={onAnswerChange} onSubmit={submit} />
  </>;
}
