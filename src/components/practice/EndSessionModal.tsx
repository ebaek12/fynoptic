// React port of islands/practice.ts's #end-session-modal (Phase 10d),
// resolving O7: dismiss-only.
//
// Deliberate behavior CHANGE from the shipped vanilla island: there, the ×
// button called closeEndSessionModalAndReturn(), which wiped the running
// session — while Escape/backdrop-click (handled by lib/modal.ts) only hid
// the modal. That asymmetry meant a destructive action could be triggered
// by the same gesture (×) a user reaches for to "just close this." Here,
// closing the dialog by ANY route — ×, Escape, or a backdrop click, all of
// which land on `onOpenChange` via Radix (see Modal.tsx) — only ever calls
// `onOpenChange(false)` and never touches the session. The single
// destructive action is the explicit, danger-styled "End Session" button
// below, which is not a ModalClose and must call `onEndSession` itself.
import { Modal, ModalClose } from "../ui/Modal";

export interface SessionEndStats {
  answered: number;
  total: number;
  correct: number;
  streak: number;
  /** correct/answered, via computeAccuracyPct — the single formula (10d fix) that replaced this modal's own inline `answered ? round(correct/answered*100) : 0`, one of the three divergent copies the plan called out. */
  accuracyPct: number;
  /** Pre-formatted, e.g. "Medium" or "—" — matches updateDiffChip()'s casing. */
  difficulty: string;
  /** Pre-formatted, comma-joined, underscores/hyphens replaced with spaces, or "—" if none. */
  topicsLabel: string;
}

export interface EndSessionModalProps {
  open: boolean;
  /** Fired for × / Escape / backdrop click alike. Must only ever close the dialog — never destructive. */
  onOpenChange: (open: boolean) => void;
  stats: SessionEndStats;
  /** The one and only destructive path. Caller is responsible for also closing the dialog (e.g. by also flipping its `open` state) as part of handling this. */
  onEndSession: () => void;
}

export function EndSessionModal({
  open,
  onOpenChange,
  stats,
  onEndSession,
}: EndSessionModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Your session so far"
      id="end-session-modal"
    >
      <ModalClose />
      <div id="end-session-stats">
        <dl className="practice-review-stats">
          <div>
            <dt>Answered</dt>
            <dd>
              {stats.answered}/{stats.total}
            </dd>
          </div>
          <div>
            <dt>Correct</dt>
            <dd>{stats.correct}</dd>
          </div>
          <div>
            <dt>Accuracy</dt>
            <dd>{stats.accuracyPct}%</dd>
          </div>
        </dl>
        <dl className="practice-review-details">
          <div>
            <dt>Streak</dt>
            <dd>{stats.streak}</dd>
          </div>
          <div>
            <dt>Difficulty</dt>
            <dd>{stats.difficulty}</dd>
          </div>
          <div>
            <dt>Topics</dt>
            <dd>{stats.topicsLabel}</dd>
          </div>
        </dl>
      </div>
      <div className="practice-review-actions">
        <button
          id="end-session-end-btn"
          type="button"
          className="study-back"
          onClick={() => {
            onEndSession();
            onOpenChange(false);
          }}
        >
          End Session
        </button>
        <button
          id="keep-practicing"
          type="button"
          className="study-primary"
          onClick={() => onOpenChange(false)}
        >
          Keep practicing
        </button>
      </div>
    </Modal>
  );
}
