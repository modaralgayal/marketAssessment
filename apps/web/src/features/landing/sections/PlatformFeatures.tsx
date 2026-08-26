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
    <div className="rounded-3xl border border-brand-line bg-brand-bg-alt p-4 shadow-sm">
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
    <div className="rounded-3xl border border-brand-line bg-brand-bg-alt p-4 shadow-sm">
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

function DownArrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 text-brand-teal"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M6 13l6 6 6-6" />
    </svg>
  );
}

const FEATURES = [
  {
    title: "MATCHED: Verified Distributor & Retailers",
    body: "Distributors in our database are classified according to our 3-Tier system, providing visibility into numerous detailed variables. Matching FMCG brands and distributors based on data and in-market relationships.",
    media: <MatchCard />,
  },
  {
    title: "Deal Execution",
    body: "An in-market expert is selected to perform 3 key functions: 1. Channel Strategy 2. Economics Waterfall: Price Value Chain Model 3. Partner Selection",
    media: <DealPipelineMock />,
  },
  {
    title: "Country Management",
    body: "Growing market share and brand positioning through: 1. Channel performance 2. Channel development 3. Operational flow management",
    media: <AccountHealthMock />,
  },
];

export default function PlatformFeatures() {
  return (
    <section id="platform" className="scroll-mt-24 bg-white px-8 py-24">
      <div className="mx-auto max-w-[1160px]">
        <SectionHead
          eyebrow="How does Tradelomacy work?"
          title="Opportunity Assessment"
          sub="The assessment evaluates FMCG brands across five criteria to determine whether the company and its products are viable in the GCC market. Responses are evaluated against our proprietary Company Assessment Framework (CAF), a scoring system built on real distributor relationships and in-market experience."
        />
        <div className="mt-12 flex flex-col">
          {FEATURES.map((f, i) => (
            <div key={f.title}>
              <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
                <div>
                  <h3 className="text-[22px] font-bold text-brand-ink">{f.title}</h3>
                  <p className="mt-3 text-[15px] text-brand-muted">{f.body}</p>
                </div>
                <div>{f.media}</div>
              </div>
              {i < FEATURES.length - 1 && (
                <div className="flex justify-center py-4">
                  <DownArrow />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
