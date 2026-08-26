const STATS = [
  { num: "55+", label: "FMCG Brands supported" },
  { num: "150+", label: "Distributors & retailers, verified and classified, across Saudi Arabia & UAE" },
  { num: "5", label: "Trade Promotion Missions Organized" },
];

export default function Stats() {
  return (
    <section className="bg-brand-bg-alt px-8 py-24">
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
