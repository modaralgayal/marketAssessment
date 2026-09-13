import { Button } from "../ui";
import { useExportLead } from "../StartExportingModal";
import HeroArt from "./HeroArt";

export default function Hero() {
  const { open } = useExportLead();
  return (
    <header className="relative overflow-hidden bg-gradient-to-b from-brand-teal/5 via-white to-white px-8 pb-20 pt-24">
      <div
        aria-hidden="true"
        className="theme-glow pointer-events-none absolute inset-x-0 top-0 h-64"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-teal/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1240px]">
        <div className="mx-auto max-w-[760px] text-center">
          <div className="mb-4 text-xs font-extrabold uppercase tracking-[1.5px] text-brand-teal">
            GCC Distributor Intelligence
          </div>
          <h1 className="text-[40px] font-bold leading-[1.08] text-brand-ink sm:text-[52px] lg:text-[60px]">
            Market Entry Platform
          </h1>
          <p className="mx-auto mt-5 max-w-[620px] text-[18px] leading-relaxed text-brand-muted">
            Take your brand to the GCC markets.
          </p>
          <p className="mx-auto mt-3 max-w-[620px] text-[18px] leading-relaxed text-brand-muted">
            Your F&amp;B product is export-ready — Tradelomacy provides the channel. We identify the
            right distributor &amp; retailer and match you with them.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3.5">
            <Button variant="primary" onClick={open}>
              Start Exporting
            </Button>
            <Button to="/contact" variant="outline">
              Talk to Sales
            </Button>
          </div>
        </div>

        <div className="mt-16">
          <HeroArt />
        </div>
      </div>
    </header>
  );
}
