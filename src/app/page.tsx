export default function HomePage() {
  return (
    <div className="site-shell" id="top">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="topbar">
        <a aria-label="Forge home" className="brand" href="#top">
          <span aria-hidden="true" className="brand-mark">
            <svg fill="none" viewBox="0 0 24 24">
              <path
                d="M5 18.5V5.5h14M5 11.9h9.2"
                stroke="currentColor"
                strokeLinecap="square"
                strokeWidth="2.4"
              />
              <path d="M15.5 15.5h4" stroke="currentColor" strokeWidth="2.4" />
            </svg>
          </span>
          Forge
        </a>
        <nav aria-label="Main navigation" className="nav-links">
          <a href="#principles">Why Forge</a>
          <a href="#approach">Approach</a>
          <a className="nav-cta" href="#direction">
            The direction <span aria-hidden="true">↘</span>
          </a>
        </nav>
      </header>

      <main id="main-content">
        <section aria-labelledby="hero-title" className="hero">
          <div className="hero-copy">
            <div className="hero-kicker eyebrow">KSU · Computer science + engineering</div>
            <h1 id="hero-title">
              Good work
              <br />
              takes the
              <br />
              <span>right mix.</span>
            </h1>
            <p className="hero-description">
              Forge is a collaboration platform in the making for KSU computing
              students who want to find project teammates with skills that
              complement their own.
            </p>
            <div className="hero-actions">
              <a className="button-primary" href="#approach">
                How we see it working <span aria-hidden="true">↘</span>
              </a>
              <a className="text-link" href="#principles">
                Why build Forge <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

          <div aria-label="A concept diagram connecting complementary skills around a shared project" className="hero-visual" role="img">
            <div className="orbit-field">
              <span aria-hidden="true" className="orbit-crosshair" />
              <span aria-hidden="true" className="orbit-crosshair horizontal" />
              <span aria-hidden="true" className="orbit-node node-one" />
              <span aria-hidden="true" className="orbit-node node-two" />
              <span aria-hidden="true" className="orbit-node node-three" />
              <span aria-hidden="true" className="orbit-node node-four" />
              <div aria-hidden="true" className="orbit-core">
                <div className="core-glyph">
                  <svg fill="none" viewBox="0 0 32 32">
                    <path
                      d="M8 24V8h16M8 16h11"
                      stroke="currentColor"
                      strokeLinecap="square"
                      strokeWidth="2.2"
                    />
                    <path d="M20 20h5" stroke="currentColor" strokeWidth="2.2" />
                  </svg>
                </div>
              </div>
              <span className="diagram-label label-top">Build</span>
              <span className="diagram-label label-right">Design</span>
              <span className="diagram-label label-bottom">Research</span>
              <span className="diagram-label label-left">Systems</span>
              <div className="visual-caption">
                <span>01 / Shared project</span>
                <span>Concept, not live data</span>
              </div>
            </div>
          </div>
          <span className="hero-index">A better starting point for team projects / 001</span>
        </section>

        <div aria-label="Product principle" className="signal-strip">
          <p>
            <strong>Less guesswork.</strong> More evidence of how you build.
          </p>
          <div className="strip-mark">
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
              <path
                d="M4 12h16M12 4v16M6.3 6.3l11.4 11.4m0-11.4L6.3 17.7"
                stroke="currentColor"
                strokeWidth="1.3"
              />
            </svg>
            Made for making
          </div>
        </div>

        <section aria-labelledby="principles-title" className="content-section" id="principles">
          <div className="section-heading">
            <div className="section-index">01 — The problem</div>
            <h2 id="principles-title">
              Your next teammate should bring a <em>different toolset.</em>
            </h2>
          </div>
          <div className="principles">
            <article className="principle">
              <span className="principle-number">01 / Start with the work</span>
              <h3>Projects over profiles</h3>
              <p>
                A good team starts with what you want to make—and the skills it
                will take to make it.
              </p>
            </article>
            <article className="principle">
              <span className="principle-number">02 / Show your practice</span>
              <h3>Evidence, not adjectives</h3>
              <p>
                Give people a clearer picture of what you have built, explored,
                or want to learn next.
              </p>
            </article>
            <article className="principle">
              <span className="principle-number">03 / Find the complement</span>
              <h3>Different strengths</h3>
              <p>
                Make room for the teammate who brings a perspective or capability
                your project is missing.
              </p>
            </article>
          </div>
        </section>

        <section aria-labelledby="approach-title" className="method-section" id="approach">
          <div className="method-inner">
            <div className="method-header">
              <div>
                <div className="eyebrow">02 — The product direction</div>
                <h2 id="approach-title">A team is a set of useful differences.</h2>
              </div>
              <p>
                We are shaping Forge around a more thoughtful way to move from
                individual interests to a well-balanced project team.
              </p>
            </div>
            <div className="steps">
              <article className="step">
                <div className="step-top">
                  <span className="step-number">01 / Contribute</span>
                  <span aria-hidden="true" className="step-symbol">
                    <svg fill="none" viewBox="0 0 24 24">
                      <path d="M5 5h14v14H5zM9 9h6M9 12h6M9 15h3" stroke="currentColor" strokeWidth="1.4" />
                    </svg>
                  </span>
                </div>
                <h3>Describe what you bring</h3>
                <p>
                  Share your interests, project experience, and the kinds of
                  problems you enjoy tackling.
                </p>
              </article>
              <article className="step">
                <div className="step-top">
                  <span className="step-number">02 / Make visible</span>
                  <span aria-hidden="true" className="step-symbol">
                    <svg fill="none" viewBox="0 0 24 24">
                      <path d="M4 17.5 9 12l3 2.5L19.5 6M15 6h4.5v4.5" stroke="currentColor" strokeWidth="1.4" />
                    </svg>
                  </span>
                </div>
                <h3>Ground skills in work</h3>
                <p>
                  Forge is intended to help connect skills to demonstrated
                  project work—not just a list of claims.
                </p>
              </article>
              <article className="step">
                <div className="step-top">
                  <span className="step-number">03 / Build together</span>
                  <span aria-hidden="true" className="step-symbol">
                    <svg fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.4" />
                      <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="1.1" />
                    </svg>
                  </span>
                </div>
                <h3>Look for the missing piece</h3>
                <p>
                  Explore potential collaborators whose strengths could round
                  out the work you want to do.
                </p>
              </article>
            </div>
            <div className="future-note">
              <strong>Current milestone:</strong>
              <span>
                This page introduces the product direction. Sign-in, skill
                verification, repository analysis, and teammate matching are not
                available here yet.
              </span>
            </div>
          </div>
        </section>

        <section aria-labelledby="direction-title" className="content-section manifesto" id="direction">
          <div className="section-index">03 — The belief</div>
          <div className="manifesto-copy">
            <blockquote id="direction-title">
              The best project teams aren&apos;t built from <span>matching résumés.</span>
              They&apos;re built from strengths that meet in the middle.
            </blockquote>
            <p>
              Forge is being designed for the people behind KSU&apos;s next
              ambitious build: curious computer science and engineering
              students ready to make something with others. The point is not
              another feed. It is a better way to find your people for the work.
            </p>
          </div>
        </section>

        <section aria-labelledby="closing-title" className="closing">
          <div className="closing-inner">
            <div className="section-index">A note from Forge</div>
            <div className="closing-copy">
              <h2 id="closing-title">Make room for what you don&apos;t know yet.</h2>
              <p>
                Forge is an early product direction for KSU&apos;s builders. The
                foundation comes first: a more credible, considered way to form
                teams around real skills and real work.
              </p>
              <a className="button-primary" href="#top">
                Back to the beginning <span aria-hidden="true">↑</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#top">
          <span aria-hidden="true" className="brand-mark">
            <svg fill="none" viewBox="0 0 24 24">
              <path
                d="M5 18.5V5.5h14M5 11.9h9.2"
                stroke="currentColor"
                strokeLinecap="square"
                strokeWidth="2.4"
              />
              <path d="M15.5 15.5h4" stroke="currentColor" strokeWidth="2.4" />
            </svg>
          </span>
          Forge
        </a>
        <div className="footer-meta">KSU · For the work ahead · Milestone 01</div>
      </footer>
    </div>
  );
}
