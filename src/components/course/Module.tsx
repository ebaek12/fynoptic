import { memo, useEffect, useRef, useState } from 'react';
import type { ModuleProps } from './CourseOne';
import { renderCourseArticleHtml } from '../../lib/md-to-html';
import { useVideoGate } from '../../hooks/useVideoGate';
import { showToast } from '../../lib/toast';
import { track } from '../../lib/track';

async function fetchText(path: string): Promise<string> {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${path} not reachable`);
  return res.text();
}

/* ─────────────────────────
   Article fetch + scroll-to-end gate (course-one.ts:277-357, minus the
   file:// iframe fallback - see file header).
─────────────────────────── */
function useArticleGate(mdPath: string, locked: boolean) {
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (locked || html !== null || failed) return;
    let cancelled = false;
    fetchText(mdPath).then(text => {
      if (!text.trim()) throw new Error('Empty lesson');
      if (!cancelled) setHtml(renderCourseArticleHtml(text, mdPath.split("/").pop()!.slice(0, 2)));
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [locked, html, mdPath, failed]);
  useEffect(() => {
    if (!html || !endRef.current) return;
    if (!('IntersectionObserver' in window)) { setScrolledToEnd(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setScrolledToEnd(true); observer.disconnect(); }
    });
    observer.observe(endRef.current);
    return () => observer.disconnect();
  }, [html]);
  return { html, endRef, scrolledToEnd, failed, retry: () => setFailed(false) };
}

interface VideoContent {
  id: string;
  ariaLabel: string;
  src: string;
  showFallbackText: boolean;
  transcriptHeading: string;
  transcriptParagraphs: string[];
}

interface ModuleContent {
  headingId: string;
  heading: string;
  subtitle: string;
  video?: VideoContent;
  articleHeading?: string;
  articleWrapperClass: string;
  mdMountId: string;
  markReadId: string;
  showArticleLocknote: boolean;
}

const MODULE_CONTENT: Record<1 | 2 | 3 | 4, ModuleContent> = {
  1: {
    headingId: 'm1-title',
    heading: 'Why the design matters.',
    subtitle: 'Start with the video or its notes, then learn a quick way to check the choices a page puts in front of you.',
    video: {
      id: 'm1-video',
      ariaLabel: 'Video 1 - Why dark patterns exist (2:00)',
      src: '/assets/video/video1.mp4',
      showFallbackText: true,
      transcriptHeading: 'Video 1 - “Why dark patterns exist” (2:00)',
      transcriptParagraphs: [
        '0:00–0:20: Companies test every click. Small lifts in conversion or retention compound into real money.',
        '0:20–0:40: Dark patterns are design choices that push you toward outcomes you didn’t intend. They cluster in sign-ups, checkouts, and cancellations.',
        '0:40–1:10: Common incentives: reduce churn, sell add-ons, harvest data, block refunds. The patterns you’ll see are predictable because the incentives are predictable.',
        '1:10–1:40: Your defense: name the tactic, choose an action (opt-out, cancel, escalate), and save proof.',
        '1:40–2:00: In this course you’ll learn a fast scan method, standard counter-moves, and a lightweight documentation routine.',
      ],
    },
    articleWrapperClass: 'content-card mt-1',
    mdMountId: 'md-01',
    markReadId: 'm1-mark-read',
    showArticleLocknote: true,
  },
  2: {
    headingId: 'm2-title',
    heading: 'Put a name to the trick.',
    subtitle: 'Learn the common patterns, then practice spotting them in everyday situations.',
    video: {
      id: 'm2-video',
      ariaLabel: 'Micro-video 2 - The eight families in 90 seconds (1:30)',
      src: '/assets/video/video2.mp4',
      showFallbackText: false,
      transcriptHeading: 'Micro-video 2 - “The eight families in 90 seconds” (1:30)',
      transcriptParagraphs: [
        'Obstruction (extra steps or narrow windows).',
        'Forced action (bundle unrelated consent).',
        'Sneaking (pre-checked or auto-added items).',
        'Interface interference (visual weight, button labelling).',
        'Confirmshaming (guilt language).',
        'Nagging (repeated prompts).',
        'Social proofing (manufactured urgency/consensus).',
        'Misdirection (visual focus away from the real choice).',
      ],
    },
    articleWrapperClass: 'content-card mt-1',
    mdMountId: 'md-02',
    markReadId: 'm2-mark-read',
    showArticleLocknote: false,
  },
  3: {
    headingId: 'm3-title',
    heading: 'Know your next move.',
    subtitle: 'Get clear on opting out, cancelling, and asking a company to put things right.',
    video: {
      id: 'm3-video',
      ariaLabel: 'Micro-video 3 - The three actions that fix most situations (1:40)',
      src: '/assets/video/video3.mp4',
      showFallbackText: false,
      transcriptHeading: 'Micro-video 3 - “The three actions that fix most situations” (1:40)',
      transcriptParagraphs: [
        'Opt-out cleanly (find and uncheck; use site settings; confirm by email).',
        'Cancel decisively (use the required channel once; include the essentials; log proof).',
        'Escalate with evidence (policy excerpt + your timestamped action + specific remedy requested).',
      ],
    },
    articleWrapperClass: 'content-card mt-1',
    mdMountId: 'md-03',
    markReadId: 'm3-mark-read',
    showArticleLocknote: false,
  },
  4: {
    headingId: 'm4-title',
    heading: 'Keep a useful record.',
    subtitle: 'Learn what to save, then make a record of a real or example situation. Finish the article and the form to open the final quiz.',
    articleWrapperClass: 'content-card',
    mdMountId: 'md-04',
    markReadId: 'm4-mark-read',
    showArticleLocknote: false,
  },
};

/* ─────────────────────────
   Article card - shared by all 4 units.
─────────────────────────── */
// Keep the reading DOM stable when progress changes, preserving open contents and anchor targets.
const LessonBody = memo(function LessonBody({ id, html }: { id: string; html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let live = true;
    document.fonts.ready.then(() => {
      if (!live || !location.hash.startsWith('#lesson-')) return;
      const target = document.getElementById(location.hash.slice(1));
      if (target && ref.current?.contains(target) && target.getClientRects().length) {
        target.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    });
    return () => { live = false; };
  }, [html]);
  return <div id={id} ref={ref} className="md" dangerouslySetInnerHTML={{ __html: html }} />;
});

function ArticleCard({
  unit,
  content,
  mdPath,
  locked,
  onArticleDone,
  articleDone,
}: {
  unit: 1 | 2 | 3 | 4;
  content: ModuleContent;
  mdPath: string;
  locked: boolean;
  onArticleDone: () => void;
  articleDone: boolean;
}) {
  const { html, endRef, scrolledToEnd, failed, retry } = useArticleGate(mdPath, locked);

  function handleMarkRead(): void {
    if (!html || !scrolledToEnd || articleDone) {
      showToast('Scroll to the end first.', 'error');
      return;
    }
    onArticleDone();
    showToast(`Module ${unit} article marked as read.`, 'success');
    track('article_read', { module: `m${unit}` });
  }

  return (
    <article className={content.articleWrapperClass}>
      {content.articleHeading && <h3>{content.articleHeading}</h3>}
      {failed ? <div className="course-load-state" role="alert"><p>This lesson couldn’t load. Check your connection and try again.</p><button className="course-button" onClick={retry}>Try loading again</button></div> : html === null ? <p role="status">Loading lesson…</p> : <>
        <LessonBody id={content.mdMountId} html={html} />
        <div ref={endRef} className="course-article-end" aria-hidden="true" />
      </>}
      <div className="gate">
        <button
          id={content.markReadId}
          className="btn btn-ghost"
          type="button"
          disabled={articleDone || !html || !scrolledToEnd}
          aria-disabled={articleDone || !html || !scrolledToEnd}
          onClick={handleMarkRead}
        >
          {articleDone ? "Article completed" : "Mark article as read"}
        </button>
        <span className="locknote">{articleDone ? "Saved to your progress." : "Read to the end to mark this lesson complete."}</span>
      </div>
    </article>
  );
}

/* ─────────────────────────
   Video card (units 1-3 only) - course-one.ts:360-463's gateVideo(),
   encapsulated in useVideoGate; the overlay is now plain conditional JSX.
─────────────────────────── */
function VideoCard({ video, locked, videoDone, onVideoDone }: { video: VideoContent; locked: boolean; videoDone: boolean; onVideoDone: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { failed, retry } = useVideoGate(videoRef, onVideoDone, locked, videoDone);
  return <div className="course-video-card">
    <div className="course-activity-label"><span>Watch the lesson</span><span>{videoDone ? 'Complete' : 'Video or text notes'}</span></div>
    <video id={video.id} ref={videoRef} src={video.src} poster={video.src.replace("/video/", "/img/").replace(".mp4", "-poster.svg")} controls playsInline preload="none" aria-label={video.ariaLabel} />
    {failed && <div className="course-load-state" role="alert"><p>The video couldn’t load. Try again, or use the text notes below to complete this part.</p><button className="course-button secondary" onClick={retry}>Retry video</button></div>}
  </div>;
}

function ScriptDrills({ onDrillsChecked }: { onDrillsChecked?: () => void }) {
  const drillsRef = useRef<HTMLTextAreaElement>(null);
  const [checklist, setChecklist] = useState('');

  function handleCheck(): void {
    const t = (drillsRef.current?.value ?? '').toLowerCase();
    const hasIdOrEmail = /\b(id|account|email)\b/.test(t);
    const hasDate = /\b\d{4}-\d{2}-\d{2}\b/.test(t);
    const askConfirm = /(confirm|confirmation)/.test(t);
    const channel = /(phone|chat|email)/.test(t);
    const list = [
      `${hasIdOrEmail ? '✔' : '•'} contains ID/email`,
      `${hasDate ? '✔' : '•'} contains a date`,
      `${askConfirm ? '✔' : '•'} asks for written confirmation`,
      `${channel ? '✔' : '•'} states the channel used`,
    ];
    setChecklist(list.join(' · '));
    onDrillsChecked?.();
  }

  return (
    <div className="content-card mt-1">
      <h3>Try writing the message</h3>
      <p className="course-muted">Optional practice. These prompts won’t affect your course progress.</p>
      <ol className="md">
        <li>You see a “pause” trap. Draft two sentences rejecting it and asking for a hard cancel.</li>
        <li>You returned an item; merchant says “refund pending.” Draft the exact one-paragraph follow-up quoting policy.</li>
        <li>Agent refuses to email confirmation. Draft the post-call email that documents the call.</li>
      </ol>
      <label htmlFor="drills">Your draft messages</label>
      <textarea id="drills" ref={drillsRef} rows={6} placeholder="Paste your drafts here…" className="drills-textarea" />
      <div id="drill-checklist" className="drawer subtle">
        {checklist}
      </div>
      <button id="drills-check" className="btn btn-ghost mt-05" type="button" onClick={handleCheck}>
        Check for Essentials
      </button>
    </div>
  );
}

/* ─────────────────────────
   Transcript card - units 1-3 only, identical shape per unit.
─────────────────────────── */
function TranscriptCard({ video, done, onComplete }: { video: VideoContent; done: boolean; onComplete: () => void }) {
  return (
    <div className="transcript content-card mt-1">
      <details>
        <summary>Prefer to read? Open the video notes</summary>
        <div className="md mt-05">
          {video.transcriptParagraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <button className="course-button secondary" disabled={done} onClick={onComplete}>{done ? 'Video notes completed' : 'I’ve read the video notes'}</button>
      </details>
    </div>
  );
}

export function Module(props: ModuleProps) {
  const content = MODULE_CONTENT[props.unit];

  return (
    <>
      <span className="course-eyebrow">Module {props.unit} of 4</span>
      <h2 tabIndex={-1} id={content.headingId}>{content.heading}</h2>
      <p className="course-intro">{content.subtitle}</p>

      {props.unit !== 4 && content.video && (
        <>
          <VideoCard video={content.video} videoDone={props.videoDone} locked={props.locked} onVideoDone={props.onVideoDone} />
          <TranscriptCard video={content.video} done={props.videoDone} onComplete={props.onVideoDone} />
        </>
      )}

      <ArticleCard articleDone={props.articleDone} unit={props.unit} content={content} mdPath={props.mdPath} locked={props.locked} onArticleDone={props.onArticleDone} />

      {props.unit === 3 && <ScriptDrills onDrillsChecked={props.onDrillsChecked} />}
    </>
  );
}
