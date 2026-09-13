import { SectionHead, Button } from "../ui";
import { useExportLead } from "../StartExportingModal";

const PROGRAMS = [
  {
    tag: "For F&B Brands",
    title: "Manufacturers",
    cta: "Start exporting",
    body: "Tradelomacy supports your export team with verified buyers and market know-how to fill the gap of information asymmetry. Our 3-tier buyer profile system gives you visibility into potential retail or distribution partners, supporting a successful market entry.",
  },
  {
    tag: "Trade Promotion and Business Support Organizations",
    title: "Trade Promotion Organizations",
    cta: "Talk to sales",
    body: "Tradelomacy supports your industry's international growth by connecting your members with verified potential partners through targeted B2B matching, delegation programs, and direct sales.",
  },
];

export default function Programs() {
  const { open } = useExportLead();
  return (
    <section id="programs" className="scroll-mt-24 bg-brand-bg-alt px-6 sm:px-8 py-20 sm:py-24">
      <div className="mx-auto max-w-[1160px]">
        <SectionHead
          eyebrow="Solution"
          title="Move from generic buyer directories to reach and match with qualified buyers at scale"
        />
        <div className="grid grid-cols-1 gap-7 md:grid-cols-2">
          {PROGRAMS.map((p, i) => (
            <div
              key={p.title}
              className="flex flex-col rounded-xl border border-brand-line bg-white p-8 shadow-sm transition hover:border-brand-teal/40 hover:shadow-md"
            >
              <span className="mb-3.5 w-fit rounded bg-brand-teal/10 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[1px] text-brand-teal-dark">
                {p.tag}
              </span>
              <h3 className="text-[21px] font-bold text-brand-ink">{p.title}</h3>
              <p className="mt-3 flex-grow text-[14.5px] text-brand-muted">{p.body}</p>
              {i === 0 ? (
                <Button variant="primary" onClick={open} className="mt-4 self-start">
                  {p.cta}
                </Button>
              ) : (
                <Button to="/contact" variant="primary" className="mt-4 self-start">
                  {p.cta}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
