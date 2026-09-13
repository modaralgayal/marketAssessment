export type FormMode = "assessment" | "onboarding";

export function CoverHeader({ mode = "assessment" }: { mode?: FormMode }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#0F7B7F]/5 via-white to-white px-8 pb-12 pt-12">
      <div className="mb-9 flex items-center gap-2.5">
        <div className="h-2.5 w-2.5 rounded-full bg-brand-teal" />
        <div className="text-xs font-bold uppercase tracking-[3px] text-brand-teal">
          [Platform Name]
        </div>
      </div>
      <h1 className="mb-3.5 text-[28px] font-bold leading-tight text-brand-ink">
        {mode === "onboarding"
          ? "Client Onboarding — Company Profile"
          : "GCC Market Expansion Opportunity Assessment"}
      </h1>
      <p className="max-w-[500px] text-sm font-light italic text-brand-muted">
        {mode === "onboarding"
          ? "Tell us about your company and products so we can set up your profile in our system."
          : "Tell us about your company and product — we'll tell you if the GCC market is right for you."}
      </p>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-teal" />
    </div>
  );
}

export function SuccessScreen({ mode = "assessment" }: { mode?: FormMode }) {
  return (
    <div className="mx-auto my-16 max-w-[640px] rounded-lg border border-brand-line bg-white p-12 text-center shadow-sm">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-teal text-3xl font-bold text-white">
        ✓
      </div>
      <h1 className="mb-3 text-2xl font-bold text-brand-ink">
        {mode === "onboarding" ? "Your profile has been created" : "Thank you — submission received"}
      </h1>
      <p className="text-sm leading-relaxed text-brand-muted">
        {mode === "onboarding"
          ? "Thank you — your company profile is now saved in our system. Our team will be in touch shortly to confirm the next steps."
          : "Our team will review your company, product, and catalogue, and respond with a scored, honest assessment within 5 business days. We've recorded your contact details and will be in touch by email."}
      </p>
    </div>
  );
}
