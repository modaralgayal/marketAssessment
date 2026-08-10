const FOOTER_COLS = [
  { h: "Platform", links: ["Verified Matching", "Deal Execution", "Account Management"] },
  { h: "Programs", links: ["Direct Supplier", "Trade Body Cohorts"] },
  { h: "Company", links: ["About", "Contact"] },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-brand-line bg-brand-bg-alt px-8 py-12">
      <div className="mx-auto max-w-[1160px]">
        <div className="flex flex-wrap justify-between gap-6">
          <div className="flex flex-wrap gap-14">
            {FOOTER_COLS.map((c) => (
              <div key={c.h}>
                <h5 className="mb-3 text-xs font-bold uppercase tracking-[1px] text-brand-muted">
                  {c.h}
                </h5>
                {c.links.map((l) => (
                  <a
                    key={l}
                    href="#"
                    className="mb-2 block text-sm text-brand-ink hover:text-brand-teal"
                  >
                    {l}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 border-t border-brand-line pt-5 text-[13px] text-brand-muted">
          © 2026 [Platform Name] Oy. All rights reserved. — jaber.algayal24@gmail.com
        </div>
      </div>
    </footer>
  );
}
