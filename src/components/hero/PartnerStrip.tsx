import { PARTNERS } from "../../data/partners";

export function PartnerStrip() {
  return (
    <div className="partners">
      <div className="partners-head">
        <span className="partners-kicker">In partnership with</span>
      </div>
      <div
        className="logo-ticker"
        role="region"
        aria-label="Partner Organizations"
        tabIndex={0}
      >
        <div className="logo-track">
          {[0, 1].map((copy) => (
            <div
              className="partner-set"
              key={copy}
              aria-hidden={copy === 1 ? true : undefined}
            >
              {PARTNERS.map((partner) => (
                <a className="logo-card" key={partner.image} href={partner.url} target="_blank" rel="noopener noreferrer" tabIndex={copy === 1 ? -1 : undefined} aria-label={copy === 0 ? `${partner.name} — official website (opens in a new tab)` : undefined}>
                  <img
                    src={"/assets/img/" + partner.image}
                    alt={copy === 0 ? partner.name : ""}
                  />
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PartnerStrip;
