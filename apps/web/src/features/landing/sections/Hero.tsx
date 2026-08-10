import { Button } from "../ui";

export default function Hero() {
  return (
    <header className="relative overflow-hidden bg-gradient-to-b from-[#0F7B7F]/5 via-white to-white px-8 pb-14 pt-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#0F7B7F]/10 blur-3xl"
      />
      <div className="relative mx-auto max-w-[1160px]">
        <div className="mb-4 text-xs font-extrabold uppercase tracking-[1.5px] text-brand-teal">
          GCC Distributor Intelligence
        </div>
        <h1 className="max-w-[780px] text-[34px] font-bold leading-[1.15] text-brand-ink sm:text-[44px]">
          Match, vet, and close GCC distribution deals from one platform.
        </h1>
        <p className="mt-4 max-w-[600px] text-[17px] text-brand-muted">
          [Platform Name] connects European food, beverage, and cosmetics brands to a verified
          network of distributors across Saudi Arabia and the UAE — and manages execution through
          to a signed contract.
        </p>
        <div className="mt-8 flex flex-wrap gap-3.5">
          <Button to="/assessment" variant="primary">
            Request a Demo
          </Button>
          <Button href="#platform" variant="outline">
            See How It Works
          </Button>
        </div>
      </div>
    </header>
  );
}
