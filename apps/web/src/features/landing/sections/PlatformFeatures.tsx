import type { ReactNode } from "react";
import MatchCard from "./MatchCard";

/* ── Platform features module (blueprint design system) ──────────────────
   Adopted from the Tradelomacy Platform Features reference: an intro
   header, a full-width flagship match showcase, then alternating
   feature-section rows (copy + product mock) joined by section-connectors.
   Styles live in index.css under the scoped .bp class. */

function SectionConnector() {
  return (
    <div className="section-connector" aria-hidden="true">
      <span />
    </div>
  );
}

function FeatureRow({
  index,
  kicker,
  title,
  body,
  mock,
  reverse,
}: {
  index: string;
  kicker: string;
  title: string;
  body: string;
  mock: ReactNode;
  reverse?: boolean;
}) {
  return (
    <div className={`feature-section${reverse ? " reverse" : ""}`}>
      <div className="feature-copy">
        <p className="feature-kicker">
          <span>{index}</span>
          {kicker}
        </p>
        <h2 className="feature-title">{title}</h2>
        <p className="feature-description">{body}</p>
        <div className="feature-rule" />
      </div>
      <div>{mock}</div>
    </div>
  );
}

function DealPipelineMock() {
  const qualified = [
    { n: "Nordic Foods", d: "Distributor shortlist" },
    { n: "Boreal Beverage", d: "Market fit confirmed" },
  ];
  const review = [
    { n: "Harbor & Co.", d: "Terms under review" },
    { n: "Luma Brands", d: "Commercial alignment" },
  ];
  const signed = [{ n: "Verde Foods", d: "Route activated" }];

  return (
    <div className="product-mock">
      <div className="mock-topline">
        <span className="mock-label">Commercial workspace</span>
        <span className="mock-status">Live view</span>
      </div>
      <div className="mock-heading">
        <strong>Deal pipeline</strong>
        <span>Q3 opportunity flow</span>
      </div>
      <div className="pipeline-columns">
        <div className="pipeline-stage">
          <div className="stage-title">Qualified</div>
          {qualified.map((d) => (
            <div className="deal-row" key={d.n}>
              <strong>{d.n}</strong>
              <span>{d.d}</span>
            </div>
          ))}
        </div>
        <div className="pipeline-stage">
          <div className="stage-title">In review</div>
          {review.map((d) => (
            <div className="deal-row" key={d.n}>
              <strong>{d.n}</strong>
              <span>{d.d}</span>
            </div>
          ))}
        </div>
        <div className="pipeline-stage signed-stage">
          <div className="stage-title">Signed</div>
          {signed.map((d) => (
            <div className="deal-row" key={d.n}>
              <strong>{d.n}</strong>
              <span>{d.d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AccountHealthMock() {
  const metrics = [
    { l: "Engagement", v: "Strong", teal: true },
    { l: "Commercial fit", v: "92%", teal: false },
    { l: "Last activity", v: "2 days ago", teal: false },
    { l: "Relationship trend", v: "Rising", teal: true },
  ];
  return (
    <div className="product-mock">
      <div className="mock-topline">
        <span className="mock-label">Partner overview</span>
        <span className="mock-status">Healthy</span>
      </div>
      <div className="health-layout">
        <div className="health-score">
          <span className="score-label">Account health</span>
          <div className="score-number">86%</div>
          <span className="score-caption">
            A steady signal across commercial and relationship indicators.
          </span>
        </div>
        <div className="health-metrics">
          {metrics.map((m) => (
            <div className="health-metric" key={m.l}>
              <span>{m.l}</span>
              <strong className={m.teal ? "teal" : ""}>{m.v}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PlatformFeatures() {
  return (
    <section id="platform" className="bp scroll-mt-24 px-8 py-24">
      <div className="mx-auto max-w-[1160px]">
        <div className="intro">
          <p className="eyebrow">How does Tradelomacy work?</p>
          <h1 className="intro-title">Opportunity Assessment</h1>
          <p className="intro-copy">
            The assessment evaluates FMCG brands across five criteria to
            determine whether the company and its products are viable in the
            GCC market. Responses are evaluated against our proprietary Company
            Assessment Framework (CAF), a scoring system built on real
            distributor relationships and in-market experience.
          </p>
        </div>

        {/* Flagship live match — full-width showcase */}
        <div>
          <div className="max-w-[820px]">
            <h3 className="text-[22px] font-bold text-brand-ink">
              MATCHED: Verified Distributor &amp; Retailers
            </h3>
            <p className="mt-3 text-[15px] text-brand-muted">
              Distributors in our database are classified according to our 3-Tier
              system, providing visibility into numerous detailed variables.
              Matching FMCG brands and distributors based on data and in-market
              relationships.
            </p>
          </div>
          <div className="mt-10">
            <MatchCard />
          </div>
        </div>

        <SectionConnector />

        <FeatureRow
          index="01"
          reverse
          kicker=""
          title="Deal Execution"
          body="An in-market expert is selected to perform 3 key functions: 1. Channel Strategy 2. Economics Waterfall: Price Value Chain Model 3. Partner Selection"
          mock={<DealPipelineMock />}
        />

        <SectionConnector />

        <FeatureRow
          index="02"
          kicker=""
          title="Country Management"
          body="Growing market share and brand positioning through: 1. Channel performance 2. Channel development 3. Operational flow management"
          mock={<AccountHealthMock />}
        />
      </div>
    </section>
  );
}
