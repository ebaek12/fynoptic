import { PARTNERS } from "../../data/partners";

export function PartnerStrip() {
  return (
    <div className="partners">
      <div className="partners-head">
        <span className="partners-kicker">In partnership with</span>
      </div>
      <div className="logo-ticker" role="region" aria-label="Partner Organizations">
        <div className="logo-track">
          <div className="partner-set">
            {PARTNERS.map((partner) => (
              <a
                className="logo-card"
                data-logo-plate={partner.plate}
                key={partner.image}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${partner.name}, official website (opens in a new tab)`}
              >
                <img src={"/assets/img/" + partner.image} alt={partner.name} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PartnerStrip;
