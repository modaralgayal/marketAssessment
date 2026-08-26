const STEPS = [
  { t: "Assess", s: "CAF score", d: "We assess product, category, and readiness against live GCC demand." },
  { t: "Match", s: "Fit score", d: "We surface verified matches weighted toward confirmed fit, not volume." },
  { t: "Execute", s: "Signed contract", d: "We run terms, exclusivity, and pricing conversations through to signature." },
  { t: "Manage", s: "Account health", d: "We stay engaged post-signature so early friction doesn't unwind the deal." },
];

export default function ProcessDiagram() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      {STEPS.map((step, i) => (
        <div
          key={step.t}
          className="relative rounded-2xl border border-brand-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand-teal text-sm font-extrabold text-white">
            {i + 1}
          </div>
          <h4 className="text-[15px] font-bold text-brand-ink">{step.t}</h4>
          <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-orange">
            {step.s}
          </div>
          <p className="mt-2 text-[13px] leading-snug text-brand-muted">{step.d}</p>

          {i < STEPS.length - 1 && (
            <svg
              viewBox="0 0 24 24"
              className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-brand-muted md:block"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}
