import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./auth.module.css";

type AuthFrameProps = {
  children: ReactNode;
  description: string;
  footer: ReactNode;
  kicker: string;
  title: string;
};

export function AuthFrame({
  children,
  description,
  footer,
  kicker,
  title,
}: AuthFrameProps) {
  return (
    <div className={styles.page}>
      <a className="skip-link" href="#auth-main">
        Skip to form
      </a>
      <header className={styles.masthead}>
        <Link aria-label="Forge home" className={styles.wordmark} href="/">
          <span aria-hidden="true" className={styles.brandMark}>
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
        </Link>
        <Link className={styles.homeLink} href="/">
          Back to Forge <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <main className={styles.frame} id="auth-main">
        <section aria-labelledby="auth-title" className={styles.formPanel}>
          <div className={styles.formHeading}>
            <div className={styles.kicker}>
              <span aria-hidden="true" className={styles.kickerRule} />
              {kicker}
            </div>
            <h1 id="auth-title">{title}</h1>
            <p>{description}</p>
          </div>
          {children}
          <div className={styles.formFooter}>{footer}</div>
        </section>

        <aside aria-label="Forge's approach to building teams" className={styles.signalPanel}>
          <div className={styles.signalTopline}>
            <span>Forge / KSU</span>
            <span>Field note 01</span>
          </div>
          <div className={styles.signalArtwork} aria-hidden="true">
            <span className={`${styles.axis} ${styles.axisVertical}`} />
            <span className={`${styles.axis} ${styles.axisHorizontal}`} />
            <span className={`${styles.orbit} ${styles.orbitOuter}`} />
            <span className={`${styles.orbit} ${styles.orbitInner}`} />
            <span className={`${styles.signalNode} ${styles.nodeNorth}`} />
            <span className={`${styles.signalNode} ${styles.nodeEast}`} />
            <span className={`${styles.signalNode} ${styles.nodeSouth}`} />
            <span className={`${styles.signalNode} ${styles.nodeWest}`} />
            <span className={styles.signalCore}>
              <svg fill="none" viewBox="0 0 32 32">
                <path
                  d="M8 24V8h16M8 16h11"
                  stroke="currentColor"
                  strokeLinecap="square"
                  strokeWidth="2.2"
                />
                <path d="M20 20h5" stroke="currentColor" strokeWidth="2.2" />
              </svg>
            </span>
            <span className={`${styles.diagramLabel} ${styles.labelNorth}`}>Build</span>
            <span className={`${styles.diagramLabel} ${styles.labelEast}`}>Design</span>
            <span className={`${styles.diagramLabel} ${styles.labelSouth}`}>Research</span>
            <span className={`${styles.diagramLabel} ${styles.labelWest}`}>Systems</span>
          </div>
          <div className={styles.signalCopy}>
            <div className={styles.signalIndex}>A better way to find your people</div>
            <p>
              Start with the work. Bring together the strengths it takes to make
              it real.
            </p>
          </div>
          <div className={styles.signalFooter}>
            <span>Computer science + engineering</span>
            <span>Owl-built / Kennesaw State</span>
          </div>
        </aside>
      </main>

      <footer className={styles.pageFooter}>
        <span>Made for the work ahead.</span>
        <span>Forge · Kennesaw State University</span>
      </footer>
    </div>
  );
}
