import { useState } from 'react';
import { computeAccuracyPct, usePracticeSession } from '@/hooks/usePracticeSession';
import { EndSessionModal, type SessionEndStats } from './EndSessionModal';
import { PracticeWizard, type WizardSelection } from './PracticeWizard';
import { Session } from './Session';

const CATEGORIES = ['Personal Finance', 'Economics'];

export function Practice() {
  const {
    questions,
    banksLoading,
    session,
    finishSummary,
    start,
    selectChoice,
    toggleEliminate,
    submit,
    next,
    prev,
    restart,
    endSession,
  } = usePracticeSession();
  const [endModalOpen, setEndModalOpen] = useState(false);

  function handleWizardComplete(selection: WizardSelection): void {
    start(selection);
  }

  function handleEndSessionConfirmed(): void {
    endSession();
    setEndModalOpen(false);
  }

  const stats: SessionEndStats = session
    ? {
        answered: session.asked,
        total: session.totalQuestions,
        correct: session.correct,
        accuracyPct: computeAccuracyPct(session.correct, session.asked),
        streak: session.streak,
        difficulty: session.currentDiff ? session.currentDiff[0]!.toUpperCase() + session.currentDiff.slice(1) : ' - ',
        topicsLabel: session.topics.map((t) => t.replace(/[_-]/g, ' ')).join(', ') || ' - ',
      }
    : { answered: 0, total: 0, correct: 0, accuracyPct: 0, streak: 0, difficulty: ' - ', topicsLabel: ' - ' };

  return (
    <>
      <div className="container">

        {!session && <div className="practice-setup-wrap">
          {banksLoading && <p className="muted">Loading questions…</p>}
          {!banksLoading && (
            <PracticeWizard bank={questions} categories={CATEGORIES} onComplete={handleWizardComplete} />
          )}
        </div>}

        {session && (
          <Session
            session={session}
            finishSummary={finishSummary}
            onSelectChoice={selectChoice}
            onToggleEliminate={toggleEliminate}
            onSubmit={submit}
            onNext={next}
            onPrev={prev}
            onRestart={restart}
            onRequestEndSession={() => setEndModalOpen(true)}
            onFinish={endSession}
          />
        )}
      </div>

      <EndSessionModal open={endModalOpen} onOpenChange={setEndModalOpen} stats={stats} onEndSession={handleEndSessionConfirmed} />
    </>
  );
}
