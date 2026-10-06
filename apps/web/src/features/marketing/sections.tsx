import { createElement, useEffect, useState, type ReactNode } from "react";
import "./processAnimation.css";
import type { Project, Section } from "./content";
import { text, TLink, accentParts } from "./content";
import { TradeForm } from "./forms/TradeForm";
import { ReportForm } from "./forms/ReportForm";

/* ---- text / link / icon / logo helpers (port of the engine's tx/button/icon/mark) ---- */

export function Text({ project, path, tag = "span", cls = "" }: { project: Project; path: string; tag?: string; cls?: string }) {
  const value = text(project, path);
  const content: ReactNode = tag === "h1" || tag === "h2" ? accentParts(value) : value;
  return createElement(tag, { className: cls }, content);
}

export function Button({
  project,
  path,
  href = "#/start-trading",
  cls = "",
}: {
  project: Project;
  path: string;
  href?: string;
  cls?: string;
}) {
  return (
    <TLink href={href} className={`button ${cls}`}>
      <Text project={project} path={path} />
      <span className="arrow" aria-hidden="true">
        ↗︎
      </span>
    </TLink>
  );
}

const ICON_PATHS = [
  "M7 30V13l14-7v17L7 30ZM27 42V25l14-7v17l-14 7Z",
  "M17 16a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm16 6a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM5 40c0-10 24-10 24 0m-1-8c9-4 15 1 15 8",
  "M7 38V11l17-5 17 5v27l-17 5-17-5Zm17-32v37M7 11l17 6 17-6",
  "M10 14h28v22H10zM17 8v6m14-6v6M17 36v6m14-6v6M4 21h6m28 0h6M4 30h6m28 0h6M17 22h14M17 28h8",
  "M8 35 35 8M14 8h21v21M8 15v25h25",
];

