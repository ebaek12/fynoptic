(() => {
  /* ─────────────────────────
     Keys + storage (cookie + LS)
  ───────────────────────────*/
  const DP_STATE_KEY = 'ff_dp_state';
  const COOKIE_NAME  = 'ff_dp_state_v2';
  const NAME_KEY     = 'ff_user_name';
  const COURSE_PROGRESS_KEY = 'ff_course_progress';
  const AUDITS_KEY   = 'ff_risk_audits';

  const $  = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));

  function setCookie(name, value, days=180){
    try { document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${days*86400}; path=/; samesite=lax`; } catch {}
  }
  function getCookie(name){
    try {
      const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[-[\]/{}()*+?.\\^$|]/g,'\\$&') + '=([^;]*)'));
      return m ? decodeURIComponent(m[1]) : null;
    } catch { return null; }
  }

  const defaultState = {
    preQuiz: { completed:false, score:0, answers:[], correctness:[] },
    m1: { video:false, article:false },
    m2: { video:false, article:false, idExercise:false },
    m3: { video:false, article:false, drillsChecked:false },
    m4: { article:false, auditSubmitted:false, auditId:null },
    postQuiz: { completed:false, score:0, pass:false, answers:[], correctness:[] },
    certificate: { issued:false, id:null, date:null }
  };

  function loadState(){
    try { const c = getCookie(COOKIE_NAME); if (c) return { ...defaultState, ...JSON.parse(c) }; } catch {}
    try { const ls = localStorage.getItem(DP_STATE_KEY); if (ls) return { ...defaultState, ...JSON.parse(ls) }; } catch {}
    return { ...defaultState };
  }
  function saveState(s){
    try { localStorage.setItem(DP_STATE_KEY, JSON.stringify(s)); } catch {}
    try { setCookie(COOKIE_NAME, JSON.stringify(s)); } catch {}
  }
  let state = loadState();

  /* ─────────────────────────
     Toasts + tracking
  ───────────────────────────*/
  const toastBox = $('.toast-container');
  const ffTrack = (n,p={}) => { try { window.ffTrack ? window.ffTrack(n,p) : console.log('[ffTrack]',n,p); } catch {} };
  function toast(msg, kind='info'){
    if (!toastBox) return;
    const el = document.createElement('div');
    el.className = 'toast';
    if (kind==='success') el.style.borderLeftColor='var(--success-500)';
    if (kind==='error')   el.style.borderLeftColor='var(--danger-500)';
    el.textContent = msg; toastBox.appendChild(el); setTimeout(()=>el.remove(), 3500);
  }

  /* ─────────────────────────
     A11y + name
  ───────────────────────────*/
  const applyA11y = () => {
    document.body.classList.toggle('hc',  localStorage.getItem('ff_a11y_hc')  === '1');
    document.body.classList.toggle('dyslexia', localStorage.getItem('ff_a11y_dys') === '1');
    const hc  = $('#toggle-hc'), dys = $('#toggle-dys');
    if (hc)  hc.checked  = localStorage.getItem('ff_a11y_hc')  === '1';
    if (dys) dys.checked = localStorage.getItem('ff_a11y_dys') === '1';
  };
  $('#toggle-hc')?.addEventListener('change', e => { localStorage.setItem('ff_a11y_hc',  e.target.checked?'1':'0'); applyA11y(); });
  $('#toggle-dys')?.addEventListener('change', e => { localStorage.setItem('ff_a11y_dys', e.target.checked?'1':'0'); applyA11y(); });
  applyA11y();

  if ($('#learner-name')) $('#learner-name').value = localStorage.getItem(NAME_KEY) || '';
  $('#save-name')?.addEventListener('click', () => {
    const v = $('#learner-name').value.trim();
    if (!v) return toast('Enter your full name for the certificate.', 'error');
    localStorage.setItem(NAME_KEY, v);
    toast('Name saved for your certificate.', 'success');
  });

  /* ─────────────────────────
     Helpers
  ───────────────────────────*/
  async function fetchFirst(filename, as='text'){
    const paths = [filename, `./${filename}`];
    for (const p of paths){
      try {
        const res = await fetch(p, { cache:'no-store' });
        if (res.ok) return as === 'json' ? res.json() : res.text();
      } catch {}
    }
    throw new Error(`${filename} not reachable`);
  }

  function bumpCourseProgress(){
    try {
      const arr = JSON.parse(localStorage.getItem(COURSE_PROGRESS_KEY) || '[]');
      const ids = new Set(arr);
      if (state.m1.video && state.m1.article) ids.add('dp-m1');
      if (state.m2.video && state.m2.article && state.m2.idExercise) ids.add('dp-m2');
      if (state.m3.video && state.m3.article) ids.add('dp-m3');
      if (state.m4.article && state.m4.auditSubmitted) ids.add('dp-m4');
      localStorage.setItem(COURSE_PROGRESS_KEY, JSON.stringify([...ids]));
    } catch {}
  }

  function setBtnState(btn, enabled){
    if (!btn) return;
    btn.disabled = !enabled;
    btn.setAttribute('aria-disabled', enabled ? 'false' : 'true');
  }

  function lockSection(el, locked, message){
    if (!el) return;
    el.classList.toggle('locked', locked);
    if (locked){
      el.setAttribute('inert',''); el.setAttribute('aria-hidden','true');
      if (!el.querySelector('.locked-scrim')){
        const s = document.createElement('div');
        s.className = 'locked-scrim';
        s.style.pointerEvents = 'auto';
        s.innerHTML = `<div class="locked-card"><div class="locked-emoji" aria-hidden="true">🔒</div><div class="locked-msg">${message}</div></div>`;
        el.appendChild(s);
      } else el.querySelector('.locked-msg').textContent = message;
    } else {
      el.removeAttribute('inert'); el.removeAttribute('aria-hidden');
      el.querySelector('.locked-scrim')?.remove();
    }
  }

  const stepEls = $$('.stepper-wrap .step');
  function setStepStatus(step, unlocked, done=false){
    const el = stepEls.find(s => s.dataset.step === step); if (!el) return;
    el.classList.toggle('is-unlocked', !!unlocked);
    el.classList.toggle('is-locked', !unlocked);
    const dot = el.querySelector('.dot');
    if (dot) dot.style.background = done ? 'var(--success-500)' : (unlocked ? 'var(--primary-600)' : '#2a3550');
  }

  /* ─────────────────────────
     Markdown + video gating
  ───────────────────────────*/
  function mdToHtml(md){
    if (!md) return '';
    let html = md
      .replace(/^### (.*)$/gim, '<h3>$1</h3>')
      .replace(/^## (.*)$/gim,  '<h2>$1</h2>')
      .replace(/^# (.*)$/gim,   '<h1>$1</h1>')
      .replace(/^\s*[-*] (.*)$/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/\n/g, '<br/>');
    return `<p>${html}</p>`;
  }

  // Smart loader: fetch JSON/text; if blocked (file://), fall back to iframe viewer
  async function loadMarkdownSmart(filename, mountEl, markBtn){
    markBtn.disabled = true; markBtn.setAttribute('aria-disabled','true');
    try {
      const text = await fetchFirst(filename, 'text');
      mountEl.innerHTML = mdToHtml(text);
      const target = mountEl.lastElementChild || mountEl;
      const io = new IntersectionObserver(entries=>{
        if (entries.some(e=>e.isIntersecting)){
          markBtn.disabled=false; markBtn.setAttribute('aria-disabled','false');
          io.disconnect();
        }
      }, { threshold:1.0 });
      io.observe(target);
    } catch (e) {
      // file:// fallback
      mountEl.innerHTML = '';
      const note = document.createElement('div');
      note.className = 'subtle';
      note.style.marginBottom = '8px';
      note.innerHTML = `Using <code>file://</code> fallback viewer for <code>${filename}</code>. For best results run a local server.`;
      mountEl.appendChild(note);

      const frame = document.createElement('iframe');
      frame.src = filename;
      frame.sandbox = 'allow-same-origin';
      frame.style.width = '100%';
      frame.style.height = '60vh';
      frame.style.border = '0';
      frame.style.background = '#0b1325';
      mountEl.appendChild(frame);

      function tryAttach(){
        try {
          const doc = frame.contentDocument || frame.contentWindow?.document;
          const sc = doc?.scrollingElement || doc?.documentElement || doc?.body;
          if (!sc) throw new Error();
          markBtn.disabled = true; markBtn.setAttribute('aria-disabled','true');
          sc.addEventListener('scroll', () => {
            if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 10){
              markBtn.disabled = false; markBtn.setAttribute('aria-disabled','false');
            }
          });
        } catch {
          // if we can't access the iframe (some browsers), unlock after the user sees it for 30s
          const obs = new IntersectionObserver((entries)=>{
            if (entries.some(e=>e.isIntersecting)){
              setTimeout(() => { markBtn.disabled=false; markBtn.setAttribute('aria-disabled','false'); }, 30000);
              obs.disconnect();
            }
          }, { threshold: 0.5 });
          obs.observe(frame);
        }
      }
      frame.addEventListener('load', tryAttach);
      setTimeout(tryAttach, 500);
    }
  }

  // Big-button, centered, anti-skip gated video
  function gateVideo(video, onDone){
    if (!video) return;

    // visual: center & contain
    try {
      video.style.display = 'block';
      video.style.margin = '0 auto';
      video.style.maxWidth = '960px';
      video.style.width = '100%';
      video.style.height = 'auto';
      video.style.objectFit = 'contain';
      video.setAttribute('controlslist', 'nodownload noplaybackrate noremoteplayback');
      video.disablePictureInPicture = true;
    } catch {}

    // hide native controls while gated
    video.controls = false;

    // overlay play button
    const wrap = video.parentElement || video;
    const overlay = document.createElement('button');
    overlay.type = 'button';
    overlay.setAttribute('aria-label','Play video');
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.display = 'grid';
    overlay.style.placeItems = 'center';
    overlay.style.border = '0';
    overlay.style.background = 'linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.35))';
    overlay.style.cursor = 'pointer';
    overlay.style.borderRadius = '16px';
    overlay.style.zIndex = '5';

    const icon = document.createElement('div');
    icon.style.width = '96px';
    icon.style.height = '96px';
    icon.style.borderRadius = '50%';
    icon.style.background = 'rgba(255,255,255,.9)';
    icon.style.boxShadow = '0 8px 40px rgba(0,0,0,.35)';
    icon.style.display = 'grid';
    icon.style.placeItems = 'center';
    icon.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="#111"><path d="M8 5v14l11-7z"/></svg>`;
    overlay.appendChild(icon);

    // ensure wrapper is positioned
    const oldPos = getComputedStyle(wrap).position;
    if (oldPos === 'static') wrap.style.position = 'relative';
    wrap.appendChild(overlay);

    overlay.addEventListener('click', () => {
      try { video.play().catch(()=>{}); } catch {}
    });

    // anti-skip
    let maxTime = 0;
    let completed = false;
    const COMPLETE_AT = 0.95;

    function seekingGuard(){ if (video.currentTime > maxTime + 0.5) video.currentTime = maxTime; }
    function freezeRate(){ if (video.playbackRate !== 1) video.playbackRate = 1; }

    video.addEventListener('timeupdate', () => {
      if (video.currentTime > maxTime) maxTime = video.currentTime;
      if (!completed && video.duration && (video.currentTime / video.duration) >= COMPLETE_AT){
        completed = true;
        video.removeEventListener('seeking', seekingGuard);
        video.removeEventListener('ratechange', freezeRate);
        onDone?.();
        toast('Video completed ✔', 'success');
      }
    });

    video.addEventListener('seeking', seekingGuard);
    video.addEventListener('ratechange', freezeRate);

    // show/hide overlay + keep controls hidden while gated
    video.addEventListener('play', () => { overlay.style.display = 'none'; });
    video.addEventListener('pause', () => {
      if (!completed) overlay.style.display = 'grid';
    });

    // once finished, allow native controls (if you want to let them scrub back)
    function enableControlsIfDone(){
      if (completed) { video.controls = true; overlay.remove(); }
    }
    video.addEventListener('ended', () => { completed = true; enableControlsIfDone(); });

    video.addEventListener('loadedmetadata', () => { freezeRate(); seekingGuard(); });
    video.addEventListener('error', () => toast('Video failed to load (check file path).', 'error'), { once:true });
  }

  /* hide “✅” until reveal=true */
  function sanitizeOptionText(opt, reveal) {
    return reveal ? String(opt) : String(opt).replace(/\s*✅/g, '');
  }

  /* ─────────────────────────
     Quiz render/grade (+persistence)
  ───────────────────────────*/
  function renderQuiz(root, items, onChange, opts={}){
    const savedChoices = opts.savedChoices || [];
    const onChoice     = opts.onChoice || (()=>{});
    const revealMarks  = !!opts.revealMarks;

    root.innerHTML = '';
    items.forEach((q, idx) => {
      const card = document.createElement('div'); card.className='q-item';
      const t = document.createElement('div'); t.className='q-title'; t.textContent = `${idx+1}. ${q.stem}`;
      const wrap = document.createElement('div'); wrap.className='q-options';
      q._choice = (typeof savedChoices[idx]==='number') ? savedChoices[idx] : null;

      (q.options || []).forEach((opt,i)=>{
        const lab = document.createElement('label');
        const r = document.createElement('input'); r.type='radio'; r.name=`q${idx}`; r.value=i;
        if (q._choice===i) r.checked = true;
        r.addEventListener('change', ()=>{
          q._choice = i;
          card.classList.remove('correct','incorrect');
          onChoice(idx, i); onChange?.();
        });
        const span = document.createElement('span');
        span.innerHTML = sanitizeOptionText(opt, revealMarks);
        lab.appendChild(r); lab.appendChild(span); wrap.appendChild(lab);
      });

      const res = document.createElement('div'); res.className='result';
      card.appendChild(t); card.appendChild(wrap); card.appendChild(res);
      root.appendChild(card);
    });

    if (Array.isArray(opts.correctness)){
      opts.correctness.forEach((ok, idx)=>{
        if (ok==null) return;
        const card = root.children[idx];
        card.classList.add(ok ? 'correct' : 'incorrect');
        const res = card.querySelector('.result');
        res.textContent = ok ? 'Correct.' : 'Incorrect.';
      });
    }
  }

  function gradeQuiz(root, items, answerKey='answer_index', rationaleKey='rationale'){
    let correct = 0;
    items.forEach((q, idx) => {
      const ok = Number(q._choice) === Number(q[answerKey]);
      if (ok) correct++;
      const card = root.children[idx];
      card.classList.add(ok ? 'correct' : 'incorrect');
      const res = card.querySelector('.result');
      res.innerHTML = ok ? 'Correct.' : 'Incorrect.';
      if (q[rationaleKey]){
        const d = document.createElement('div'); d.className='drawer';
        d.textContent = `Rationale: ${q[rationaleKey]}`; res.appendChild(d);
      }
    });
    const pct = Math.round((correct / items.length) * 100);
    return { correct, total: items.length, pct };
  }

  function normalizeQuiz(json){
    const arr = Array.isArray(json) ? json : (json.items || json.questions || []);
    if (!Array.isArray(arr) || !arr.length) throw new Error('quiz.json has no items');

    const keyIndex = k => {
      if (typeof k === 'number') return k;
      if (typeof k === 'string'){
        const up = k.trim().toUpperCase();
        const map = {A:0,B:1,C:2,D:3,E:4,F:5};
        if (up in map) return map[up];
        return -1;
      }
      return -1;
    };

    return arr.map((it,i)=>{
      const stem = it.stem || it.question || it.prompt || `Question ${i+1}`;
      const options = it.options || it.choices || it.answers || [];
      let ai = (it.answer_index ?? it.answer ?? it.correctIndex ?? it.correct ?? it.key);
      if (typeof ai === 'string' && !/^[A-F]$/i.test(ai)){
        ai = options.findIndex(o => (''+o).replace(/\s+/g,' ').trim() === ai.replace(/\s+/g,' ').trim());
      } else {
        ai = keyIndex(ai);
      }
      if (ai < 0 || ai >= options.length) throw new Error(`Invalid answer index for item ${i+1}`);
      const rationale = it.rationale || it.explanation || it.reason || '';
      return { stem, options, answer_index:Number(ai), rationale, _choice:null };
    });
  }

  /* ─────────────────────────
     Content: Pre items inline
  ───────────────────────────*/
  const PRE_ITEMS = [
    { stem:'A checkout shows a $19 warranty box pre-checked. What do you do first?', options:['Uncheck the warranty, screenshot the cart, then continue checkout. ✅','Uncheck the warranty and proceed without taking any screenshots.','Leave the warranty checked, then contact support after receiving any charges.','Close the tab and search for a cheaper seller before buying.'], answer_index:0, rationale:'Unchecking plus a screenshot is fastest and preserves proof if charged in error.' },
    { stem:'The cancel flow highlights “Pause” with a large button while “Cancel” is tiny and gray. Best next step?', options:['Click the prominent Pause option and assume it cancels later.','Search the page for explicit cancel wording, screenshot the UI, then choose cancel. ✅','Call support immediately to ask what Pause actually does.','Close the site and try again another day without screenshots.'], answer_index:1, rationale:'Find explicit cancel controls and document UI tricks before accepting a pause.' },
    { stem:'A service requires phone calls only, weekdays 9–5 to cancel. You can call once this week. What protects you most?', options:['Call once, request cancellation, and keep a dated note of the agent’s name. ✅','Call multiple times until you reach a supervisor and take no notes.','Skip calling; instead file a complaint with your card issuer immediately.','Visit the company in person and rely on verbal confirmation.'], answer_index:0, rationale:'Use required channel once and record agent/time to create an evidentiary trail.' },
    { stem:'A banner says “62 people viewing now” with no source. What’s the reasonable consumer action?', options:['Rush to buy because the number likely means low stock.','Ignore the banner and open another tab to compare price and stock. ✅','Ask chat support to confirm the banner’s accuracy before deciding.','Add to cart, then wait 24 hours to see if price drops.'], answer_index:1, rationale:'Verify independently; manufactured urgency should not drive an immediate decision.' },
    { stem:'After clicking “No thanks,” a modal re-labels buttons with vague text. What should you do before clicking?', options:['Use keyboard/tab keys to select the intended action, then screenshot before and after. ✅','Click the large button quickly to avoid extra popups.','Reload the page and attempt the flow without any screenshots.','Contact support to ask which button is correct before proceeding.'], answer_index:0, rationale:'Keyboard navigation bypasses visual tricks; screenshots prove the UI state.' },
    { stem:'A free trial requires a credit card and hides renewal terms in Billing Details. What’s the safest pre-signup step?', options:['Sign up and rely on your calendar memory to cancel in time.','Record the billing page, note trial length, and set a calendar reminder before signing. ✅','Never use free trials; ignore the product entirely.','Use your main email and enable autofill to speed registration.'], answer_index:1, rationale:'Capturing terms and a reminder prevents surprise renewals.' },
    { stem:'You notice an unexpected line item in your cart total you didn’t add. Which evidence is most useful?', options:['Screenshot of the cart showing the unexpected line item and the full total. ✅','Photo of the product page after checkout.','The merchant’s merchant ID number on their homepage.','A comment from another buyer complaining about extra charges.'], answer_index:0, rationale:'A cart screenshot ties the unexpected item directly to checkout state and price.' },
    { stem:'The signup form bundles marketing emails with required consent. What’s the safest approach?', options:['Check the box and assume you can opt out later from settings.','Look for separate marketing or communications settings, or use an alternate email address. ✅','Abandon the signup entirely because bundled consent is always enforceable.','Call support to request the checkbox be removed before signing up.'], answer_index:1, rationale:'Use settings or an alternate email to avoid bundled consent while still testing the product.' },
    { stem:'You see a pop-up claiming “Only loyal customers keep this.” What does this aim to do and what should you do?', options:['It is a loyalty program notice; enroll now for benefits.','It uses guilt to discourage leaving; proceed with your plan and save confirmation. ✅','It is a legal requirement to disclose fees; read the TOS immediately.','It’s a sign of a broken site; try again later.'], answer_index:1, rationale:'Guilt language is persuasive copy; ignore persuasion and document your chosen action.' },
    { stem:'You were unsuccessful with several pre-quiz items. Which short remediation would help you most?', options:['Read a two-minute example showing one cancellation and one refund scenario with screenshots. ✅','Re-take the pre-quiz immediately without additional materials.','Jump ahead to Module 3 and assume practice will fill gaps.','Read the full platform T&Cs for each merchant in the course examples.'], answer_index:0, rationale:'Short, focused examples directly improve practical skills without overwhelming the learner.' }
  ];

  /* ─────────────────────────
     PRE-quiz (persist; hide checks until submit)
  ───────────────────────────*/
  (function initPre(){
    const preRoot   = $('#pre-quiz-root');
    const preBtn    = $('#pre-submit');
    const preResult = $('#pre-result');

    const saved = Array.isArray(state.preQuiz.answers) ? state.preQuiz.answers : [];
    const correctness = Array.isArray(state.preQuiz.correctness) ? state.preQuiz.correctness : [];

    const onAnyChange = () => setBtnState(preBtn, PRE_ITEMS.every(q => q._choice !== null));
    const onChoice = (idx, val) => { state.preQuiz.answers[idx] = val; saveState(state); };

    renderQuiz(preRoot, PRE_ITEMS, onAnyChange, {
      savedChoices: saved,
      correctness,
      onChoice,
      revealMarks: !!state.preQuiz.completed
    });
    onAnyChange();

    if (state.preQuiz.completed) {
      const correct = (state.preQuiz.correctness || []).filter(Boolean).length;
      const total   = PRE_ITEMS.length;
      const pct     = state.preQuiz.score || Math.round((correct/total)*100);
      preResult.textContent = `Score: ${correct}/${total} (${pct}%). Diagnostic only.`;
      preRoot.querySelectorAll('input[type="radio"], button, select, textarea').forEach(el => el.disabled = true);
      preBtn.disabled = true; preBtn.setAttribute('aria-disabled', 'true');
    }

    preBtn?.addEventListener('click', () => {
      if (preBtn.disabled) return;
      const { correct, total, pct } = gradeQuiz(preRoot, PRE_ITEMS, 'answer_index', 'rationale');
      state.preQuiz = {
        completed: true,
        score: pct,
        answers: PRE_ITEMS.map(q => q._choice),
        correctness: PRE_ITEMS.map(q => Number(q._choice) === Number(q.answer_index))
      };
      saveState(state);
      ffTrack('pre_quiz_submit', { score: pct });
      preResult.textContent = `Score: ${correct}/${total} (${pct}%). Diagnostic only.`;
      renderQuiz(preRoot, PRE_ITEMS, ()=>{}, {
        savedChoices: state.preQuiz.answers,
        correctness: state.preQuiz.correctness,
        revealMarks: true
      });
      preRoot.querySelectorAll('input[type="radio"], button, select, textarea').forEach(el => el.disabled = true);
      preBtn.disabled = true; preBtn.setAttribute('aria-disabled', 'true');
      toast('Pre-quiz completed. Module 1 video unlocked.', 'success');
      updateLocks();
      document.querySelector('#module-1')?.scrollIntoView({ behavior:'smooth' });
    });
  })();

  /* ─────────────────────────
     Module loaders (lazy)
  ───────────────────────────*/
  let m1Loaded=false, m2Loaded=false, m3Loaded=false, m4Loaded=false, postLoaded=false;

  function loadM1(){
    if (m1Loaded) return; m1Loaded = true;
    gateVideo($('#m1-video'), () => { state.m1.video = true; saveState(state); updateLocks(); ffTrack('video_complete',{module:'m1'}); });
    const btn = $('#m1-mark-read'), mount = $('#md-01');
    loadMarkdownSmart('01-foundations.md', mount, btn);
    btn?.addEventListener('click', () => {
      if (btn.disabled || btn.getAttribute('aria-disabled')==='true') return toast('Scroll to the end first.', 'error');
      state.m1.article = true; saveState(state); updateLocks();
      toast('Module 1 article marked as read.', 'success'); ffTrack('article_read',{module:'m1'});
    });
  }

  function loadM2(){
    if (m2Loaded) return; m2Loaded = true;
    gateVideo($('#m2-video'), () => { state.m2.video = true; saveState(state); updateLocks(); ffTrack('video_complete',{module:'m2'}); });
    const btn = $('#m2-mark-read'), mount = $('#md-02');
    loadMarkdownSmart('02-families.md', mount, btn);
    btn?.addEventListener('click', () => {
      if (btn.disabled || btn.getAttribute('aria-disabled')==='true') return toast('Scroll to the end first.', 'error');
      state.m2.article = true; saveState(state); updateLocks();
      toast('Module 2 article marked as read.', 'success'); ffTrack('article_read',{module:'m2'});
    });

    // ID exercise — feedback only on submit; allow retries until all correct
    (async () => {
      const root = $('#id-ex-root'), submit = $('#id-ex-submit'), out = $('#id-ex-result');
      try {
        const data = await fetchFirst('id-exercise.json', 'json');
        if (!data.items?.length) throw new Error('No items in id-exercise.json');
        root.innerHTML = '';

        // Build items
        data.items.forEach((it, idx) => {
          it._choice = null;
          const card = document.createElement('div'); card.className='q-item';
          const t = document.createElement('div'); t.className='q-title'; t.textContent = it.vignette;
          const opts = document.createElement('div'); opts.className='q-options';

          it.options.forEach((opt,i)=>{
            const lab = document.createElement('label');
            const r = document.createElement('input'); r.type='radio'; r.name=`id${idx}`; r.value=i;
            r.addEventListener('change', () => {
              it._choice = i;
              // Clear any prior feedback on change; do NOT grade yet
              card.classList.remove('correct','incorrect');
              const res = card.querySelector('.result');
              if (res) res.textContent = '';
              setBtnState(submit, data.items.every(x=>x._choice!==null));
            });
            lab.appendChild(r); lab.appendChild(document.createTextNode(opt));
            opts.appendChild(lab);
          });

          const res = document.createElement('div'); res.className='result';
          card.appendChild(t); card.appendChild(opts); card.appendChild(res);
          root.appendChild(card);
        });

        // initial state
        setBtnState(submit, false);

        // Grade only when the button is clicked; allow unlimited retries
        submit.addEventListener('click', () => {
          if (submit.disabled) return;
          let correct = 0;
          data.items.forEach((it, idx) => {
            const ok = Number(it._choice) === Number(it.answer_index);
            if (ok) correct++;
            const card = root.children[idx];
            const res = card.querySelector('.result');
            card.classList.toggle('correct', ok);
            card.classList.toggle('incorrect', !ok);
            if (ok) {
              res.innerHTML = `Correct. Recommended counter-move: ${it.countermove}<div class="drawer">Rationale: ${it.rationale}</div>`;
            } else {
              res.textContent = 'Incorrect — try again.';
            }
          });

          const total = data.items.length;
          const allCorrect = correct === total;
          out.textContent = allCorrect
            ? `All ${total}/${total} correct.`
            : `${total - correct} incorrect. Fix and check again.`;

          if (allCorrect) {
            state.m2.idExercise = true; saveState(state); updateLocks();
            ffTrack('id_exercise_complete', { items: total, correct });
            toast('Identification exercise completed.', 'success');
            setBtnState(submit, false);
          } else {
            // keep submit enabled so learner can retry after changing answers
            setBtnState(submit, true);
            // focus first incorrect to guide retry
            const firstBad = Array.from(root.children).find((el, i) => Number(data.items[i]._choice) !== Number(data.items[i].answer_index));
            firstBad?.querySelector('input[type="radio"]')?.focus();
          }
        });
      } catch (e) {
        root.innerHTML = `<div class="subtle">Couldn’t load <code>id-exercise.json</code>. If this page is opened via <code>file://</code>, some browsers block local fetch. Run a local server or keep using the fallback.</div>`;
        setBtnState($('#id-ex-submit'), false);
      }
    })();
  }

  function loadM3(){
    if (m3Loaded) return; m3Loaded = true;
    gateVideo($('#m3-video'), () => { state.m3.video = true; saveState(state); updateLocks(); ffTrack('video_complete',{module:'m3'}); });
    const btn = $('#m3-mark-read'), mount = $('#md-03');
    loadMarkdownSmart('03-counter-moves.md', mount, btn);
    btn?.addEventListener('click', () => {
      if (btn.disabled || btn.getAttribute('aria-disabled')==='true') return toast('Scroll to the end first.', 'error');
      state.m3.article = true; saveState(state); updateLocks();
      toast('Module 3 article marked as read.', 'success'); ffTrack('article_read',{module:'m3'});
    });
    $('#drills-check')?.addEventListener('click', () => {
      const t = ($('#drills').value || '').toLowerCase();
      const hasIdOrEmail = /\b(id|account|email)\b/.test(t);
      const hasDate      = /\b\d{4}-\d{2}-\d{2}\b/.test(t);
      const askConfirm   = /(confirm|confirmation)/.test(t);
      const channel      = /(phone|chat|email)/.test(t);
      const list = [
        `${hasIdOrEmail ? '✔' : '•'} contains ID/email`,
        `${hasDate ? '✔' : '•'} contains a date`,
        `${askConfirm ? '✔' : '•'} asks for written confirmation`,
        `${channel ? '✔' : '•'} states the channel used`
      ];
      $('#drill-checklist').textContent = list.join(' · ');
      state.m3.drillsChecked = true; saveState(state);
    });
  }

  function loadM4(){
    if (m4Loaded) return; m4Loaded = true;
    const btn = $('#m4-mark-read'), mount = $('#md-04');
    loadMarkdownSmart('04-evidence.md', mount, btn);
    btn?.addEventListener('click', () => {
      if (btn.disabled || btn.getAttribute('aria-disabled')==='true') return toast('Scroll to the end first.', 'error');
      state.m4.article = true; saveState(state); updateLocks();
      toast('Module 4 article marked as read.', 'success'); ffTrack('article_read',{module:'m4'});
    });

    const form = $('#audit-form'), out = $('#audit-output'), actions = $('#audit-actions');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const merchant = fd.get('merchant'); const action = fd.get('action');
      const date = fd.get('date'); const channel = fd.get('channel');
      const saw = fd.get('saw'); const patterns = fd.getAll('patterns').join(', '); const evidence = fd.getAll('evidence').join(', ') || '—';
      const nextStep = (() => {
        if (action === 'cancel') return 'Send a concise, dated cancellation via required channel; request written confirmation.';
        if (action === 'refund') return 'Quote policy, attach proof, and request refund by a clear deadline.';
        if (action === 'opt-out') return 'Change settings, capture before/after, and verify by email.';
        if (action === 'delete account') return 'Submit deletion request and archive confirmation.';
        return 'Document and set a follow-up date.';
      })();
      const lines = [
        `Merchant/platform: ${merchant}`,
        `Action attempted: ${action}`,
        `Date/time: ${date} via ${channel}`,
        `What you saw: ${saw}`,
        `Pattern(s) observed: ${patterns}`,
        `Evidence captured: ${evidence}`,
        `Next two actions:`,
        `  1) ${nextStep}`,
        `  2) If ignored, escalate to platform/payment rails with your proof pack.`
      ];
      out.textContent = lines.join('\n');
      out.hidden = false; actions.hidden = false;

      const entry = { id:`AUD-${Date.now()}`, dateISO:new Date().toISOString(), merchant, action, date, channel, saw, patterns, evidence };
      try { const arr = JSON.parse(localStorage.getItem(AUDITS_KEY) || '[]'); arr.push(entry); localStorage.setItem(AUDITS_KEY, JSON.stringify(arr)); } catch {}
      state.m4.auditSubmitted = true; state.m4.auditId = entry.id; saveState(state); updateLocks();
      ffTrack('audit_submitted', { id:entry.id, merchant, action });
      toast('Risk Audit generated.', 'success');
    });
    $('#copy-audit')?.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText($('#audit-output').textContent); toast('Copied to clipboard.', 'success'); }
      catch { toast('Copy failed.', 'error'); }
    });
    $('#print-audit')?.addEventListener('click', () => window.print());
  }

  async function loadPOST(){
    if (postLoaded) return; postLoaded = true;
    const root = $('#post-quiz-root'), btn = $('#post-submit'), result = $('#post-result');

    try {
      const dataRaw = await fetchFirst('quiz.json', 'json');
      const items   = normalizeQuiz(dataRaw);

      const saved = Array.isArray(state.postQuiz.answers) ? state.postQuiz.answers : [];
      const corr  = Array.isArray(state.postQuiz.correctness) ? state.postQuiz.correctness : [];
      const onAny = () => setBtnState(btn, items.every(q => q._choice !== null));
      const onChoice = (idx, val) => { state.postQuiz.answers[idx] = val; saveState(state); };

      renderQuiz(root, items, onAny, { savedChoices:saved, correctness:corr, onChoice });
      onAny();

      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const { correct, total, pct } = gradeQuiz(root, items, 'answer_index', 'rationale');
        const pass = pct >= 80;
        state.postQuiz = {
          completed: true, score: pct, pass,
          answers: items.map(q => q._choice),
          correctness: items.map(q => Number(q._choice) === Number(q.answer_index))
        };
        saveState(state); ffTrack('post_quiz_submit', { score:pct, pass });
        result.textContent = `Score: ${correct}/${total} (${pct}%). ${pass ? 'Pass ✅' : 'Below 80% — review and try again.'}`;
        if (pass){ toast('Assessment passed. Certificate unlocked.', 'success'); updateLocks(); $('#certificate')?.scrollIntoView({ behavior:'smooth' }); }
        else toast('Score below 80%. Review modules and retry.', 'error');
      }, { once:true });
    } catch (e) {
      root.innerHTML = `<div class="subtle">Couldn’t load <code>quiz.json</code>. If this page is opened via <code>file://</code>, some browsers block local fetch. Run a small local server (e.g., <code>python -m http.server</code>), or host the files.</div>`;
      setBtnState(btn, false);
    }
  }

  /* ─────────────────────────
     Linear path (one unlocked)
  ───────────────────────────*/
  const sections = {
    m1:   $('#module-1'), m2: $('#module-2'),
    m3:   $('#module-3'), m4: $('#module-4'),
    post: $('#post-quiz'), cert: $('#certificate')
  };

  const LINEAR_STEPS = [
    { key:'pre',        label:'Pre-quiz',               section:'#pre-quiz',  loader: ()=>{},         done: ()=> state.preQuiz.completed },
    { key:'m1_video',   label:'Module 1 — Video',       section:'#module-1',  loader: ()=>loadM1(),   done: ()=> state.m1.video },
    { key:'m1_article', label:'Module 1 — Article',     section:'#module-1',  loader: ()=>loadM1(),   done: ()=> state.m1.article },
    { key:'m2_video',   label:'Module 2 — Video',       section:'#module-2',  loader: ()=>loadM2(),   done: ()=> state.m2.video },
    { key:'m2_article', label:'Module 2 — Article',     section:'#module-2',  loader: ()=>loadM2(),   done: ()=> state.m2.article },
    { key:'m2_id',      label:'Module 2 — ID exercise', section:'#module-2',  loader: ()=>loadM2(),   done: ()=> state.m2.idExercise },
    { key:'m3_video',   label:'Module 3 — Video',       section:'#module-3',  loader: ()=>loadM3(),   done: ()=> state.m3.video },
    { key:'m3_article', label:'Module 3 — Article',     section:'#module-3',  loader: ()=>loadM3(),   done: ()=> state.m3.article },
    { key:'m4_article', label:'Module 4 — Article',     section:'#module-4',  loader: ()=>loadM4(),   done: ()=> state.m4.article },
    { key:'audit',      label:'Module 4 — Risk Audit',  section:'#module-4',  loader: ()=>loadM4(),   done: ()=> state.m4.auditSubmitted },
    { key:'post',       label:'Post-quiz',              section:'#post-quiz', loader: ()=>loadPOST(), done: ()=> state.postQuiz.pass },
    { key:'cert',       label:'Certificate',            section:'#certificate', loader:()=>{},         done: ()=> state.certificate.issued }
  ];

  // determine if an entire section is complete so we never re-lock it
  function sectionIsComplete(selector) {
    switch (selector) {
      case '#pre-quiz':   return !!state.preQuiz.completed;
      case '#module-1':   return !!(state.m1.video && state.m1.article);
      case '#module-2':   return !!(state.m2.video && state.m2.article && state.m2.idExercise);
      case '#module-3':   return !!(state.m3.video && state.m3.article);
      case '#module-4':   return !!(state.m4.article && state.m4.auditSubmitted);
      case '#post-quiz':  return !!state.postQuiz.pass;
      case '#certificate': return !!(state.certificate.issued || state.postQuiz.pass);
      default: return false;
    }
  }

  function firstIncompleteIndex(){
    for (let i=0;i<LINEAR_STEPS.length;i++) if (!LINEAR_STEPS[i].done()) return i;
    return LINEAR_STEPS.length-1;
  }

  function renderSidebar(currentIdx){
    const list = $('#progress-list'); const fill = $('#ps-fill');
    if (!list || !fill) return;
    const total = LINEAR_STEPS.length;
    const doneCount = LINEAR_STEPS.filter(s => s.done()).length;
    fill.style.width = `${Math.round((doneCount/total)*100)}%`;
    list.innerHTML = '';
    LINEAR_STEPS.forEach((s, i) => {
      const li = document.createElement('li');
      li.className = [
        i < currentIdx ? 'ps-item--done'    : '',
        i === currentIdx ? 'ps-item--current' : '',
        i > currentIdx ? 'ps-item--locked' : ''
      ].join(' ').trim();
      li.innerHTML = `<span class="ps-dot" aria-hidden="true"></span><a href="${s.section}">${s.label}</a>`;
      list.appendChild(li);
    });
  }

  function updateLocks(){
    const idx = firstIncompleteIndex();
    const current = LINEAR_STEPS[idx];

    // Load assets for the *current* step
    current.loader?.();

    // NEW: also load assets for any sections already completed,
    // so their articles/videos are present after a refresh.
    LINEAR_STEPS.forEach(s => {
      if (sectionIsComplete(s.section)) s.loader?.();
    });

    const msg = `Finish “${current.label}” first`;

    // Unlock the *current* section element once
    const currentEl = document.querySelector(current.section);
    if (currentEl) {
      lockSection(currentEl, false);
      currentEl.classList.remove('peekable');
    }

    // Lock/unlock rules:
    //  • Completed sections stay UNLOCKED forever
    //  • Pre-quiz remains visible read-only after completion
    //  • Only not-yet-complete, not-current sections are locked
    LINEAR_STEPS.forEach((s) => {
      const el = document.querySelector(s.section);
      if (!el) return;
      if (el === currentEl) return;

      // Completed sections: always unlocked (and now preloaded above)
      if (sectionIsComplete(s.section)) {
        lockSection(el, false);
        el.classList.remove('peekable');
        return;
      }

      // Pre-quiz after completion: visible but read-only
      if (s.key === 'pre' && state.preQuiz.completed) {
        lockSection(el, false);
        el.classList.add('peekable');
        el.querySelectorAll('input, button, select, textarea').forEach(n => n.disabled = true);
        return;
      }

      // Otherwise, lock with guidance
      lockSection(el, true, msg);
      el.classList.remove('peekable');
    });

    // Cosmetic stepper + sidebar
    setStepStatus('pre', true, state.preQuiz.completed);
    setStepStatus('m1',  state.preQuiz.completed, (state.m1.video && state.m1.article));
    setStepStatus('m2',  state.m1.video && state.m1.article, (state.m2.video && state.m2.article && state.m2.idExercise));
    setStepStatus('m3',  state.m2.video && state.m2.article && state.m2.idExercise, (state.m3.video && state.m3.article));
    setStepStatus('m4',  state.m3.video && state.m3.article, (state.m4.article && state.m4.auditSubmitted));
    setStepStatus('post',state.m4.article && state.m4.auditSubmitted, state.postQuiz.pass);
    setStepStatus('cert',state.postQuiz.pass, state.certificate.issued);

    bumpCourseProgress();
    renderSidebar(idx);
  }

  /* ─────────────────────────
     Certificate
  ───────────────────────────*/
  const certSheet = $('#certificate-sheet');
  function prepareCertificate(){
    const nm   = localStorage.getItem(NAME_KEY) || 'Learner';
    const score= `${state.postQuiz.score}%`;
    const id   = state.certificate.id   || `FF-DP-${Date.now()}`;
    const date = state.certificate.date || new Date().toISOString().slice(0,10);
    certSheet.querySelector('#cert-name').textContent  = nm;
    certSheet.querySelector('#cert-score').textContent = score;
    certSheet.querySelector('#cert-date').textContent  = `Date: ${date}`;
    certSheet.querySelector('#cert-id').textContent    = id;
    state.certificate = { issued:true, id, date }; saveState(state);
  }
  $('#download-cert')?.addEventListener('click', ()=>{ prepareCertificate(); window.print(); ffTrack('certificate_print'); });
  $('#download-badge')?.addEventListener('click', async () => {
    const svg = document.querySelector('#certificate .badge-svg').outerHTML;
    const svgBlob = new Blob([svg], { type:'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width=512; c.height=512;
      const ctx = c.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,c.width,c.height);
      ctx.drawImage(img,64,64,384,384);
      c.toBlob(blob => { const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='FinanceFirst_Badge_Dark-Pattern-Spotter.png'; a.click(); URL.revokeObjectURL(a.href); ffTrack('badge_download'); }, 'image/png');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });

  // Make the progress panel a tad skinnier so it fits the margin
  function shrinkProgressPanel(){
    const list = document.getElementById('progress-list');
    if (!list) return;
    const panel = list.closest('aside') || list.closest('[class*="progress"]') || list.parentElement;
    if (panel) { panel.style.maxWidth = '240px'; panel.style.width = '240px'; }
  }

  // Boot
  updateLocks();
  shrinkProgressPanel();
})();
