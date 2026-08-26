export default function HeroArt() {
  return (
    <div className="relative rounded-2xl border border-brand-line bg-white p-6 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[1px] text-brand-muted">
          Europe &rarr; the GCC
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-teal/10 px-2.5 py-1 text-[10px] font-bold text-brand-teal">
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Verified
        </span>
      </div>

      <svg
        viewBox="0 0 480 200"
        className="w-full"
        role="img"
        aria-label="A European food and beverage brand connected by a trade route to a verified distributor in Saudi Arabia and the UAE through Tradelomacy."
      >
        {/* Trade route arc */}
        <path
          className="hero-route"
          d="M112 105 Q240 25 368 105"
          fill="none"
          stroke="rgb(var(--brand-teal))"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* European brand node */}
        <circle cx="78" cy="105" r="34" fill="rgb(var(--brand-teal))" />
        <text x="78" y="111" textAnchor="middle" fontSize="17" fontWeight="800" fill="#fff">
          EU
        </text>
        <text x="78" y="162" textAnchor="middle" fontSize="11" fontWeight="600" fill="rgb(var(--brand-muted))">
          European F&amp;B Brand
        </text>

        {/* Tradelomacy pin (middle) */}
        <path d="M240 47 L253 60 L240 73 L227 60 Z" fill="rgb(var(--brand-orange))" />
        <path
          d="M233 61 l5 5 l9 -10"
          fill="none"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="240" y="30" textAnchor="middle" fontSize="12" fontWeight="800" fill="rgb(var(--brand-ink))">
          Tradelomacy
        </text>

        {/* Verified distributor node */}
        <circle cx="402" cy="105" r="34" fill="#fff" stroke="rgb(var(--brand-teal))" strokeWidth="2.5" />
        <text x="402" y="111" textAnchor="middle" fontSize="17" fontWeight="800" fill="rgb(var(--brand-teal))">
          GCC
        </text>
        <text x="402" y="150" textAnchor="middle" fontSize="11" fontWeight="700" fill="rgb(var(--brand-ink))">
          Verified Distributor
        </text>
        <text x="402" y="165" textAnchor="middle" fontSize="10" fill="rgb(var(--brand-muted))">
          Saudi Arabia · UAE
        </text>
      </svg>

      <div className="mt-4 flex items-center justify-center gap-2 text-[12px] font-semibold text-brand-ink">
        <span className="rounded-full bg-brand-bg-alt px-3 py-1">01 · Assess</span>
        <span className="text-brand-muted">→</span>
        <span className="rounded-full bg-brand-bg-alt px-3 py-1">02 · Match</span>
        <span className="text-brand-muted">→</span>
        <span className="rounded-full bg-brand-bg-alt px-3 py-1">03 · Close</span>
      </div>
    </div>
  );
}
