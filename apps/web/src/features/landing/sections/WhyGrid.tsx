import { SectionHead } from "../ui";

const CARDS = [
  {
    h: "MATCHED",
    p: "Screening every distributor against a brand's category, channel, pricing tier, and positioning requirements. Ranks the qualifying candidates using a fit score calibrated by verified relationship data.",
  },
  {
    h: "In-Country Experts",
    p: "On-the-ground specialists embedded in the target market, giving direct access to local regulatory know-how, cultural fluency, and distributor relationships.",
  },
  {
    h: "AI Powered",
    p: "Combines real-world trade intelligence gathered by our in-country experts with AI-driven analysis, turning verified market insight into accurate, data-backed distributor assessments and matches.",
  },
  {
    h: "Category specialists",
    p: "Deep focus on food, beverage, and cosmetics — not a generalist trade directory.",
  },
  {
    h: "Dedicated account lead",
    p: "One point of contact from first call through ongoing account management.",
  },
  {
    h: "Fast activation",
    p: "A qualified shortlist within weeks of kickoff, not months.",
  },
];

export default function WhyGrid() {
  return (
    <section className="bg-white px-8 py-[72px]">
      <div className="mx-auto max-w-[1160px]">
        <SectionHead
          eyebrow="Why Tradelomacy"
          title="Why exporters choose us over a distributor list"
        />
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c) => (
            <div key={c.h} className="rounded-2xl border border-brand-line bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <h4 className="text-base font-bold text-brand-ink">{c.h}</h4>
              <p className="mt-2 text-sm text-brand-muted">{c.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
