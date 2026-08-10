const STATS = [
  { num: "3+ yrs", label: "Longest-running client retainer" },
  { num: "Hundreds", label: "Distributors mapped across Saudi Arabia & UAE" },
  { num: "5", label: "Trade promotion organizations served" },
];

export default function Stats() {
  return (
    <section className="bg-brand-bg-alt px-8 py-[72px]">
      <div className="mx-auto grid max-w-[1160px] grid-cols-1 gap-8 text-center md:grid-cols-3">
        {STATS.map((s) => (
          <div key={s.label}>
            <div className="text-[42px] font-extrabold text-brand-teal">{s.num}</div>
            <div className="mt-1 text-sm text-brand-muted">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
