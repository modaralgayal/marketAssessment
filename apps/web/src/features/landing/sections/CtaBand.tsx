import { Link } from "react-router-dom";
import { useExportLead } from "../StartExportingModal";

export default function CtaBand() {
  const { open } = useExportLead();
  return (
    <section className="bg-white px-6 sm:px-8 py-20 sm:py-24">
      <div className="mx-auto max-w-[1160px] overflow-hidden rounded-xl bg-gradient-to-br from-brand-teal to-brand-teal-dark px-8 py-14 text-center shadow-sm sm:py-16">
        <div className="mx-auto max-w-[680px]">
          <h2 className="text-[30px] font-bold leading-tight text-white sm:text-[38px]">
            Ready to find your GCC distributor?
          </h2>
          <p className="mx-auto mt-4 max-w-[560px] text-[16px] leading-relaxed text-white/85">
            Start with a free, no-commitment assessment. We map your category, certifications, and
            positioning to the right verified partners — usually within a few weeks.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3.5">
            <button
              type="button"
              onClick={open}
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-brand-teal-dark shadow-sm transition hover:bg-white/90"
            >
              Start Exporting
            </button>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-full border border-white/70 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
