export default function MatchCard() {
  return (
    <article className="match-card" data-template-id="match-card">
      <div className="match-card__content">
        <header className="match-card__header">
          <div>
            <div className="match-card__overline">The Tradelomacy route</div>
            <h1 className="match-card__title">Live market match</h1>
          </div>
          <div className="match-card__status-set" aria-label="Match status">
            <span className="match-card__live">
              <span className="match-card__live-dot" aria-hidden="true" />
              <span>Live match</span>
            </span>
            <span className="match-card__verified">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M8.5 12.2l2.3 2.3 4.7-5.2" />
              </svg>
              <span>Verified</span>
            </span>
          </div>
        </header>

        <section className="match-card__layout" aria-label="European to GCC match relationship">
          <section className="match-card__entity match-card__entity--origin" aria-labelledby="origin-name">
            <div>
              <p className="match-card__entity-label">Origin</p>
              <h2 id="origin-name" className="match-card__entity-name">European F&amp;B brand</h2>
            </div>
            <div className="match-card__entity-footer">
              <span className="match-card__rule" aria-hidden="true" />
              <div className="match-card__chips" aria-label="Origin categories">
                <span className="match-card__chip">European</span>
                <span className="match-card__chip">F&amp;B</span>
              </div>
            </div>
          </section>

          <div className="match-card__transfer" aria-label="Transfer relationship">
            <div className="match-card__control" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="m16 3 4 4-4 4" />
                <path d="M20 7H4" />
                <path d="m8 21-4-4 4-4" />
                <path d="M4 17h16" />
              </svg>
            </div>
            <span className="match-card__transfer-label">EU → GCC</span>
          </div>

          <section className="match-card__entity match-card__entity--destination" aria-labelledby="destination-name">
            <div>
              <p className="match-card__entity-label">Destination</p>
              <h2 id="destination-name" className="match-card__entity-name">Verified GCC distributor</h2>
            </div>
            <div className="match-card__entity-footer">
              <span className="match-card__rule" aria-hidden="true" />
              <div className="match-card__chips" aria-label="Destination categories">
                <span className="match-card__chip">GCC</span>
                <span className="match-card__chip match-card__chip--accent">Verified</span>
              </div>
            </div>
          </section>
        </section>

        <section className="match-card__fit" aria-label="Match fit score">
          <div className="match-card__fit-copy">
            <span className="match-card__fit-label">Match fit</span>
            <div
              className="match-card__fit-track"
              role="progressbar"
              aria-label="Match fit score"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={92}
            >
              <div className="match-card__fit-progress" />
            </div>
          </div>
          <div className="match-card__fit-score" aria-label="92 percent match fit">
            <b>92</b>
            <span>%</span>
          </div>
        </section>
      </div>
    </article>
  );
}
