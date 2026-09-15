import { useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getUserName } from '../../lib/storage';
import { showToast } from '../../lib/toast';
import { track } from '../../lib/track';
import type { CertificateProps } from './CourseOne';

export function Certificate({ postQuizScore, certificate: _certificate, onIssue }: CertificateProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const profileName = user ? user.displayName?.trim() || 'Learner' : getUserName()?.trim() || 'Learner';

  const learnerName = name.trim() || profileName;
  const badgeSvgRef = useRef<SVGSVGElement>(null);
  const certNameRef = useRef<HTMLElement>(null);
  const certScoreRef = useRef<HTMLElement>(null);
  const certDateRef = useRef<HTMLDivElement>(null);
  const certIdRef = useRef<HTMLSpanElement>(null);

  function handleDownloadCert(): void {
    const { id, date } = onIssue();
    if (certNameRef.current) certNameRef.current.textContent = learnerName;
    if (certScoreRef.current) certScoreRef.current.textContent = `${postQuizScore}%`;
    if (certDateRef.current) certDateRef.current.textContent = `Date: ${date}`;
    if (certIdRef.current) certIdRef.current.textContent = id;
    window.print();
    track('certificate_print');
  }

  function handleDownloadBadge(): void {
    onIssue();
    const svgEl = badgeSvgRef.current;
    if (!svgEl) {
      showToast('Badge artwork not found.', 'error');
      return;
    }
    const svg = svgEl.outerHTML;
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 64, 64, 384, 384);
        c.toBlob((blob) => {
          if (!blob) { showToast('The badge couldn’t download. Please try again.', 'error'); return; }
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'Fynoptic_Dark-Pattern-Spotter.png';
          a.click();
          URL.revokeObjectURL(a.href);
          track('badge_download');
        }, 'image/png');
      }
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { URL.revokeObjectURL(url); showToast('The badge couldn’t download. Please try again.', 'error'); };
    img.src = url;
  }

  return (
    <>
      <h2 id="cert-title">You’ve finished Course One.</h2>
      <p className="subtle">Keep a copy of your certificate or download your course badge. To save a PDF, choose “Save as PDF” in the print window.</p>

      <div className="content-card">
        <label htmlFor="certificate-name">Name on your certificate</label>
        <input id="certificate-name" value={name} placeholder={profileName} onChange={event => setName(event.target.value)} maxLength={100} />
        <div className="inline-list badge-row">
          <svg
            ref={badgeSvgRef}
            className="badge-svg"
            viewBox="0 0 128 128"
            role="img"
            aria-label="Dark Pattern Spotter badge"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M64 6l42 18v34c0 28-18 52-42 64C40 110 22 86 22 58V24z" fill="#293dcc" />
            <path d="M44 66l14 14 26-34" fill="none" stroke="#ffffff" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <div className="md">
              <strong>Dark Pattern Spotter</strong>
            </div>
            <div className="subtle">Issued by Fynoptic</div>
          </div>
        </div>

        <div className="gate mt-1">
          <button className="btn btn-primary" id="download-cert" onClick={handleDownloadCert}>
            Print or save certificate
          </button>
          <button className="btn btn-ghost" id="download-badge" onClick={handleDownloadBadge}>
            Download Badge (PNG)
          </button>
        </div>
      </div>

      {/* Printable sheet */}
      <div id="certificate-sheet" className="certificate-sheet" aria-hidden="true">
        <div className="cert-header">
          <img src="/assets/img/fynopticlogo.png" alt="" className="cert-logo" />
          <div className="cert-title-block">
            <h1>Certificate of Completion</h1>
            <div className="cert-org">Fynoptic</div>
          </div>
        </div>
        <hr className="cert-hr" />
        <p className="cert-body-text">
          This certifies that <strong ref={certNameRef} id="cert-name"></strong> has completed{' '}
          <em>Dark Patterns: How to Spot Them</em>, including the required Risk Audit and a post-assessment score of{' '}
          <strong ref={certScoreRef} id="cert-score"></strong>.
        </p>
        <div className="cert-badge-row">
          <svg className="badge-svg" viewBox="0 0 128 128" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
            <path d="M64 6l42 18v34c0 28-18 52-42 64C40 110 22 86 22 58V24z" fill="#293dcc" />
            <path d="M44 66l14 14 26-34" fill="none" stroke="#ffffff" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="cert-badge-meta">
            <div>
              <strong>Badge:</strong> Dark Pattern Spotter
            </div>
            <div ref={certDateRef} id="cert-date"></div>
            <div>
              ID: <span ref={certIdRef} id="cert-id"></span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
