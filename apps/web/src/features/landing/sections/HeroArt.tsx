export default function HeroArt() {
  return (
    <div className="hero-art" data-template-id="hero-card">
      <div className="hero-art__content">
        <header className="hero-art__eyebrow-row">
          <div className="hero-art__eyebrow">
            <span className="hero-art__eyebrow-line" aria-hidden="true" />
            <span>The Tradelomacy route</span>
          </div>
          <div className="hero-art__status">
            <span className="hero-art__status-dot" aria-hidden="true" />
            <span>Verified route</span>
          </div>
        </header>

        <div className="hero-art__stage">
          <section className="hero-art__endpoint" aria-label="European F&B brand">
            <p className="hero-art__kicker">Origin</p>
            <h2 className="hero-art__title">European F&amp;B brand</h2>
            <div className="hero-art__rule" aria-hidden="true" />
          </section>

          <figure
            className="hero-art__route"
            role="img"
            aria-label="A route connecting a European F&B brand to a verified distributor through Tradelomacy."
          >
            <svg viewBox="0 0 590 350" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M66 185C120 185 142 116 207 116C277 116 281 239 359 239C427 239 452 165 521 165" stroke="#B8CEE6" strokeWidth="2" />
              <path d="M66 185C120 185 142 116 207 116C277 116 281 239 359 239C427 239 452 165 521 165" stroke="#0B3D91" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 9" opacity=".55" />
              <circle cx="66" cy="185" r="7" fill="#FCFDFC" stroke="#F07A32" strokeWidth="2" />
              <circle cx="521" cy="165" r="7" fill="#FCFDFC" stroke="#197B78" strokeWidth="2" />
              <path d="M161 54V78M149 66H173" stroke="#F07A32" strokeWidth="1.5" strokeLinecap="round" opacity=".7" />
              <path d="M468 76V98M457 87H479" stroke="#197B78" strokeWidth="1.5" strokeLinecap="round" opacity=".45" />
              <circle cx="443" cy="64" r="4" stroke="#0B3D91" strokeWidth="1.5" opacity=".32" />
              <circle cx="128" cy="278" r="3" fill="#F07A32" opacity=".42" />

              <g transform="translate(86 126)">
                <path d="M0 18L23 5L48 18L25 31L0 18Z" fill="#FFFFFF" stroke="#0B3D91" strokeWidth="1.7" />
                <path d="M0 18V45L25 58V31L0 18Z" fill="#EAF2FB" stroke="#0B3D91" strokeWidth="1.7" />
                <path d="M25 31L48 18V45L25 58V31Z" fill="#FFFFFF" stroke="#0B3D91" strokeWidth="1.7" />
                <path d="M14 11L37 24" stroke="#F07A32" strokeWidth="2" />
              </g>

              <g transform="translate(246 104)">
                <path d="M36 0C16.1 0 0 15.5 0 34.7C0 59.5 36 84 36 84C36 84 72 59.5 72 34.7C72 15.5 55.9 0 36 0Z" fill="#FFFFFF" stroke="#0B3D91" strokeWidth="2" />
                <circle cx="36" cy="34" r="10" fill="#EAF2FB" stroke="#F07A32" strokeWidth="2" />
                <path d="M28 34H44M36 26V42" stroke="#F07A32" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M36 94V112" stroke="#0B3D91" strokeWidth="1.5" strokeLinecap="round" opacity=".35" />
                <path d="M26 112H46" stroke="#0B3D91" strokeWidth="1.5" strokeLinecap="round" opacity=".35" />
              </g>

              <g transform="translate(436 111)">
                <path d="M0 18H64L57 4H7L0 18Z" fill="#FFFFFF" stroke="#197B78" strokeWidth="1.7" />
                <path d="M5 18H59V62H5V18Z" fill="#FFFFFF" stroke="#197B78" strokeWidth="1.7" />
                <path d="M14 18V32M26 18V32M38 18V32M50 18V32" stroke="#F07A32" strokeWidth="1.6" />
                <path d="M18 62V42H33V62" fill="#EAF2FB" stroke="#197B78" strokeWidth="1.5" />
                <path d="M41 42H51V52H41V42Z" stroke="#197B78" strokeWidth="1.4" />
              </g>

              <g transform="translate(50 34)" opacity=".65">
                <circle cx="16" cy="16" r="8" stroke="#F07A32" strokeWidth="1.5" />
                <path d="M16 0V-6M16 38V32M0 16H-6M38 16H32M4.7 4.7L.5.5M31.3 31.3L35.5 35.5M27.3 4.7L31.5.5M4.7 27.3L.5 31.5" stroke="#F07A32" strokeWidth="1.5" strokeLinecap="round" />
              </g>

              <path d="M335 287V304M327 295H343" stroke="#0B3D91" strokeWidth="1.5" strokeLinecap="round" opacity=".25" />
              <path d="M391 53V68M383.5 60.5H398.5" stroke="#F07A32" strokeWidth="1.5" strokeLinecap="round" opacity=".5" />
            </svg>
          </figure>

          <section className="hero-art__endpoint hero-art__endpoint--distributor" aria-label="Verified distributor">
            <p className="hero-art__kicker">Destination</p>
            <h2 className="hero-art__title">Verified distributor</h2>
            <div className="hero-art__rule" aria-hidden="true" />
          </section>
        </div>

        <footer className="hero-art__strip" aria-label="Tradelomacy process">
          <div className="hero-art__step">
            <span className="hero-art__step-index">01</span>
            <p className="hero-art__step-name">Assess</p>
            <span className="hero-art__step-mark" aria-hidden="true" />
          </div>
          <div className="hero-art__step">
            <span className="hero-art__step-index">02</span>
            <p className="hero-art__step-name">Match</p>
            <span className="hero-art__step-mark" aria-hidden="true" />
          </div>
          <div className="hero-art__step">
            <span className="hero-art__step-index">03</span>
            <p className="hero-art__step-name">Close</p>
            <span className="hero-art__step-mark" aria-hidden="true" />
          </div>
        </footer>
      </div>
    </div>
  );
}
