import { SectionHead } from "../ui";

const FAQS = [
  {
    q: "What does Integrate Us do?",
    a: "We match European food, beverage, and cosmetics brands to verified GCC distributors, then run outreach, negotiation, and contracting through to a signed deal.",
  },
  {
    q: "How is a distributor match verified?",
    a: "Every distributor record is scored by how it was sourced — public listing, direct contact, or confirmed insider relationship — and we only present client-facing matches backed by real verification.",
  },
  {
    q: "What markets do you cover?",
    a: "Primarily Saudi Arabia and the UAE, with reach across the broader GCC.",
  },
  {
    q: "How is pricing structured?",
    a: "Retainer plus commission for most direct-supplier engagements, stepping down over time. Commission-only is available for high-demand categories. Trade body programs are billed on a project basis.",
  },
  {
    q: "How long does it take to get a shortlist?",
    a: "Most engagements produce a qualified shortlist within a few weeks of kickoff, depending on category and current network coverage.",
  },
  {
    q: "Do you work with trade organizations as well as individual manufacturers?",
    a: "Yes. We run both direct-supplier engagements and cohort programs for trade promotion organizations supporting groups of exporters.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 bg-white px-8 py-24">
      <div className="mx-auto max-w-[1160px]">
        <SectionHead eyebrow="FAQ" title="Frequently asked questions" />
        <div>
          {FAQS.map((f) => (
            <div key={f.q} className="border-b border-brand-line py-5">
              <h4 className="text-[15.5px] font-bold text-brand-ink">{f.q}</h4>
              <p className="mt-1.5 text-[14.5px] text-brand-muted">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
