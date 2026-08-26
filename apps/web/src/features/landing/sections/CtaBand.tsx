import { Button } from "../ui";

export default function CtaBand() {
  return (
    <section id="contact" className="scroll-mt-24 relative overflow-hidden bg-brand-bg-alt px-8 py-[72px]">
      <div
        aria-hidden="true"
        className="theme-glow pointer-events-none absolute inset-x-0 top-0 h-48"
      />
      <div className="relative mx-auto max-w-[1160px]">
        <div className="rounded-2xl bg-brand-ink px-8 py-14 text-center">
          <h2 className="text-[28px] font-bold text-white">
            See what a verified match looks like
          </h2>
          <p className="mx-auto mt-3 max-w-[520px] text-[#C7CEDA]">
            Tell us about your product and category. We'll tell you honestly whether the GCC
            market is ready for it.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3.5">
            <Button to="/assessment" variant="primary">
              Request a Demo
            </Button>
            <a
              href="mailto:jaber.algayal24@gmail.com"
              className="inline-flex items-center rounded-full border border-white/30 px-6 py-3 text-sm font-bold text-white transition hover:border-white"
            >
              or email jaber.algayal24@gmail.com
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
