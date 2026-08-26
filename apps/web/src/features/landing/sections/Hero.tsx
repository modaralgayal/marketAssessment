import { Button } from "../ui";
import HeroArt from "./HeroArt";

export default function Hero() {
  return (
    <header className="relative overflow-hidden bg-gradient-to-b from-brand-teal/5 via-white to-white px-8 pb-14 pt-20">
      <div
        aria-hidden="true"
        className="theme-glow pointer-events-none absolute inset-x-0 top-0 h-64"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-teal/10 blur-3xl"
      />
      <div className="relative mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <div>
          <div className="mb-4 text-xs font-extrabold uppercase tracking-[1.5px] text-brand-teal">
            GCC Distributor Intelligence
          </div>
          <h1 className="max-w-[780px] text-[34px] font-bold leading-[1.15] text-brand-ink sm:text-[44px]">
            Market Entry and Growth Engine Platform
          </h1>
          <p className="mt-4 max-w-[600px] text-[17px] text-brand-muted">
            Tradelomacy connects European F&amp;B brands with a verified distributor network across
            Saudi Arabia and the UAE, providing an integrated pathway from initial engagement to
            commercial agreement and beyond.
          </p>
          <div className="mt-8 flex flex-wrap gap-3.5">
            <Button to="/assessment" variant="primary">
              Request a Demo
            </Button>
            <Button to="/contact" variant="outline">
              Talk to Sales
            </Button>
          </div>
        </div>
        <div className="relative">
          <HeroArt />
        </div>
      </div>
    </header>
  );
}
