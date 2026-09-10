import { useEffect, useState } from 'react';
import { FLASHCARD_UNITS } from '../../data/flashcard-units';
import { readStorage, unitProgress, type AnswerRecord } from '../../hooks/useFlashcardDeck';
import { showToast } from '../../lib/toast';

export type Mode = 'mc' | 'fitb';
type WizardStep = 1 | 2 | 3;


export interface FlashcardWizardProps {
  /** All unit names, in display order — flashcard-units.ts's keys. */
  allUnits: string[];
  unitsSelected: Set<string>;
  onUnitsSelectedChange: (next: Set<string>) => void;
  mode: Mode;
  onModeChange: (next: Mode) => void;
  shuffleDeck: boolean;
  onShuffleDeckChange: (next: boolean) => void;
  /** Fired on step 3's "Start Session" — caller owns buildDeck() from here. */
  onStart: () => void;
}

export function FlashcardWizard({
  allUnits,
  unitsSelected,
  onUnitsSelectedChange,
  mode,
  onModeChange,
  shuffleDeck,
  onShuffleDeckChange,
  onStart,
}: FlashcardWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  // Starts empty (matches SSR, avoids a hydration mismatch) and is filled
  // in from validated localStorage after mount.
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({});

  useEffect(() => {
    setAnswers(readStorage().answers);
  }, []);

  function toggleUnit(unit: string): void {
    const next = new Set(unitsSelected);
    if (next.has(unit)) next.delete(unit);
    else next.add(unit);
    onUnitsSelectedChange(next);
  }

  function selectAll(): void {
    onUnitsSelectedChange(new Set(allUnits));
  }

  function clearAll(): void {
    onUnitsSelectedChange(new Set());
  }

  function confirmUnits(): void {
    if (unitsSelected.size === 0) {
      showToast('Select at least one unit to continue.');
      return;
    }
    setStep(2);
  }

  const modeLabel = mode === 'mc' ? 'Multiple Choice' : 'Fill in the Blank';
  const count = unitsSelected.size;
  const summaryText = count
    ? `You selected ${count} unit${count > 1 ? 's' : ''} in ${modeLabel} mode.`
    : 'No units selected yet.';

  return (
    <div
      className="fc-controls card is-wizard"
      role="region"
      aria-label="Flashcard controls"
      data-step={step}
    >
      <div className="fc-grid">

        <div className="fc-block" id="block-units" hidden={step !== 1} aria-hidden={step !== 1}>
          <h3 className="fc-label">Units</h3>
          <div id="unit-list" className="unit-list is-table" aria-live="polite">
            {allUnits.map((unit) => {
              const checked = unitsSelected.has(unit);
              const cards = FLASHCARD_UNITS[unit] ?? [];
              const progress = unitProgress(answers, unit, cards);
              return (
                <label
                  key={unit}
                  id={`unit-${unit.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  className={checked ? 'chip unit-chip is-active' : 'chip unit-chip'}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleUnit(unit)}
                    className="sr-only"
                    aria-label={`${unit}, ${cards.length} cards, ${progress.pct}% mastered`}
                  />
                  <span className="unit-box" aria-hidden="true" />
                  <span className="unit-name">{unit}</span>
                  <span className="unit-count" aria-hidden="true" >{cards.length} cards</span>
                  <span className="unit-bar" aria-hidden="true">
                    <span className="unit-fill" style={{ width: `${progress.pct}%` }} />
                  </span>
                  <span className="unit-pct" aria-hidden="true" >{progress.pct}%</span>
                </label>
              );
            })}
          </div>
          <p className="unit-total">
            {unitsSelected.size} unit{unitsSelected.size === 1 ? '' : 's'} ·{' '}
            {allUnits.reduce((sum, u) => (unitsSelected.has(u) ? sum + (FLASHCARD_UNITS[u]?.length ?? 0) : sum), 0)} cards
          </p>
          <div className="fc-actions">
            <button id="select-all" className="btn btn-ghost" type="button" onClick={selectAll}>
              Select All
            </button>
            <button id="clear-all" className="btn btn-ghost" type="button" onClick={clearAll}>
              Clear
            </button>
            <button id="confirm-units" className="btn btn-primary btn-next" type="button" onClick={confirmUnits}>
              Continue
            </button>
          </div>
        </div>

        <div className="fc-block" id="block-mode" hidden={step !== 2} aria-hidden={step !== 2}>
          <h3 className="fc-label">Mode</h3>
          <div className="mode-row" role="group" aria-label="Practice mode">
            <label className="mode-chip">
              <input className="sr-only" type="radio" name="mode" value="mc" checked={mode === 'mc'} onChange={() => onModeChange('mc')} />
              <span>Multiple Choice</span>
            </label>
            <label className="mode-chip">
              <input className="sr-only" type="radio" name="mode" value="fitb" checked={mode === 'fitb'} onChange={() => onModeChange('fitb')} />
              <span>Fill in the Blank</span>
            </label>
          </div>

          <div className="opt-row">
            <label className="toggle">
              <input type="checkbox" id="shuffle" checked={shuffleDeck} onChange={(e) => onShuffleDeckChange(e.target.checked)} />
              <span>Shuffle deck</span>
            </label>
          </div>

          <div className="fc-actions">
            <button id="back-to-units" className="btn btn-ghost" type="button" onClick={() => setStep(1)}>Back</button>
            <button id="confirm-mode" className="btn btn-primary btn-next" type="button" onClick={() => setStep(3)}>
              Continue
            </button>
          </div>
        </div>

        <div className="fc-block" id="block-start" hidden={step !== 3} aria-hidden={step !== 3}>
          <h3 className="fc-label">Ready to begin?</h3>
          <div className="start-hero">
            <p id="start-summary" className="muted">
              {summaryText}
            </p>
            <button id="back-to-mode" className="btn btn-ghost" type="button" onClick={() => setStep(2)}>Back</button>
            <button id="start-btn-big" className="btn btn-primary btn-giant" type="button" onClick={onStart}>
              Start Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
