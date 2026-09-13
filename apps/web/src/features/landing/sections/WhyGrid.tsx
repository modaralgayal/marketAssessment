import { SectionHead } from "../ui";

type IconName = "match" | "experts" | "domain" | "ai" | "bolt";

function CardIcon({ name }: { name: IconName }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-5 w-5",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "match":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
    case "experts":
      return (
        <svg {...common}>
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case "domain":
      return (
        <svg {...common}>
          <path d="M9 18h6" />
          <path d="M10 22h4" />
          <path d="M12 2a7 7 0 00-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0012 2z" />
        </svg>
      );
    case "ai":
      return (
        <svg {...common}>
          <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M13 2L3 14h7l-1 8 10-12h-7z" />
        </svg>
      );
  }
}

const CARDS: { icon: IconName; h: string; p: string }[] = [
  {
    icon: "match",
    h: "MATCHED",
    p: "Screening every distributor against a brand's category, channel, pricing tier, and positioning requirements. Ranks the qualifying candidates using a fit score calibrated by verified relationship data.",
  },
  {
    icon: "experts",
    h: "In-Country Experts",
    p: "On-the-ground specialists embedded in the target market, giving direct access to local regulatory know-how, culture, and distributor relationships.",
  },
  {
    icon: "domain",
    h: "Domain expertise",
    p: "Deep understanding of the F&B industry, pricing structures, deal structures, and product-market fit",
  },
  {
    icon: "ai",
    h: "AI-Powered",
    p: "Our matching reasoning is supported by structured native data that enhances matching accuracy.",
  },
  {
    icon: "bolt",
    h: "Fast activation",
    p: "A qualified shortlist of potential partners within weeks of kickoff, not months.",
  },
];

export default function WhyGrid() {
  return (
    <section className="bg-white px-6 sm:px-8 py-20 sm:py-24">
      <div className="mx-auto max-w-[1160px]">
        <SectionHead
          eyebrow="Why Tradelomacy"
          title="Intelligence, in-market relationships, deep understanding of market dynamics, not a contact database."
        />
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c) => (
            <div
              key={c.h}
              className="rounded-xl border border-brand-line bg-white p-6 shadow-sm transition hover:border-brand-teal/40 hover:shadow-md"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-teal/10 text-brand-teal-dark">
                <CardIcon name={c.icon} />
              </div>
              <h4 className="text-base font-bold text-brand-ink">{c.h}</h4>
              <p className="mt-2 text-sm text-brand-muted">{c.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
