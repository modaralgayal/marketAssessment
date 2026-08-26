const LOGOS = [
  "Confectionery",
  "Poultry",
  "Frozen foods",
  "Innovative solution",
];

export default function LogoStrip() {
  return (
    <div className="border-y border-brand-line bg-brand-bg-alt px-8 py-8">
      <div className="mx-auto max-w-[1160px]">
        <div className="mb-4 text-xs font-bold uppercase tracking-[1px] text-brand-muted">
          Categories
        </div>
        <div className="flex flex-wrap gap-3.5">
          {LOGOS.map((l) => (
            <div
              key={l}
              className="rounded-md border border-brand-line bg-white px-4 py-2.5 text-[13.5px] font-bold text-brand-ink"
            >
              {l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
