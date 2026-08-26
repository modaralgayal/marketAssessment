import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui";

const NAV_LINKS = [
  { label: "Platform", href: "/#platform" },
  { label: "Programs", href: "/#programs" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "FAQ", href: "/#faq" },
];

export default function SiteNav() {
  const { hash } = useLocation();

  // Scroll to the targeted section whenever the hash changes — including when we
  // arrive from another route (e.g. /assessment). Plain "#anchor" links only work
  // on the page that contains the target; routing to "/#anchor" lands home first.
  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [hash]);

  return (
    <nav className="sticky top-0 z-50 border-b border-brand-line bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-[1160px] items-center justify-between px-8 py-4">
        <Link to="/" className="text-[19px] font-extrabold text-brand-ink">
          Tradelomacy
        </Link>
        <div className="hidden items-center gap-7 text-sm font-semibold text-brand-muted md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.label} to={l.href} className="hover:text-brand-ink">
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/request-report"
            className="hidden rounded-full border border-brand-line px-5 py-3 text-sm font-bold text-brand-ink hover:border-brand-teal hover:text-brand-teal sm:inline-flex"
          >
            Request a Report
          </Link>
          <Button to="/contact" variant="primary">
            Talk to Sales
          </Button>
        </div>
      </div>
    </nav>
  );
}
