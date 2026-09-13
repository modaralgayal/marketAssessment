const STATS = [
  { num: "60+", label: "F&B brands supported" },
  { num: "300+", label: "Verified distributors & retailers" },
  { num: "6", label: "GCC markets reached" },
];

export default function Stats() {
  return (
    <section className="bg-brand-bg-alt px-6 sm:px-8 py-16 sm:py-20">
      <div className="mx-auto max-w-[1160px]">
        <p className="mb-8 text-center text-xs font-extrabold uppercase tracking-[1.5px] text-brand-teal">
          Trusted by European F&B brands
        </p>
        <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-[42px] font-extrabold text-brand-teal">{s.num}</div>
              <div className="mt-1 text-sm text-brand-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
