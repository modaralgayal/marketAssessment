import { SectionHead } from "../ui";

const CARDS = [
  {
    h: "Confidence-scored data",
    p: "Every match is tagged by how it was verified, not assumed from a public listing.",
  },
  {
    h: "Full-cycle execution",
    p: "We don't stop at an introduction. We stay through negotiation and signature.",
  },
  {
    h: "Aligned pricing",
    p: "Retainer plus commission, stepping down over time — we're paid on results.",
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
          eyebrow="Why Integrate Us"
          title="Why exporters choose us over a distributor list"
        />
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c) => (
            <div key={c.h} className="rounded-lg border border-brand-line bg-white p-6">
              <h4 className="text-base font-bold text-brand-ink">{c.h}</h4>
              <p className="mt-2 text-sm text-brand-muted">{c.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
