import { createElement, useEffect, useRef, type ReactNode } from "react";
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
        ↗
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

/**
 * Solution-section showcase. The prototype used a looping "matching" video; we
 * now ship that real clip (Tradelomacy-at-scale-1440p.mp4 in /public) and play
 * it here. It autoplays muted + looped, and is paused when the visitor prefers
 * reduced motion.
 */
function ProcessAnimation() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      if (mq.matches) video.pause();
      else video.play().catch(() => {});
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <div
      className="process-animation"
      role="img"
      aria-label="Tradelomacy matches buyer requirements with verified suppliers at scale."
    >
      <video
        ref={ref}
        className="pa-video"
        src="/Tradelomacy-at-scale-1440p.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
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
                Explore export opportunities <span aria-hidden="true">↗</span>
              </span>
            </TLink>
            <TLink href="#/for-sourcing" className="trade-option">
              <span className="option-number">02 / SOURCE</span>
              <h2>For sourcing</h2>
              <p>Find suppliers around your product and commercial requirements.</p>
              <span className="option-link">
                Tell us what you need <span aria-hidden="true">↗</span>
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
              <span className="article-link">Read article ↗</span>
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
