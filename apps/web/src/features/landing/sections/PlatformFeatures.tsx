import type { ReactNode } from "react";
import { SectionHead } from "../ui";
import MatchCard from "./MatchCard";

/* ── Lightweight mock "product screenshots" ──────────────────────────────
   These stand in for the real dashboard screenshots called for in the
   design. Swap each <MockX/> for an <img> once real captures exist. */

function DealPipelineMock() {
  const stages = [
    { name: "Outreach", deals: ["Rosten Oy", "Finnish Bakery"] },
    { name: "Negotiation", deals: ["Nordic Dairy"] },
    { name: "Signed", deals: ["BioFoods AB"] },
  ];
  return (
    <div className="rounded-2xl border border-brand-line bg-brand-bg-alt p-4 shadow-sm">
      <span className="mb-3 block text-[12px] font-bold uppercase tracking-wide text-brand-muted">
        Deal Pipeline
      </span>
      <div className="grid grid-cols-3 gap-2">
        {stages.map((s) => (
          <div key={s.name} className="rounded-lg bg-white p-2">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-brand-teal-dark">
              {s.name}
            </div>
            <div className="space-y-1.5">
              {s.deals.map((d) => (
                <div
                  key={d}
                  className="rounded-md border border-brand-line px-2 py-1.5 text-[11px] font-medium text-brand-ink"
                >
                  {d}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountHealthMock() {
  const tiles = [
    { k: "Active distributors", v: "12" },
    { k: "Avg. confidence", v: "86%" },
    { k: "Renewals YTD", v: "9" },
    { k: "Open tickets", v: "2" },
  ];
  return (
    <div className="rounded-2xl border border-brand-line bg-brand-bg-alt p-4 shadow-sm">
      <span className="mb-3 block text-[12px] font-bold uppercase tracking-wide text-brand-muted">
        Account Health
      </span>
      <div className="grid grid-cols-2 gap-2">
        {tiles.map((t) => (
          <div key={t.k} className="rounded-lg border border-brand-line bg-white p-3">
            <div className="text-xl font-extrabold text-brand-teal">{t.v}</div>
            <div className="text-[11px] text-brand-muted">{t.k}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureRow({
  title,
  body,
  media,
  reverse = false,
}: {
  title: string;
  body: string;
  media: ReactNode;
  reverse?: boolean;
}) {
  return (
    <div className="mb-14 grid grid-cols-1 items-center gap-12 last:mb-0 md:grid-cols-2">
      <div className={reverse ? "md:order-2" : ""}>
        <h3 className="text-[22px] font-bold text-brand-ink">{title}</h3>
        <p className="mt-3 text-[15px] text-brand-muted">{body}</p>
        <a
          href="/assessment"
          className="mt-3 inline-flex rounded-full border border-brand-line px-4 py-2.5 text-[13px] font-bold text-brand-ink transition hover:border-brand-teal hover:text-brand-teal"
        >
          Learn more →
        </a>
      </div>
      <div className={reverse ? "md:order-1" : ""}>{media}</div>
    </div>
  );
}

export default function PlatformFeatures() {
  return (
    <section id="platform" className="scroll-mt-24 bg-white px-8 py-[72px]">
      <div className="mx-auto max-w-[1160px]">
        <SectionHead
          eyebrow="How does Tradelomacy work?"
          title="Opportunity Assessment"
          sub="The assessment evaluates FMCG brands across five criteria to determine whether the company and its products are viable in the GCC market. Responses are evaluated against our proprietary Company Assessment Framework (CAF), a scoring system built on real distributor relationships and in-market experience."
        />
        <FeatureRow
          title="MATCHED: Verified Distributor & Retailers"
          body="Distributors in our database are classified according to our 3-Tier system, providing visibility into numerous detailed variables. Matching FMCG brands and distributors based on data and in-market relationships."
          media={<MatchCard />}
        />
        <FeatureRow
          reverse
          title="Deal Execution"
          body="An in-market expert is selected to perform 3 key functions: 1. Channel Strategy 2. Economics Waterfall: Price Value Chain Model 3. Partner Selection"
          media={<DealPipelineMock />}
        />
        <FeatureRow
          title="Country Management"
          body="Growing market share and brand positioning through: 1. Channel performance 2. Channel development 3. Operational flow management"
          media={<AccountHealthMock />}
        />
      </div>
    </section>
  );
}