export function Icon({ n }: { n: number }) {
  return (
    <svg className="feature-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d={ICON_PATHS[n % 5]} />
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * Solution-section showcase — a looping CSS/JS replica of the old
 * "Tradelomacy-at-scale" motion-graphics video (no video file). It cycles
 * through 8 buyer↔manufacturer pairings, drawing connection curves with a
 * travelling dot and flipping requirement rows, lands two matches (which turn
 * green and stay), holds the final state, then loops. Honours
 * prefers-reduced-motion by showing the final frame only.
 * ------------------------------------------------------------------ */

const PA_ROWS = [
  "Product specifications",
  "Market readiness",
  "Order quantity",
  "Payment terms",
  "Delivery timing",
];

// Pairing order; for the six rejected ones, which rows conflict (false = red).
const PA_PAIRS: { m: number; b: number; rows: boolean[] }[] = [
  { m: 1, b: 1, rows: [false, true, true, false, true] },
  { m: 1, b: 2, rows: [true, false, false, true, false] },
  { m: 2, b: 2, rows: [false, true, true, true, false] },
  { m: 2, b: 4, rows: [true, false, false, false, true] },
  { m: 3, b: 4, rows: [true, true, false, true, false] },
  { m: 3, b: 2, rows: [false, false, true, false, true] },
];

type PairStep = { kind: "pair"; n: number; m: number; b: number; rows: boolean[]; outcome: "reject" | "assess" | "match"; dur: number };
type FinalStep = { kind: "final"; dur: number };
type PaStep = PairStep | FinalStep;

// Full ~10s timeline: six rejects, then the two matches (assess → flip → match), then a hold.
const PA_SEQUENCE: PaStep[] = (() => {
  const out: PaStep[] = [];
  PA_PAIRS.forEach((p, i) => {
    out.push({ kind: "pair", n: i + 1, m: p.m, b: p.b, rows: p.rows, outcome: "reject", dur: 850 });
  });
  // Matches start with conflicts on Payment terms + Delivery timing, then flip all green.
  [
    { m: 1, b: 3 },
    { m: 4, b: 2 },
  ].forEach((p, i) => {
    const n = 7 + i;
    out.push({ kind: "pair", n, m: p.m, b: p.b, rows: [true, true, true, false, false], outcome: "assess", dur: 850 });
    out.push({ kind: "pair", n, m: p.m, b: p.b, rows: [true, true, true, true, true], outcome: "match", dur: 950 });
  });
  out.push({ kind: "final", dur: 3200 });
  return out;
})();

const PA_MATCHES = [
  { m: 1, b: 3 },
  { m: 4, b: 2 },
];

// Connector geometry, in the 160×90 SVG space that maps 1:1 onto the 16:9 stage.
const PA_Y = [24, 40, 56, 72]; // card vertical centres (top→bottom)
const PA_CENTER_Y = 45; // vertical centre of the opportunity card
const PA_CENTER_LX = 62; // left edge of the opportunity card
const PA_CENTER_RX = 98; // right edge
const PA_M_RX = 36; // manufacturer card right edge (left 7.5% + width 15% of 160)
const PA_B_LX = 124; // buyer card left edge (right 7.5% + width 15% of 160)

function cardTopPct(idx: number): number {
  return (PA_Y[idx - 1] / 90) * 100;
}

// Curved link from a manufacturer card, into the left edge of the opportunity card.
function paLeftPath(m: number): string {
  const ym = PA_Y[m - 1];
  const bend = Math.max(3, (PA_CENTER_LX - PA_M_RX) * 0.42);
  return `M${PA_M_RX} ${ym} C ${PA_M_RX + bend} ${ym}, ${PA_CENTER_LX - bend} ${PA_CENTER_Y}, ${PA_CENTER_LX} ${PA_CENTER_Y}`;
}
// Curved link out of the right edge of the opportunity card to a buyer card.
function paRightPath(b: number): string {
  const yb = PA_Y[b - 1];
  const bend = Math.max(3, (PA_B_LX - PA_CENTER_RX) * 0.42);
  return `M${PA_CENTER_RX} ${PA_CENTER_Y} C ${PA_CENTER_RX + bend} ${PA_CENTER_Y}, ${PA_B_LX - bend} ${yb}, ${PA_B_LX} ${yb}`;
}
// Big green arc joining a matched pair, drawn in the final hold.
function paFinalPath(m: number, b: number): string {
  const ym = PA_Y[m - 1];
  const yb = PA_Y[b - 1];
  return `M${PA_M_RX} ${ym} C 75 ${ym - 3}, 85 ${yb + 3}, ${PA_B_LX} ${yb}`;
}
function paFinalDot(m: number, b: number): { cx: number; cy: number } {
  return { cx: 80, cy: (PA_Y[m - 1] + PA_Y[b - 1]) / 2 };
}

type CardState = "idle" | "active" | "matched" | "dim";

function PaCard({ side, idx, state }: { side: "m" | "b"; idx: number; state: CardState }) {
  const name = side === "m" ? `Manufacturer 0${idx}` : `Buyer 0${idx}`;
  const cap =
    state === "matched" ? "Match found" : state === "active" ? "Assessing" : "Potential partner";
  return (
    <article
      className={`pa2-party-card ${side} ${state === "idle" ? "" : `is-${state}`}`}
      style={{ top: `${cardTopPct(idx)}%` }}
    >
      <svg
        className="pa2-party-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {side === "m" ? (
          <path d="M3 21V9l6-4 6 4v12M3 21h18M9 21v-5h6v5M7 12h2M15 12h2" />
        ) : (
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 21a7 7 0 0 1 14 0" />
        )}
      </svg>
      <div className="pa2-party-copy">
        <span className="pa2-party-name">{name}</span>
        <span className="pa2-caption">{cap}</span>
      </div>
    </article>
  );
}

