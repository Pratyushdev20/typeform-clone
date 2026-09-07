"use client";

import React from "react";
import {
  ArrowRight,
  ChevronDown,
  Play,
  Sparkles,
  WandSparkles,
  BarChart3,
  Check,
} from "lucide-react";
import styles from "./MarketingLanding.module.css";

interface MarketingLandingProps {
  onStart: () => void;
}

export const MarketingLanding: React.FC<MarketingLandingProps> = ({ onStart }) => {
  const navItems = ["Products", "Solutions", "Resources", "Pricing"];
  const capabilities = [
    [
      "Intelligent Forms",
      "Build smarter data flows. AI suggests the right next step for every response.",
    ],
    [
      "Growth Flow",
      "Connect and grow your apps with personalized experiences and workflow logic.",
    ],
    [
      "Research Flow",
      "Make confident decisions faster with AI-moderated studies and deeper answers.",
    ],
  ];

  return (
    <main className={styles.marketingPage}>
      {/* 1. Hero Section */}
      <section className={styles.marketingHero}>
        <header className={styles.marketingNav}>
          <button
            className={styles.marketingLogo}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Typeform home"
          >
            <span className={styles.marketingLogoMark}>
              <i />
              <i />
              <i />
            </span>
            <span>Typeform</span>
          </button>

          <nav className={styles.marketingNavLinks} aria-label="Main navigation">
            {navItems.map((item, index) => (
              <button key={item} type="button">
                {item}
                {index < 3 && <ChevronDown size={12} />}
              </button>
            ))}
          </nav>

          <div className={styles.marketingNavActions}>
            <button type="button" onClick={onStart}>
              Log in
            </button>
            <button type="button" onClick={onStart}>
              Contact sales
            </button>
            <button
              type="button"
              className={styles.marketingSignup}
              onClick={onStart}
            >
              Sign up
            </button>
          </div>
        </header>

        <div className={styles.marketingHeroCopy}>
          <p className={styles.marketingEyebrow}>THE NEXT GENERATION OF FORMS</p>
          <h1>
            Your favorite forms.
            <br />
            Now with AI automation.
          </h1>
          <p className={styles.marketingSubtitle}>
            Combine AI forms and automated workflows to drive revenue growth. Run
            in-depth research and manage the entire data lifecycle, all in
            Typeform.
          </p>
          <button
            type="button"
            className={styles.marketingPrimary}
            onClick={onStart}
          >
            Get started — it&apos;s free <ArrowRight size={17} />
          </button>
        </div>

        <div className={styles.marketingCapabilities}>
          {capabilities.map(([title, description], index) => (
            <button
              type="button"
              className={styles.marketingCapability}
              key={title}
              onClick={onStart}
            >
              <span className={styles.marketingCardLabel}>
                {["FORMS", "FLOW", "LEARN"][index]}
              </span>
              <strong>
                {title}
                {index > 0 && <em> NEW</em>}
              </strong>
              <span>{description}</span>
              <ArrowRight className={styles.marketingCardArrow} size={18} />
            </button>
          ))}
        </div>
        <div className={styles.heroGlow} aria-hidden="true" />
      </section>

      {/* 2. Flow Section */}
      <section className={styles.marketingFlowSection}>
        <div className={styles.flowIntro}>
          <p className={styles.marketingEyebrow}>ONE PLATFORM, EVERY MOMENT</p>
          <h2>
            Move from question
            <br />
            to action.
          </h2>
          <p>
            Turn every response into an experience that feels personal, useful,
            and built to move your business forward.
          </p>
        </div>
        <div className={styles.flowBoard}>
          <article>
            <WandSparkles />
            <span>Platform overview</span>
            <strong>Typeform AI</strong>
            <p>Your teammate for every form, flow and research project.</p>
            <b>Explore AI</b>
          </article>
          <article>
            <Sparkles />
            <span>Forms</span>
            <strong>
              Growth Flow <em>NEW</em>
            </strong>
            <p>Make every response the beginning of a better relationship.</p>
            <b>Build a flow</b>
          </article>
          <article>
            <BarChart3 />
            <span>Research</span>
            <strong>
              Research Flow <em>NEW</em>
            </strong>
            <p>Get richer insights without the work of traditional research.</p>
            <b>Discover research</b>
          </article>
          <div className={styles.flowVisual}>
            <div className={styles.flowForm}>
              <span>Customer feedback</span>
              <strong>How was your experience?</strong>
              <div>
                <i /> <i /> <i />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Prompt Section */}
      <section className={styles.marketingPromptSection}>
        <div>
          <p className={styles.marketingEyebrow}>GENERATE A FORM WITH AI</p>
          <h2>
            Build forms at the
            <br />
            drop of a prompt
          </h2>
          <p>
            With AI form responses collecting data is faster, more personal, and
            much more useful. Describe what you need and start collecting
            responses in seconds.
          </p>
          <button
            type="button"
            className={styles.marketingDarkButton}
            onClick={onStart}
          >
            Explore forms <ArrowRight size={16} />
          </button>
        </div>
        <div className={styles.promptArt}>
          <div className={styles.promptWindow}>
            <span>FitCo</span>
            <p>Create a customer feedback form for my new fitness app</p>
            <button type="button" onClick={onStart} aria-label="Run prompt">
              <Play size={13} fill="currentColor" />
            </button>
          </div>
          <div className={`${styles.promptChip} ${styles.chipOne}`}>AI</div>
          <div className={`${styles.promptChip} ${styles.chipTwo}`}>⚡</div>
        </div>
        <div className={styles.marketingFeatureList}>
          {[
            [
              "High Response Rate",
              "Create personal experiences that feel less like a form and more like a conversation.",
            ],
            [
              "Deeper Insights",
              "Get richer answers with smarter questions, in less time.",
            ],
            [
              "Advanced Analytics",
              "Turn responses into clear next steps for your team.",
            ],
          ].map(([title, text]) => (
            <article key={title}>
              <Check size={15} />
              <div>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 4. Trust Section */}
      <section className={styles.marketingTrust}>
        <p>Join 150,000+ businesses driving revenue with Typeform</p>
        <div>
          <b>Calendly</b>
          <b>V</b>
          <b>DOCUSIGN</b>
          <b>Webflow</b>
          <b>slack</b>
        </div>
      </section>

      {/* 5. Customer Stories */}
      <section className={styles.marketingCases}>
        <div className={styles.caseCopy}>
          <p className={styles.marketingEyebrow}>CUSTOMER STORIES</p>
          <h2>
            Power every kind
            <br />
            of conversation.
          </h2>
          <button
            type="button"
            className={styles.marketingDarkButton}
            onClick={onStart}
          >
            Read customer stories <ArrowRight size={16} />
          </button>
        </div>
        <article>
          <span>SMARTBUG.</span>
          <strong>
            SmartBug Media increased sales leads by 40% with one form
          </strong>
        </article>
        <article>
          <span>DOUBLE DOWN</span>
          <strong>
            Double Down generated $3.67 million in pipeline
          </strong>
        </article>
      </section>

      {/* 6. Integrations */}
      <section className={styles.marketingIntegrations}>
        <p className={styles.marketingEyebrow}>WORKS WITH YOUR FAVORITE TOOLS</p>
        <h2>Integrate with your tech stack</h2>
        <div>
          {[
            "klaviyo",
            "slack",
            "stripe",
            "Webflow",
            "zapier",
            "intercom",
            "CallRail",
            "Calendly",
          ].map((name) => (
            <span key={name}>{name}</span>
          ))}
        </div>
      </section>

      {/* 7. Footer */}
      <footer className={styles.marketingFooter}>
        <div className={styles.marketingLogo}>
          <span className={styles.marketingLogoMark}>
            <i />
            <i />
            <i />
          </span>
          <span>Typeform</span>
        </div>
        <div>
          <strong>PRODUCT</strong>
          <a onClick={onStart}>Pricing</a>
          <a onClick={onStart}>Enterprise</a>
        </div>
        <div>
          <strong>TEMPLATES</strong>
          <a onClick={onStart}>Popular templates</a>
          <a onClick={onStart}>Recent templates</a>
          <a onClick={onStart}>Product templates</a>
        </div>
        <div>
          <strong>INTEGRATIONS</strong>
          <a onClick={onStart}>Popular integrations</a>
          <a onClick={onStart}>Marketing &amp; sales apps</a>
          <a onClick={onStart}>Product apps</a>
        </div>
        <div>
          <strong>RESOURCES</strong>
          <a onClick={onStart}>Blog</a>
          <a onClick={onStart}>Guides</a>
          <a onClick={onStart}>Help center</a>
        </div>
        <div>
          <strong>GET TO KNOW US</strong>
          <a onClick={onStart}>About us</a>
          <a onClick={onStart}>Careers</a>
          <a onClick={onStart}>Contact sales</a>
        </div>
      </footer>
    </main>
  );
};
