import { SectionHead, Button } from "../ui";

const PROGRAMS = [
  {
    tag: "For Manufacturers",
    title: "Direct Supplier Program",
    cta: "Request a Demo",
    body: "Retainer plus commission, or commission-only for high-demand categories like dairy, poultry, and meat. Full-cycle execution from distributor search to signed contract.",
  },
  {
    tag: "For Trade Bodies",
    title: "Cohort Program",
    cta: "Talk to Sales",
    body: "6–12 month partner-search and B2B sales programs run for groups of 10–15 exporters on behalf of trade promotion organizations.",
  },
];

export default function Programs() {
  return (
    <section id="programs" className="scroll-mt-24 bg-brand-bg-alt px-8 py-[72px]">
      <div className="mx-auto max-w-[1160px]">
        <SectionHead
          eyebrow="Programs"
          title="Two ways to work with [Platform Name]"
          sub="Built for individual manufacturers and for trade organizations supporting a cohort of exporters."
        />
        <div className="grid grid-cols-1 gap-7 md:grid-cols-2">
          {PROGRAMS.map((p) => (
            <div
              key={p.title}
              className="flex flex-col rounded-xl border border-brand-line bg-white p-8"
            >
              <span className="mb-3.5 w-fit rounded bg-brand-teal/10 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[1px] text-brand-teal-dark">
                {p.tag}
              </span>
              <h3 className="text-[21px] font-bold text-brand-ink">{p.title}</h3>
              <p className="mt-3 flex-grow text-[14.5px] text-brand-muted">{p.body}</p>
              <Button to="/assessment" variant="primary" className="mt-4 self-start">
                {p.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
