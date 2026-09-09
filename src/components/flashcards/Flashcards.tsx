import { useEffect, useRef, useState } from 'react';
import { FLASHCARD_UNITS } from '../../data/flashcard-units';
import { useFlashcardDeck } from '../../hooks/useFlashcardDeck';
import { FlashcardView } from './FlashcardView';
import { FlashcardWizard, type Mode } from './FlashcardWizard';
import { ResetProgressDialog } from './ResetProgressDialog';
import { SummaryModal, type SummaryStats } from './SummaryModal';

const ALL_UNITS = Object.keys(FLASHCARD_UNITS);

const EMPTY_SUMMARY: SummaryStats = { total: 0, done: 0, correct: 0, accuracyPct: 0, revealedCount: 0 };

export function Flashcards() {
  const [unitsSelected, setUnitsSelected] = useState<Set<string>>(new Set());
  const [wizardMode, setWizardMode] = useState<Mode>('mc');
  const [shuffleDeck, setShuffleDeck] = useState(true);

  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [endedSummary, setEndedSummary] = useState<SummaryStats>(EMPTY_SUMMARY);
  const [endedUnits, setEndedUnits] = useState<string[]>([]);
  const [showEndChip, setShowEndChip] = useState(false);
  const endChipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const engine = useFlashcardDeck();

  useEffect(() => {
    return () => {
      if (endChipTimer.current) clearTimeout(endChipTimer.current);
    };
  }, []);

  function handleStart(): void {
    engine.buildDeck(Array.from(unitsSelected), {
      mode: wizardMode,
      shuffleDeck,
      mcAnswer: engine.mcAnswer,
      fitbAnswer: engine.fitbAnswer,
    }); // toasts internally ('Select at least one unit.') on failure
  }

  function handleEndSession(): void {
    const summary = engine.endSession();
    setEndedSummary({
      total: summary.total,
      done: summary.done,
      correct: summary.correct,
      accuracyPct: summary.accuracyPct,
      revealedCount: summary.revealedCount,
    });
    setEndedUnits(summary.units);
    setSummaryOpen(true);
  }

  // Fires on ANY summary-modal dismissal (×, Escape, backdrop). Mirrors
  // returnToUnitSelection()'s "Session ended" chip, shown for 6s.
  function handleSummaryOpenChange(open: boolean): void {
    setSummaryOpen(open);
    if (!open) {
      setShowEndChip(true);
      if (endChipTimer.current) clearTimeout(endChipTimer.current);
      endChipTimer.current = setTimeout(() => setShowEndChip(false), 6000);
    }
  }

  return (
    <>
      {!engine.active && (
        <FlashcardWizard
          allUnits={ALL_UNITS}
          unitsSelected={unitsSelected}
          onUnitsSelectedChange={setUnitsSelected}
          mode={wizardMode}
          onModeChange={setWizardMode}
          shuffleDeck={shuffleDeck}
          onShuffleDeckChange={setShuffleDeck}
          onStart={handleStart}
        />
      )}

      {showEndChip && (
        <div className="end-chip">
          <span className="dot" aria-hidden="true" />
          Session ended
        </div>
      )}

      {engine.active && (
        <FlashcardView engine={engine} shuffleDeck={shuffleDeck} onRequestResetProgress={() => setResetDialogOpen(true)} onRequestEndSession={handleEndSession} />
      )}

      <ResetProgressDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen} onConfirm={engine.resetProgress} />
      <SummaryModal open={summaryOpen} onOpenChange={handleSummaryOpenChange} stats={endedSummary} units={endedUnits} />
    </>
  );
}