function ProcessAnimation() {
  const [step, setStep] = useState(0);
  const [matched, setMatched] = useState<{ m: number; b: number }[]>([]);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setReduce(true);
      setStep(PA_SEQUENCE.length - 1);
      setMatched(PA_MATCHES);
      return;
    }
    let idx = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const cur = PA_SEQUENCE[idx];
      if (cur.kind === "pair" && cur.outcome === "match") {
        setMatched((prev) =>
          prev.some((x) => x.m === cur.m && x.b === cur.b) ? prev : [...prev, { m: cur.m, b: cur.b }],
        );
      }
      idx += 1;
      if (idx >= PA_SEQUENCE.length) {
        idx = 0;
        setMatched([]);
      }
      setStep(idx);
      timer = setTimeout(tick, PA_SEQUENCE[idx].dur);
    };
    timer = setTimeout(tick, PA_SEQUENCE[0].dur);
    return () => clearTimeout(timer);
  }, []);

  const cur = PA_SEQUENCE[step];
  const isFinal = cur.kind === "final";
  const pair = cur.kind === "pair" ? cur : null;

  const stateFor = (side: "m" | "b", idx: number): CardState => {
    if (matched.some((x) => (side === "m" ? x.m : x.b) === idx)) return "matched";
    if (isFinal) return "dim";
    if (pair && (side === "m" ? pair.m : pair.b) === idx) {
      return pair.outcome === "match" ? "matched" : "active";
    }
    return "idle";
  };

  return (
    <div
      className="process-animation pa2"
      role="img"
      aria-label="Tradelomacy assesses eight buyer–manufacturer pairings against shared requirements and surfaces two compatible matches, at scale."
    >
      <svg className="pa2-network" viewBox="0 0 2560 1440" preserveAspectRatio="none" aria-hidden="true">
        <path d="M-80 352 C300 70 650 595 976 342 S1506 125 1850 370 S2290 528 2660 166" />
        <path d="M-100 1090 C286 822 602 1297 940 1066 S1490 798 1802 1020 S2260 1220 2680 898" />
        <path d="M160 118 C418 328 656 188 810 38 M1708 38 C1832 248 2018 240 2194 76" />
        <path d="M34 727 C310 505 560 725 768 867 M1780 720 C2050 486 2302 644 2525 820" />
        <circle cx="474" cy="267" r="5" />
        <circle cx="898" cy="400" r="5" />
        <circle cx="1687" cy="234" r="5" />
        <circle cx="2100" cy="489" r="5" />
        <circle cx="584" cy="1190" r="5" />
        <circle cx="1908" cy="1044" r="5" />
      </svg>

      <div className="pa2-hero">
        <h1>One opportunity. Two sides aligned, at scale.</h1>
        <p>Multiple partners. One shared qualification process.</p>
      </div>

      <div className="pa2-col-label pa2-left-label">MANUFACTURERS</div>
      <div className="pa2-col-label pa2-right-label">BUYERS</div>

      {[1, 2, 3, 4].map((i) => (
        <PaCard key={`m${i}`} side="m" idx={i} state={stateFor("m", i)} />
      ))}
      {[1, 2, 3, 4].map((i) => (
        <PaCard key={`b${i}`} side="b" idx={i} state={stateFor("b", i)} />
      ))}

      <div className={`pa2-center${isFinal ? " is-summary" : ""}`}>
        <div className="pa2-opportunity">
          <div className="pa2-eyebrow">OPPORTUNITY</div>
          <h2>Potential partnership</h2>
          <div className="pa2-pair-label">
            {pair ? `Manufacturer 0${pair.m} + Buyer 0${pair.b}` : ""}
          </div>
          <div className="pa2-requirements-label">NON-NEGOTIABLE REQUIREMENTS</div>
          <div className="pa2-requirements">
            {PA_ROWS.map((label, r) => {
              const aligned = pair ? pair.rows[r] : false;
              return (
                <div key={label} className={`pa2-requirement ${aligned ? "aligned" : "conflict"}`}>
                  <span className="pa2-requirement-name">{label}</span>
                  <span className={`pa2-state ${aligned ? "aligned" : "conflict"}`}>
                    {aligned ? "✓ Aligned" : "✕ Conflict"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="pa2-summary">
          <div className="pa2-summary-eyebrow">COMPATIBLE PARTNERSHIPS</div>
          <h2>Two partnership matches</h2>
          <div className="pa2-match-tile">
            <strong>MATCH 01: Manufacturer 01 + Buyer 03</strong>
            <span>All critical requirements aligned</span>
          </div>
          <div className="pa2-match-tile">
            <strong>MATCH 02: Manufacturer 04 + Buyer 02</strong>
            <span>All critical requirements aligned</span>
          </div>
          <p className="pa2-summary-note">8 pairings assessed across both sides</p>
        </div>
      </div>

      <svg className="pa2-connections" viewBox="0 0 160 90" preserveAspectRatio="none" aria-hidden="true">
        {!isFinal && pair && (
          <g key={`pair-${step}`}>
            <path
              id={`pa2-left-${step}`}
              className={`pa2-path${pair.outcome === "match" ? " green" : ""}`}
              pathLength={1}
              d={paLeftPath(pair.m)}
            />
            <path
              id={`pa2-right-${step}`}
              className={`pa2-path${pair.outcome === "match" ? " green" : ""}`}
              pathLength={1}
              d={paRightPath(pair.b)}
            />
            {!reduce && (
              <>
                <circle className={`pa2-dot${pair.outcome === "match" ? " green" : ""}`} r={1.7}>
                  <animateMotion dur={`${Math.min(pair.dur, 1000)}ms`} begin="0.1s" repeatCount="indefinite">
                    <mpath xlinkHref={`#pa2-left-${step}`} />
                  </animateMotion>
                </circle>
                <circle className={`pa2-dot${pair.outcome === "match" ? " green" : ""}`} r={1.7}>
                  <animateMotion dur={`${Math.min(pair.dur, 1000)}ms`} begin="0.1s" repeatCount="indefinite">
                    <mpath xlinkHref={`#pa2-right-${step}`} />
                  </animateMotion>
                </circle>
              </>
            )}
          </g>
        )}
        {isFinal &&
          PA_MATCHES.map((mm) => {
            const dot = paFinalDot(mm.m, mm.b);
            return (
              <g key={`final-${mm.m}-${mm.b}`}>
                <path className="pa2-final-path visible" d={paFinalPath(mm.m, mm.b)} />
                <circle className="pa2-final-dot visible" cx={dot.cx} cy={dot.cy} r={1.5} />
              </g>
            );
          })}
      </svg>

      <div className={`pa2-pill${isFinal ? " complete" : ""}`}>
        {isFinal ? "✓ 2 MATCHES FOUND" : pair ? `ASSESSING PAIRING 0${pair.n} / 08` : ""}
      </div>

      <footer>
        <p className="pa2-footer">Find the right partners on both sides of every opportunity.</p>
        <p className="pa2-micro">ILLUSTRATIVE PLATFORM CONCEPT</p>
      </footer>
    </div>
  );
}

/* ---- section wrapper (port of renderSection's outer <section>) ---- */

function sectionClass(route: string, s: Section): string {
  let cls = s.type;
  if (route === "home" && s.id === "steps") cls += " challenge-cards";
  if (route === "home-copy" && s.type === "hero") cls += " manufacturer-hero";
  if (route === "for-governments-and-associations" && s.type === "features") cls += " government-features";
  if (s.type === "vision") cls += " vision-photo";
  const inner =
    ["contact", "request", "access", "legal"].includes(s.type)
      ? "inner-page "
      : !["hero"].includes(s.type)
        ? "section "
        : "";
  return `${inner}${cls}${s.type === "hero" && s.image ? " hero-background" : ""}`;
}

function sectionStyle(project: Project, s: Section): React.CSSProperties | undefined {
  if (s.type === "vision") return { backgroundImage: `url('${project.assets.visionPhoto}')` };
  if (s.type === "hero" && s.image) return { backgroundImage: `url('${project.assets[s.image]}')` };
  return undefined;
}

export function SectionView({ project, route, i, section: s }: { project: Project; route: string; i: number; section: Section }) {
  if (s.visible === false) return null;
  const p = `pages.${route}.sections.${i}`;
  const head = (
    <>
      <Text project={project} path={`${p}.eyebrow`} tag="p" cls="eyebrow" />
      <Text project={project} path={`${p}.title`} tag="h2" cls="section-title preline" />
    </>
  );
  let html: ReactNode = null;

  switch (s.type) {
    case "article":
      html = <ArticleBody project={project} p={p} s={s} />;
      break;
    case "trading":
      html = (
        <div className="wrap trading-choice">
          <p className="eyebrow">START TRADING</p>
          <Text project={project} path={`${p}.title`} tag="h1" />
          <Text project={project} path={`${p}.body`} tag="p" cls="section-intro" />
          <div className="trade-options">
            <TLink href="#/for-exporting" className="trade-option">
              <span className="option-number">01 / EXPORT</span>
              <h2>For exporting</h2>
              <p>Find relevant buyers and distribution partners for your products.</p>
              <span className="option-link">
                Explore export opportunities <span aria-hidden="true">↗︎</span>
              </span>
            </TLink>
            <TLink href="#/for-sourcing" className="trade-option">
              <span className="option-number">02 / SOURCE</span>
              <h2>For sourcing</h2>
              <p>Find suppliers around your product and commercial requirements.</p>
              <span className="option-link">
                Tell us what you need <span aria-hidden="true">↗︎</span>
              </span>
            </TLink>
          </div>
        </div>
      );
      break;
    case "tradeform":
      return <TradeForm project={project} section={s} />;
    case "insights":
      html = <InsightsPage project={project} />;
      break;
    case "content":
      if (s.layout === "matching") {
        html = (
          <div className="wrap matching-wrap">
            <div className="matching-heading">
              {head}
              <Text project={project} path={`${p}.body`} tag="p" cls="matching-copy" />
            </div>
            <ProcessAnimation />
          </div>
        );
      } else {
        html = (
          <div className="wrap article-content">
            <Text project={project} path={`${p}.eyebrow`} tag="p" cls="eyebrow" />
            <Text project={project} path={`${p}.title`} tag={i === 0 ? "h1" : "h2"} cls="section-title preline" />
            <Text project={project} path={`${p}.body`} tag="p" cls="section-intro preline" />
          </div>
        );
      }
      break;
    case "hero":
      html = (
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <Text project={project} path={`${p}.eyebrow`} tag="p" cls="eyebrow" />
            <Text project={project} path={`${p}.title`} tag="h1" cls="preline" />
            <Text project={project} path={`${p}.body`} tag="p" />
            <div className="actions">
              <Button project={project} path={`${p}.primaryLabel`} />
              <Button project={project} path={`${p}.secondaryLabel`} href="#/contact" cls="secondary" />
            </div>
          </div>
          {s.image || route === "home-copy" ? null : (
            <div className="hero-graphic">
              <div className="diagram-top">
                <span>01 / ORIGIN</span>
                <Text project={project} path={`${p}.diagramTop`} />
              </div>
              <div className="graphic-mark">
                <img src={project.assets.icon} alt="" aria-hidden="true" />
              </div>
              <div className="fit-label">
                <Text project={project} path={`${p}.diagramMiddle`} />
              </div>
              <Text project={project} path={`${p}.diagramTags`} tag="p" cls="diagram-tags" />
              <div className="diagram-bottom">
                <span>02 / OPPORTUNITY</span>
                <Text project={project} path={`${p}.diagramBottom`} />
              </div>
            </div>
          )}
        </div>
      );
      break;
    case "stats":
      html = (
        <div className="wrap proof-grid">
          <Text project={project} path={`${p}.title`} tag="p" cls="proof-label" />
          {(s.items ?? []).map((_it, j) => (
            <div className="stat" key={j}>
              <Text project={project} path={`${p}.items.${j}.value`} tag="strong" />
              <Text project={project} path={`${p}.items.${j}.label`} />
            </div>
          ))}
        </div>
      );
      break;
    case "vision":
      html = (
        <div className="wrap vision-grid">
          <Text project={project} path={`${p}.eyebrow`} tag="p" cls="eyebrow" />
          <div>
            <Text project={project} path={`${p}.title`} tag="h2" />
            <Text project={project} path={`${p}.body`} tag="p" />
          </div>
        </div>
      );
      break;
    case "steps":
      html = (
        <div className="wrap">
          {head}
          <div className="step-list">
            {(s.items ?? []).map((_it, j) => (
              <article className="step" key={j}>
                <span className="step-number">{String(j + 1).padStart(2, "0")}</span>
                <Text project={project} path={`${p}.items.${j}.title`} tag="h3" />
                <Text project={project} path={`${p}.items.${j}.body`} tag="p" />
              </article>
            ))}
          </div>
        </div>
      );
      break;
    case "features":
      html = (
        <div className="wrap">
          {head}
          <Text project={project} path={`${p}.body`} tag="p" cls="section-intro" />
          <div className="feature-grid">
            {(s.items ?? []).map((_it, j) => (
              <article className="feature" key={j}>
                <Icon n={j} />
                <Text project={project} path={`${p}.items.${j}.title`} tag="h3" />
                <Text project={project} path={`${p}.items.${j}.body`} tag="p" />
              </article>
            ))}
          </div>
        </div>
      );
      break;
    case "journey":
      html = (
        <div className="wrap">
          {head}
          <div className="journey-grid">
            {(s.items ?? []).map((_it, j) => (
              <article className="journey-item" key={j}>
                <Text project={project} path={`${p}.items.${j}.label`} tag="span" cls="journey-label" />
                <Text project={project} path={`${p}.items.${j}.title`} tag="h3" />
                <Text project={project} path={`${p}.items.${j}.body`} tag="p" />
              </article>
            ))}
          </div>
        </div>
      );
      break;
    case "solutions":
      html = (
        <div className="wrap">
          {head}
          <Text project={project} path={`${p}.body`} tag="p" cls="section-intro" />
          <div className="solution-grid">
            {(s.items ?? []).map((it, j) => (
              <article className="solution" key={j}>
                <Text project={project} path={`${p}.items.${j}.eyebrow`} tag="p" cls="eyebrow" />
                <Text project={project} path={`${p}.items.${j}.title`} tag="h3" />
                <Text project={project} path={`${p}.items.${j}.body`} tag="p" />
                <Button project={project} path={`${p}.items.${j}.cta`} href={(it as Record<string, unknown>).href as string} />
              </article>
            ))}
          </div>
        </div>
      );
      break;
    case "faq":
      html = (
        <div className="wrap faq-grid">
          <div>{head}</div>
          <div className="faq-list">
            {(s.items ?? []).map((_it, j) => (
              <details className="faq-item" key={j} open={j === 0}>
                <summary>
                  <Text project={project} path={`${p}.items.${j}.question`} />
                </summary>
                <Text project={project} path={`${p}.items.${j}.answer`} tag="p" />
              </details>
            ))}
          </div>
        </div>
      );
      break;
    case "cta":
      html = (
        <div className="wrap cta-inner">
          <Text project={project} path={`${p}.title`} tag="h2" cls="preline" />
          <div>
            <Text project={project} path={`${p}.body`} tag="p" />
            <div className="actions">
              <Button
                project={project}
                path={`${p}.primaryLabel`}
                href={route === "for-governments-and-associations" ? "#organization" : "#/start-trading"}
                cls="light"
              />
              {route === "for-governments-and-associations"
                ? null
                : (
                    <Button project={project} path={`${p}.secondaryLabel`} href="#/contact" cls="outline-light" />
                  )}
            </div>
          </div>
        </div>
      );
      break;
    case "contact":
      html = (
        <div className="wrap inner-grid">
          <div>
            <Text project={project} path={`${p}.eyebrow`} tag="p" cls="eyebrow" />
            <Text project={project} path={`${p}.title`} tag="h1" />
            <Text project={project} path={`${p}.body`} tag="p" />
            <div className="contact-details">
              <div className="contact-line">
                <small>Email</small>
                {s.email && String(s.email).includes("@") && !String(s.email).includes("[") ? (
                  <a href={`mailto:${String(s.email)}`}>
                    <Text project={project} path={`${p}.email`} />
                  </a>
                ) : (
                  <Text project={project} path={`${p}.email`} />
                )}
              </div>
              <div className="contact-line">
                <small>Phone</small>
                <Text project={project} path={`${p}.phone`} />
              </div>
            </div>
          </div>
        </div>
      );
      break;
    case "request":
      html = (
        <div className="wrap inner-grid">
          <div>
            <Text project={project} path={`${p}.eyebrow`} tag="p" cls="eyebrow" />
            <Text project={project} path={`${p}.title`} tag="h1" />
            <Text project={project} path={`${p}.body`} tag="p" />
          </div>
          <ReportForm section={s} />
        </div>
      );
      break;
    case "access":
      html = (
        <div className="wrap">
          <div className="access">
            <Text project={project} path={`${p}.eyebrow`} tag="p" cls="eyebrow" />
            <Text project={project} path={`${p}.title`} tag="h1" />
            <Text project={project} path={`${p}.body`} tag="p" />
            <div className="actions">
              <Button project={project} path={`${p}.cta`} href={s.href} />
              <TLink href="#/home" className="button secondary">
                Back to home
              </TLink>
            </div>
          </div>
        </div>
      );
      break;
    case "legal":
      html = (
        <div className="wrap legal">
          <Text project={project} path={`${p}.eyebrow`} tag="p" cls="eyebrow" />
          <Text project={project} path={`${p}.title`} tag="h1" />
          <p>Effective date / last updated: <Text project={project} path={`${p}.effectiveDate`} /></p>
          <Text project={project} path={`${p}.intro`} tag="p" cls="legal-intro" />
          {(s.items ?? []).map((it, j) => (
            <article className="legal-section" id={String((it as Record<string, unknown>).id ?? "")} key={j}>
              <Text project={project} path={`${p}.items.${j}.title`} tag="h2" />
              <Text project={project} path={`${p}.items.${j}.body`} tag="p" />
            </article>
          ))}
        </div>
      );
      break;
    default:
      html = <div className="empty-section">Unknown section type: {s.type}</div>;
  }

  return (
    <section
      id={s.id}
      data-section={p}
      className={sectionClass(route, s)}
      style={sectionStyle(project, s)}
    >
      {html}
    </section>
  );
}

/* ---- article + insights ---- */

function ArticleBody({ project, p, s }: { project: Project; p: string; s: Section }) {
  const body = String(s.body ?? "");
  const parts = body.split(/\n\s*\n/).map((part) =>
    part.startsWith("## ")
      ? createElement("h2", { key: part }, part.slice(3))
      : createElement("p", { key: part, dangerouslySetInnerHTML: { __html: part.replace(/\n/g, "<br>") } }),
  );
  return (
    <article className="wrap article-reading">
      <TLink href="#/insights" className="back-link">
        ← All insights
      </TLink>
      <Text project={project} path={`${p}.category`} tag="p" cls="eyebrow" />
      <Text project={project} path={`${p}.title`} tag="h1" />
      <p className="article-meta">
        <Text project={project} path={`${p}.date`} /> · <Text project={project} path={`${p}.author`} />
        {s.status === "draft" ? " · Draft" : ""}
      </p>
      <Text project={project} path={`${p}.summary`} tag="p" cls="article-summary" />
      <div className="article-body">{parts}</div>
    </article>
  );
}

function InsightsPage({ project }: { project: Project }) {
  const articles = Object.entries(project.pages)
    .filter(([, v]) => v.sections[0]?.type === "article" && v.sections[0].status === "published")
    .sort((a, b) => String(b[1].sections[0].date).localeCompare(String(a[1].sections[0].date)));
  return (
    <div className="wrap insights-page">
      <p className="eyebrow">INSIGHTS</p>
      <Text project={project} path="pages.insights.title" tag="h1" />
      <Text project={project} path="pages.insights.body" tag="p" cls="section-intro" />
      <div className="article-grid">
        {articles.map(([k, v]) => {
          const a = v.sections[0];
          return (
            <TLink key={k} href={`#/${k}`} className="article-card">
              <span className="eyebrow">{a.category}</span>
              <h2>{a.title}</h2>
              <p>{a.summary}</p>
              <div className="article-meta">
                {a.date} · {a.author}
              </div>
              <span className="article-link">Read article ↗︎</span>
            </TLink>
          );
        })}
      </div>
      {articles.length === 0 && (
        <div className="insight-empty">
          <h2>Insights are on their way.</h2>
          <p>Articles and updates will appear here as they are published.</p>
        </div>
      )}
    </div>
  );
}
