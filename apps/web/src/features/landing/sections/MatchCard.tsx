function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center rounded bg-brand-teal/10 px-1.5 py-0.5 text-[9px] font-extrabold text-brand-teal">
      {children}
    </span>
  );
}

export default function MatchCard() {
  return (
    <div className="rounded-2xl border border-brand-line bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[1px] text-brand-muted">
          Live match
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-teal/10 px-2.5 py-1 text-[10px] font-bold text-brand-teal">
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Verified
        </span>
      </div>

      <div className="my-4 flex items-center gap-3">
        <div className="flex-1 rounded-xl border border-brand-line bg-brand-bg-alt px-3 py-2.5">
          <div className="mb-1 flex items-center gap-1.5">
            <Chip>EU</Chip>
            <span className="text-[10px] font-bold uppercase tracking-wide text-brand-muted">Brand</span>
          </div>
          <div className="text-[13px] font-semibold text-brand-ink">European F&amp;B Brand</div>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-teal text-white">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 5l6 5-6 5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13 5l-6 5 6 5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
          </svg>
        </div>

        <div className="flex-1 rounded-xl border border-brand-teal bg-brand-teal/5 px-3 py-2.5">
          <div className="mb-1 flex items-center gap-1.5">
            <Chip>GCC</Chip>
            <span className="text-[10px] font-bold uppercase tracking-wide text-brand-muted">Distributor</span>
          </div>
          <div className="text-[13px] font-semibold text-brand-ink">Verified · SA / UAE</div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-brand-muted">Fit score</span>
          <span className="font-bold text-brand-teal">92%</span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-brand-line">
          <div className="h-2 w-[92%] rounded-full bg-brand-teal" />
        </div>
      </div>
    </div>
  );
}
