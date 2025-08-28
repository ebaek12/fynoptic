/* FinanceFirst — Articles page logic (vanilla JS) */
(() => {
    'use strict';
  
    // Analytics stub
    window.ffTrack = window.ffTrack || function (e, p) {
      console.log('[ffTrack]', e, p || {});
    };
  
    // -------- Data: 12 placeholders now, scalable to 100+ --------
// -------- Data loader --------
function computeReadMins(text) {
    const words = (text || "").trim().split(/\s+/).filter(Boolean).length;
    return Math.max(3, Math.round(words / 225)); // ~225 wpm
  }
  function plainToHTML(text) {
    // escape then make paragraphs from blank lines
    const esc = (text || "").replace(/[&<>]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[s]));
    return '<p>' + esc.split(/\n{2,}/).join('</p><p>') + '</p>';
  }
  
  let ARTICLES_DB;
  
  // If articles-data.js populated window.ARTICLES, normalize it for the UI.
  // Expected optional fields in your data file: tags[], blurb, dateISO, readMins, body|content
  if (Array.isArray(window.ARTICLES) && window.ARTICLES.length) {
    ARTICLES_DB = window.ARTICLES.map(a => {
      const hasHTML = typeof a.content === 'string' && /<\/?[a-z][\s\S]*>/i.test(a.content);
      const bodyHTML = a.body || (hasHTML ? a.content : plainToHTML(a.content));
      return {
        id: a.id,
        title: a.title,
        tags: a.tags && a.tags.length ? a.tags : ['Guides'],
        blurb: a.blurb || a.title,
        date: a.dateISO || new Date().toISOString().slice(0,10),
        readMins: a.readMins || computeReadMins(a.body || a.content || ''),
        body: bodyHTML
      };
    });
  } else {
    // -------- fallback placeholders (your original list) --------
    ARTICLES_DB = [
      { id: 'subs-checklist', title: 'The Subscription Cancel Checklist', tags: ['Subscriptions'], blurb: 'A quick path to “I’m out.”', date: '2025-05-01', readMins: 6, body: '<p>Three steps to cancel with confidence. Save confirmations and set reminders.</p>' },
      { id: 'chargeback', title: 'How to Win a Chargeback', tags: ['Disputes'], blurb: 'Dispute like you mean it.', date: '2025-04-12', readMins: 7, body: '<p>Collect evidence, use the right reason codes, and follow up in writing.</p>' },
      { id: 'junk-fees-guide', title: 'Junk Fees: What’s Illegal vs. Annoying', tags: ['Fees'], blurb: 'Know when to push back.', date: '2025-03-29', readMins: 8, body: '<p>Screenshot quotes, ask for fee schedules, and escalate when needed.</p>' },
      { id: 'bnpl-impact', title: 'BNPL: Late Fees & Credit Impact', tags: ['BNPL'], blurb: 'What to watch before you tap.', date: '2025-04-02', readMins: 6, body: '<p>Autopay pitfalls, grace periods, and dispute windows to know.</p>' },
      { id: 'dark-patterns', title: 'Dark Patterns to Watch For', tags: ['Privacy'], blurb: 'UI tricks that drain money.', date: '2025-02-20', readMins: 5, body: '<p>Prechecked boxes, hidden skip links, and roach-motel flows.</p>' },
      { id: 'gym-contracts', title: 'Gym & Fitness Contracts', tags: ['Subscriptions'], blurb: 'Stop the eternal membership.', date: '2025-05-20', readMins: 6, body: '<p>Certified mail letters, keep proof, and block charges if needed.</p>' },
      { id: 'air-travel-fees', title: 'Airline & Hotel Add-on Fees', tags: ['Fees'], blurb: 'Resort, seat, and carry-on fees decoded.', date: '2025-03-10', readMins: 7, body: '<p>Total cost calculations and DOT complaint links.</p>' },
      { id: 'debt-validation', title: 'Debt Collection: Your Validation Rights', tags: ['Disputes'], blurb: 'Make them prove it.', date: '2025-01-26', readMins: 7, body: '<p>Demand validation within 30 days and keep detailed logs.</p>' },
      { id: 'free-trials', title: 'Free Trials: Avoid Surprise Charges', tags: ['Subscriptions'], blurb: 'Set timers and cancel cleanly.', date: '2025-06-09', readMins: 5, body: '<p>Use burner cards and reminders to dodge surprise renewals.</p>' },
      { id: 'privacy-settings', title: 'Privacy Settings That Save Money', tags: ['Privacy'], blurb: 'Opt-outs that matter.', date: '2025-04-28', readMins: 5, body: '<p>Limit data sharing that can raise prices or increase targeting.</p>' },
      { id: 'hotel-resort-fees', title: 'Resort Fees: Push Back the Right Way', tags: ['Fees'], blurb: 'When & how to dispute.', date: '2025-02-02', readMins: 6, body: '<p>Document inclusions and escalate with references to policy.</p>' },
      { id: 'student-loans', title: 'Servicer Playbook: Common Pitfalls', tags: ['Disputes'], blurb: 'Avoid gotchas on calls.', date: '2025-05-28', readMins: 9, body: '<p>Keep call logs, request written confirmation, and know your rights.</p>' }
    ];
  }
  
  
    // -------- DOM --------
    const grid = document.getElementById('articles-grid');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const resultCount = document.getElementById('result-count');
    const emptyState = document.getElementById('empty-state');
    const loadMoreBtn = document.getElementById('load-more');
    const floatTopBtn = document.getElementById('float-top');
  
    const readerModal = document.getElementById('reader-modal');
    const readerTitle = document.getElementById('reader-title');
    const readerMeta = document.getElementById('reader-meta');
    const readerBody = document.getElementById('reader-body');
    const progressBar = document.getElementById('reader-progress-bar');
  
    // -------- State --------
    let activeTag = 'all';
    let query = '';
    const pageSize = 12;  // bump for 100+
    let visibleCount = 0;
    let focusIndex = 0;
  
    // -------- Utils --------
    const debounce = (fn, ms = 250) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  
    // -------- Render helpers --------
    function getFiltered() {
      let list = ARTICLES_DB.slice();
  
      if (query.trim()) {
        const q = query.toLowerCase();
        list = list.filter(a => (a.title + ' ' + a.blurb + ' ' + a.tags.join(' ')).toLowerCase().includes(q));
      }
      if (activeTag !== 'all') {
        list = list.filter(a => a.tags.includes(activeTag));
      }
      if (sortSelect.value === 'new') list.sort((a, b) => new Date(b.date) - new Date(a.date));
      else if (sortSelect.value === 'old') list.sort((a, b) => new Date(a.date) - new Date(b.date));
      else list.sort((a, b) => a.readMins - b.readMins);
  
      return list;
    }
  
    function cardTemplate(a) {
      const date = new Date(a.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      return `
        <article class="card article-card reveal" tabindex="0" data-id="${a.id}" aria-label="${a.title}">
          <div class="art-media">
            <span class="art-badge">${a.tags[0]}</span>
          </div>
          <h3 class="art-title">${a.title}</h3>
          <div class="art-meta">${date} • ${a.readMins} min read</div>
          <p class="art-blurb">${a.blurb}</p>
          <div class="art-tags" aria-label="Tags">
            ${a.tags.map(t => `<span class="chip">${t}</span>`).join('')}
          </div>
        </article>
      `;
    }
  
    function render(reset = false) {
      const data = getFiltered();
      resultCount.textContent = `${data.length} ${data.length === 1 ? 'result' : 'results'}`;
  
      if (reset) {
        grid.innerHTML = '';
        visibleCount = 0;
        focusIndex = 0;
      }
  
      emptyState.style.display = data.length ? 'none' : 'block';
  
      const slice = data.slice(visibleCount, visibleCount + pageSize);
      const frag = document.createDocumentFragment();
      slice.forEach(a => {
        const wrap = document.createElement('div');
        wrap.innerHTML = cardTemplate(a);
        frag.appendChild(wrap.firstElementChild);
      });
      grid.appendChild(frag);
      visibleCount += slice.length;
  
      loadMoreBtn.style.display = (visibleCount < data.length) ? 'inline-block' : 'none';
      observeReveals();
    }
  
    // Reveal animation
    let io;
    function observeReveals() {
      if (io) io.disconnect();
      io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in-view');
            io.unobserve(e.target);
          }
        }
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
      document.querySelectorAll('.reveal:not(.in-view)').forEach(el => io.observe(el));
    }
  
    // -------- Events --------
    const onSearch = debounce((e) => { query = e.target.value; render(true); }, 250);
    searchInput.addEventListener('input', onSearch);
    sortSelect.addEventListener('change', () => render(true));
  
    document.querySelectorAll('.filters .chip').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filters .chip').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        activeTag = btn.dataset.tag;
        render(true);
      });
    });
  
    document.getElementById('clear-filters').addEventListener('click', () => {
      query = '';
      activeTag = 'all';
      searchInput.value = '';
      document.querySelectorAll('.filters .chip').forEach(b => b.classList.toggle('is-active', b.dataset.tag === 'all'));
      render(true);
    });
  
    loadMoreBtn.addEventListener('click', () => render(false));
  
    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== searchInput) {
        e.preventDefault(); searchInput.focus(); searchInput.select();
      }
      const cards = Array.from(document.querySelectorAll('.article-card'));
      if (!cards.length) return;
      if (['ArrowDown', 'ArrowRight'].includes(e.key)) { focusIndex = Math.min(focusIndex + 1, cards.length - 1); cards[focusIndex].focus(); }
      if (['ArrowUp', 'ArrowLeft'].includes(e.key)) { focusIndex = Math.max(focusIndex - 1, 0); cards[focusIndex].focus(); }
      if (e.key === 'Enter' && document.activeElement.classList.contains('article-card')) {
        openReader(document.activeElement.dataset.id);
      }
    });
  
    // Click/Enter to open reader
    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.article-card');
      if (card) openReader(card.dataset.id);
    });
    grid.addEventListener('keydown', (e) => {
      const card = e.target.closest('.article-card');
      if (card && e.key === 'Enter') openReader(card.dataset.id);
    });
  
    // Back-to-top button
    const onScroll = () => {
      document.getElementById('float-top').classList.toggle('show', window.scrollY > 600);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    floatTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  
    // -------- Reader modal --------
    function openReader(id) {
      const a = ARTICLES_DB.find(x => x.id === id);
      if (!a) return;
  
      readerTitle.textContent = a.title;
      const date = new Date(a.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      readerMeta.textContent = `${date} • ${a.readMins} min read • ${a.tags.join(', ')}`;
      readerBody.innerHTML = a.body || '<p><em>Coming soon.</em></p>';
      
  
      readerModal.hidden = false;
      document.body.style.overflow = 'hidden';
      location.hash = `article/${id}`;
      ffTrack('open_article', { id, title: a.title });
  
      // Focus first control
      const first = readerModal.querySelector('[data-modal-close]');
      if (first) first.focus();
  
      // Progress bar
      const scroller = readerBody;
      const onProg = () => {
        const max = scroller.scrollHeight - scroller.clientHeight;
        const pct = max > 0 ? (scroller.scrollTop / max) * 100 : 0;
        progressBar.style.width = pct + '%';
      };
      scroller.addEventListener('scroll', onProg, { passive: true });
      onProg();
    }
  
    function closeReader() {
      readerModal.hidden = true;
      document.body.style.overflow = '';
      if (location.hash.startsWith('#article/')) history.replaceState(null, '', '#');
      ffTrack('close_article');
    }
  
    readerModal.addEventListener('click', (e) => {
      if (e.target === readerModal || e.target.hasAttribute('data-modal-close')) closeReader();
    });
    window.addEventListener('keydown', (e) => {
      if (!readerModal.hidden && e.key === 'Escape') closeReader();
    });
  
    document.getElementById('save-reading').addEventListener('click', () => {
      toast('Saved to reading list');
      ffTrack('save_article', { title: readerTitle.textContent });
    });
  
    // Deep-link open (#article/slug)
    function checkHashOpen() {
      if (location.hash.startsWith('#article/')) {
        const id = location.hash.split('/')[1];
        if (id) openReader(id);
      }
    }
  
    // -------- Toasts --------
    function toast(msg) {
      const box = document.querySelector('.toast-container');
      const el = document.createElement('div');
      el.className = 'toast';
      el.setAttribute('role', 'status');
      el.innerHTML = msg;
      box.appendChild(el);
      setTimeout(() => { el.remove(); }, 4000);
    }
  
    // -------- Init --------
    render(true);
    checkHashOpen();
  
    // Minimal mobile menu toggling
    const toggle = document.querySelector('.nav-toggle');
    const mobile = document.getElementById('mobile-menu');
    if (toggle && mobile) {
      toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
        mobile.hidden = expanded;
      });
    }
  })();
  