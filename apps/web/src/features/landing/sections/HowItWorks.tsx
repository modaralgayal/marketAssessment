import { SectionHead } from "../ui";

const STEPS = [
  {
    h: "Fit Assessment",
    p: "We assess product, category, and readiness against live GCC demand.",
  },
  {
    h: "Shortlist",
    p: "We surface verified matches weighted toward confirmed fit, not volume.",
  },
  {
    h: "Negotiation",
    p: "We run terms, exclusivity, and pricing conversations through to signature.",
  },
  {
    h: "Account Management",
    p: "We stay engaged post-signature so early friction doesn't unwind the deal.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-white px-8 py-[72px]">
      <div className="mx-auto max-w-[1160px]">
        <SectionHead eyebrow="How It Works" title="From kickoff to signed contract" />
        <ol className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.h} className="relative pt-2">
              <div className="mb-3.5 flex h-9 w-9 items-center justify-center rounded-full bg-brand-teal text-sm font-extrabold text-white">
                {i + 1}
              </div>
              <h4 className="text-[15.5px] font-bold text-brand-ink">{s.h}</h4>
              <p className="mt-1.5 text-[13.5px] text-brand-muted">{s.p}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
