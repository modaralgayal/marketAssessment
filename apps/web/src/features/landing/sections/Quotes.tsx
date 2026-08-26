import { SectionHead } from "../ui";

const QUOTES = [
  {
    q: "“[Insert quote from recommendation letter — e.g., speaks to reliability, market results, or professionalism of engagement.]”",
    a: "— Name, Title, Company",
  },
  {
    q: "“[Insert second quote from recommendation letter.]”",
    a: "— Name, Title, Company",
  },
];

export default function Quotes() {
  return (
    <section className="bg-brand-bg-alt px-8 py-24">
      <div className="mx-auto max-w-[1160px]">
        <SectionHead eyebrow="What Partners Say" title="Results our clients point to" />
        <div className="grid grid-cols-1 gap-7 md:grid-cols-2">
          {QUOTES.map((q, i) => (
            <div
              key={i}
              className="rounded-3xl border border-brand-line bg-white p-6 text-[15px] leading-relaxed text-brand-ink shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p>{q.q}</p>
              <div className="mt-3.5 text-[13px] font-bold text-brand-ink">{q.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
