import { SectionHead } from "../ui";

const STEPS = [
  {
    n: "01",
    t: "Opportunity Assessment",
    d: "The assessment maps FMCG brands' category, certification, and positioning to determine export viability. Responses are evaluated against our proprietary Company Assessment Framework (CAF), a scoring system built on real distributor relationships and in-market experience.",
  },
  {
    n: "02",
    t: "MATCHED: Verified Distributor & Retailers",
    d: "Distributors & retailers in our database are classified according to our 3-Tier system, providing visibility into numerous detailed variables. Matching FMCG brands and distributors based on data and in-market relationships.",
  },
  {
    n: "03",
    t: "Outreach and Deal Execution",
    d: "An outreach campaign targeting the most qualified partners. An in-market expert is selected to perform 3 key functions: 1. Channel Strategy 2. Economics Waterfall: Price Value Chain Model 3. Partner Selection",
  },
];

export default function PlatformFeatures() {
  return (
    <section className="bg-white px-6 sm:px-8 py-20 sm:py-24">
      <div className="mx-auto max-w-[1160px]">
        <SectionHead
          eyebrow="How does Tradelomacy work?"
          title="A verified path from assessment to market"
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="flex gap-5 rounded-xl border border-brand-line bg-white p-6 shadow-sm transition hover:border-brand-teal/40 hover:shadow-md"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-teal/10 text-[15px] font-extrabold text-brand-teal-dark">
                {s.n}
              </div>
              <div>
                <h3 className="text-[18px] font-bold text-brand-ink">{s.t}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-brand-muted">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
