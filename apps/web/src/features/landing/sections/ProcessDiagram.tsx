const STEPS = [
  { t: "Assess", s: "CAF score", d: "We assess product, category, and readiness against live GCC demand." },
  { t: "Match", s: "Fit score", d: "We surface verified matches weighted toward confirmed fit, not volume." },
  { t: "Execute", s: "Signed contract", d: "We run terms, exclusivity, and pricing conversations through to signature." },
  { t: "Manage", s: "Account health", d: "We stay engaged post-signature so early friction doesn't unwind the deal." },
];

/** Small per-stage icon for the right-hand depiction. */
function StepIcon({ index }: { index: number }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-5 w-5",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (index) {
    case 0:
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      );
    case 1:
      return (
        <svg {...common}>
          <path d="M9 12h6" />
          <path d="M10 8H8a4 4 0 000 8h2" />
          <path d="M14 8h2a4 4 0 010 8h-2" />
        </svg>
      );
    case 2:
      return (
        <svg {...common}>
          <path d="M7 3h7l4 4v14H7z" />
          <path d="M14 3v4h4" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M3 12h4l2-6 4 12 2-6h6" />
        </svg>
      );
  }
}

function DownArrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 text-brand-teal"
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

export default function ProcessDiagram() {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
      {/* Left — text steps (no numbers), connected by downward arrows */}
      <div className="flex flex-col">
        {STEPS.map((step, i) => (
          <div key={step.t}>
            <div className="rounded-2xl border border-brand-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <h4 className="text-[17px] font-bold text-brand-ink">{step.t}</h4>
              <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-orange">
                {step.s}
              </div>
              <p className="mt-2 text-[13.5px] leading-snug text-brand-muted">{step.d}</p>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex justify-center py-2.5">
                <DownArrow />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Right — visual depiction of the flow */}
      <div className="h-fit lg:sticky lg:top-24">
        <div className="rounded-2xl border border-brand-line bg-brand-bg-alt p-7">
          <div className="mb-6 text-xs font-bold uppercase tracking-[1px] text-brand-muted">
            The journey at a glance
          </div>
          <div className="flex flex-col">
            {STEPS.map((step, i) => (
              <div key={step.t}>
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-teal text-white">
                    <StepIcon index={i} />
                  </div>
                  <div>
                    <div className="text-[14.5px] font-bold text-brand-ink">{step.t}</div>
                    <div className="text-[10.5px] font-semibold uppercase tracking-wide text-brand-orange">
                      {step.s}
                    </div>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="py-2 pl-[22px]">
                    <DownArrow />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
