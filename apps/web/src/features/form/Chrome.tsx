export function CoverHeader() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#0F7B7F]/5 via-white to-white px-8 pb-12 pt-12">
      <div className="mb-9 flex items-center gap-2.5">
        <div className="h-2.5 w-2.5 rounded-full bg-brand-teal" />
        <div className="text-xs font-bold uppercase tracking-[3px] text-brand-teal">
          [Platform Name]
        </div>
      </div>
      <h1 className="mb-3.5 text-[28px] font-bold leading-tight text-brand-ink">
        GCC Market Expansion Opportunity Assessment
      </h1>
      <p className="max-w-[500px] text-sm font-light italic text-brand-muted">
        Tell us about your company and product — we'll tell you if the GCC market is right for you.
      </p>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-teal" />
    </div>
  );
}

export function PromiseRow() {
  const items = [
    { n: 1, t: "You fill this in", d: "Takes 10–15 minutes. No commitment required." },
    { n: 2, t: "We assess your GCC potential", d: "We evaluate your product, market fit, and viability." },
    { n: 3, t: "You receive a free evaluation", d: "Within 5 business days — scored, honest, actionable." },
  ];
  return (
    <div className="flex flex-col gap-6 border-b border-brand-line bg-brand-bg-alt px-8 py-5 sm:flex-row">
      {items.map((i) => (
        <div key={i.n} className="flex flex-1 items-start gap-2.5">
          <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-teal text-xs font-bold text-white">
            {i.n}
          </div>
          <div className="text-xs leading-snug text-brand-muted">
            <strong className="mb-0.5 block text-[12.5px] text-brand-ink">{i.t}</strong>
            {i.d}
          </div>
        </div>
      ))}
    </div>
  );
}

export function IntroBox() {
  return (
    <div className="border-l-4 border-brand-teal bg-[#0F7B7F]/5 px-8 py-6">
      <p className="text-[13px] leading-relaxed text-brand-ink">
        [Platform Name] runs market entry projects for European food and beverage companies entering
        Saudi Arabia and the UAE. Our scope covers the full commercial cycle — market assessment,
        regulatory preparation, partner search, distributor outreach, negotiation, and contract
        execution. We stay engaged after the first deal is signed, managing the commercial
        relationship and driving growth on the ground.
      </p>
    </div>
  );
}

export function SuccessScreen() {
  return (
    <div className="mx-auto my-16 max-w-[640px] rounded-lg border border-brand-line bg-white p-12 text-center shadow-sm">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-teal text-3xl font-bold text-white">
        ✓
      </div>
      <h1 className="mb-3 text-2xl font-bold text-brand-ink">Thank you — submission received</h1>
      <p className="text-sm leading-relaxed text-brand-muted">
        Our team will review your company, product, and catalogue, and respond with a scored, honest
        assessment within <strong>5 business days</strong>. We've recorded your contact details and will be
        in touch by email.
      </p>
    </div>
  );
}
