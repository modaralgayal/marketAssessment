import { SectionHead } from "../ui";

const CARDS = [
  {
    h: "MATCHED",
    p: "Screening every distributor against a brand's category, channel, pricing tier, and positioning requirements. Ranks the qualifying candidates using a fit score calibrated by verified relationship data.",
  },
  {
    h: "In-Country Experts",
    p: "On-the-ground specialists embedded in the target market, giving direct access to local regulatory know-how, culture, and distributor relationships.",
  },
  {
    h: "Domain expertise",
    p: "Deep understanding of the F&B industry, pricing structures, deal structures, and product-market fit",
  },
  {
    h: "AI-Powered",
    p: "Our matching reasoning is supported by structured native data that enhances matching accuracy.",
  },
  {
    h: "Fast activation",
    p: "A qualified shortlist of potential partners within weeks of kickoff, not months.",
  },
];

export default function WhyGrid() {
  return (
    <section className="bg-white px-8 py-24">
      <div className="mx-auto max-w-[1160px]">
        <SectionHead
          eyebrow="Why Tradelomacy"
          title="Intelligence, in-market relationships, deep understanding of market dynamics, not a contact database."
        />
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c) => (
            <div key={c.h} className="rounded-3xl border border-brand-line bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <h4 className="text-base font-bold text-brand-ink">{c.h}</h4>
              <p className="mt-2 text-sm text-brand-muted">{c.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
