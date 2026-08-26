import { SectionHead, Button } from "../ui";

const PROGRAMS = [
  {
    tag: "For FMCG Brands",
    title: "Manufacturer Program",
    cta: "Talk to Sales",
    body: "From Intro to Contract and beyond, Tradelomacy is a market-entry platform that empowers F&B brands to expand into global markets through distributor intelligence and in-market relationships.",
  },
  {
    tag: "For Trade Promotion Organizations",
    title: "Trade Promotion and Business Support Organizations Program",
    cta: "Read Our Case Studies",
    body: "Tradelomacy platform supports BSOs with B2B matchmaking, delegation missions, and direct sales, contributing to national industry growth.",
  },
];

export default function Programs() {
  return (
    <section id="programs" className="scroll-mt-24 bg-brand-bg-alt px-8 py-[72px]">
      <div className="mx-auto max-w-[1160px]">
        <SectionHead
          eyebrow="Programs"
          title="Two ways to work with Tradelomacy"
          sub="Built for individual manufacturers and for trade organizations supporting a cohort of exporters."
        />
        <div className="grid grid-cols-1 gap-7 md:grid-cols-2">
          {PROGRAMS.map((p) => (
            <div
              key={p.title}
              className="flex flex-col rounded-2xl border border-brand-line bg-white p-8 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="mb-3.5 w-fit rounded bg-brand-teal/10 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[1px] text-brand-teal-dark">
                {p.tag}
              </span>
              <h3 className="text-[21px] font-bold text-brand-ink">{p.title}</h3>
              <p className="mt-3 flex-grow text-[14.5px] text-brand-muted">{p.body}</p>
              <Button to="/contact" variant="primary" className="mt-4 self-start">
                {p.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
