import { Button } from "@/components/ui/button";
import { RotatingWord } from "./RotatingWord";
import { PartnerStrip } from "./PartnerStrip";
import { ScamIllustration } from "./ScamIllustration";

const ROTATING_WORDS = ["scam", "setup", "lie", "con", "trap"] as const;

export function Hero() {
  return (
    <div className="home-hero-layout">
      <h1 id="hero-heading">
        Learn the skills to
        <br />
        spot every{" "}
        <span className="hero-word-phrase">
          <RotatingWord
            words={ROTATING_WORDS}
            className="text-primary"
            suffix="."
          />
        </span>
      </h1>

      <div className="home-hero-details">
        <div className="home-hero-copy">
          <p className="home-hero-description">
            Hidden fees. Sneaky subscriptions. Offers that don’t add up.
            Learn what to watch for and what to do about it with free courses,
            articles, and practice questions.
          </p>
          <div className="home-hero-actions">
            <Button asChild size="hero" data-track="cta_click">
              <a href="/courses">Start the Free Course</a>
            </Button>
            <Button asChild size="hero" variant="outline">
              <a href="/practice">Try Practice Mode</a>
            </Button>
          </div>
          <p className="home-hero-note">
            Free to learn. No account needed to start.
          </p>
        </div>

        <div className="home-hero-aside">
          <ScamIllustration />
        </div>
      </div>

      <PartnerStrip />
    </div>
  );
}

export default Hero;
