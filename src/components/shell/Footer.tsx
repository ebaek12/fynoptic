// Shared, server-rendered footer. h2 keeps its navigation headings accessible
// even on pages whose main content contains only an h1.
export function Footer() {
  return (
    <footer className="footer">
      <div className="ft-grid">
        <div className="ft-col ft-brand">
          <a href="/" className="ft-wordmark" aria-label="Fynoptic Home">
            <img src="/assets/img/fynopticlogo.png" alt="Fynoptic logo" className="footer-logo" />
            <span>Fynoptic</span>
          </a>
          <p className="footer-tagline">
            Helping people identify and avoid junk fees, dark patterns, and subscription traps.
          </p>
        </div>

        <div className="ft-col">
          <h2 className="s-label">Learn</h2>
          <ul className="footer-links">
            <li><a href="/courses">Courses</a></li>
            <li><a href="/articles">Articles</a></li>
            <li><a href="/flashcard">Flashcards</a></li>
            <li><a href="/practice">Practice</a></li>
          </ul>
        </div>

        <div className="ft-col">
          <h2 className="s-label">Fynoptic</h2>
          <ul className="footer-links">
            <li><a href="/about">About</a></li>
            <li><a href="/accessibility">Accessibility</a></li>
            <li><a href="/privacy">Privacy</a></li>
          </ul>
          <p className="footer-contact">info@fynoptic.org</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 Fynoptic. Educational content; examples are illustrative, not legal advice.</p>
      </div>
    </footer>
  );
}
