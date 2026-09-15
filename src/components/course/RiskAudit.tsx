import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import { appendRiskAudit, getRiskAudits, type RiskAuditEntry } from '../../lib/storage';
import { showToast } from '../../lib/toast';
import { track } from '../../lib/track';
import type { RiskAuditProps } from './CourseOne';

function fdStr(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

// Faithful port of course-one.ts:1078-1084's nextStep IIFE.
function nextStepFor(action: string): string {
  if (action === 'cancel') return 'Send a concise, dated cancellation via required channel; request written confirmation.';
  if (action === 'refund') return 'Quote policy, attach proof, and request refund by a clear deadline.';
  if (action === 'opt-out') return 'Change settings, capture before/after, and verify by email.';
  if (action === 'delete account') return 'Submit deletion request and archive confirmation.';
  return 'Document and set a follow-up date.';
}

function auditSummary(entry: Omit<RiskAuditEntry, 'id' | 'dateISO'>): string {
  return [
    `Merchant/platform: ${entry.merchant}`, `Action attempted: ${entry.action}`, `Date/time: ${entry.date} via ${entry.channel}`,
    `What you saw: ${entry.saw}`, `Pattern(s) observed: ${entry.patterns}`, `Evidence captured: ${entry.evidence}`,
    'Next steps:', `1. ${nextStepFor(entry.action)}`, '2. Keep a copy of the response and follow up if the issue remains unresolved.',
  ].join('\n');
}

export function RiskAudit({ onSubmit, auditId, auditSubmitted }: RiskAuditProps) {
  const [saved] = useState(() => getRiskAudits().find(entry => entry.id === auditId));
  const [output, setOutput] = useState<string | null>(() => saved ? auditSummary(saved) : null);
  const [editing, setEditing] = useState(!saved);
  const [error, setError] = useState('');
  const errorRef = useRef<HTMLParagraphElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  useEffect(() => { if (output && !editing && outputRef.current?.getClientRects().length) outputRef.current.focus({ preventScroll: true }); }, [output, editing]);

  function handleSubmit(e: SubmitEvent<HTMLFormElement>): void {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const merchant = fdStr(fd, 'merchant');
    const action = fdStr(fd, 'action');
    const date = fdStr(fd, 'date');
    const channel = fdStr(fd, 'channel');
    const saw = fdStr(fd, 'saw');
    const patterns = fd.getAll('patterns').map(String).join(', ');
    const evidence = fd.getAll('evidence').map(String).join(', ') || 'None yet';
    if (!merchant || !saw || !patterns) {
      setError('Add the company, describe what happened, and select at least one pattern.');
      return;
    }
    setError('');
    setOutput(auditSummary({ merchant, action, date, channel, saw, patterns, evidence }));
    setEditing(false);

    const entry = {
      id: `AUD-${Date.now()}`,
      dateISO: new Date().toISOString(),
      merchant,
      action,
      date,
      channel,
      saw,
      patterns,
      evidence,
    };
    appendRiskAudit(entry);

    track('audit_submitted', { id: entry.id, merchant, action });
    showToast('Risk Audit generated.', 'success');
    onSubmit(entry.id);
  }

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(output ?? '');
      showToast('Copied to clipboard.', 'success');
    } catch {
      showToast('Copy didn’t work. You can select and copy the summary above.', 'error');
    }
  }

  return (
    <div className="content-card mt-1">
      <h3>Make your evidence record</h3>
      <p className="course-muted">Use a real experience or make up an example. This record stays in this browser.</p>
      {auditSubmitted && !saved && !output && <p>Your earlier record was completed. You can create another copy here.</p>}
      {error && <p ref={errorRef} tabIndex={-1} role="alert">{error}</p>}
      {editing && <form id="audit-form" className="audit-form" onSubmit={handleSubmit}>
        <div className="course-form-pair">
          <label>
            Merchant/platform name
            <input required name="merchant" />
          </label>
          <label>
            Action attempted
            <select required name="action" defaultValue="">
              <option value="">Select</option>
              <option>opt-out</option>
              <option>cancel</option>
              <option>refund</option>
              <option>delete account</option>
            </select>
          </label>
        </div>
        <div className="course-form-pair">
          <label>
            Date/time of action
            <input required name="date" type="datetime-local" />
          </label>
          <label>
            Channel used
            <select required name="channel" defaultValue="">
              <option value="">Select</option>
              <option>web</option>
              <option>email</option>
              <option>chat</option>
              <option>phone</option>
            </select>
          </label>
        </div>
        <label>
          What you saw (2–3 sentences)
          <textarea required name="saw" rows={3} />
        </label>
        <fieldset>
          <legend>Patterns observed (choose at least one)</legend>
          <div className="course-checkbox-grid">
            {['Obstruction', 'Forced action', 'Sneaking', 'Interface interference', 'Confirmshaming', 'Nagging', 'Social proofing', 'Misdirection'].map(pattern => <label key={pattern}><input type="checkbox" name="patterns" value={pattern} />{pattern}</label>)}
          </div>
        </fieldset>
        <fieldset>
          <legend>Evidence captured</legend>
          <div className="course-checkbox-grid">
            <label>
              <input type="checkbox" name="evidence" value="before/after screens" /> before/after screens
            </label>
            <label>
              <input type="checkbox" name="evidence" value="totals" /> totals
            </label>
            <label>
              <input type="checkbox" name="evidence" value="your action" /> your action
            </label>
            <label>
              <input type="checkbox" name="evidence" value="confirmation" /> confirmation
            </label>
            <label>
              <input type="checkbox" name="evidence" value="policy excerpt" /> policy excerpt
            </label>
          </div>
        </fieldset>
        <div className="gate">
          <button id="audit-generate" className="btn btn-primary" type="submit">
            Save evidence record
          </button>
        </div>
      </form>}
      <div id="audit-output" ref={outputRef} tabIndex={-1} className="audit-output" hidden={output === null}>
        {output}
      </div>
      <div id="audit-actions" className="gate" hidden={!output}>
        <button id="copy-audit" className="btn btn-ghost" type="button" onClick={handleCopy}>
          Copy Summary
        </button>
        {!editing && <button className="course-button secondary" onClick={() => setEditing(true)}>Create another record</button>}
      </div>
    </div>
  );
}
