import { Link } from "react-router-dom";
import { Button } from "./ui";

const NAV_LINKS = [
  { label: "Platform", href: "#platform" },
  { label: "Programs", href: "#programs" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
];

export default function SiteNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-brand-line bg-white">
      <div className="mx-auto flex max-w-[1160px] items-center justify-between px-8 py-4">
        <Link to="/" className="text-[19px] font-extrabold text-brand-ink">
          [Platform Name]
        </Link>
        <div className="hidden items-center gap-7 text-sm font-semibold text-brand-muted md:flex">
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href} className="hover:text-brand-ink">
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2.5">
          <a
            href="mailto:jaber.algayal24@gmail.com"
            className="hidden rounded-full border border-brand-line px-5 py-3 text-sm font-bold text-brand-ink hover:border-brand-teal hover:text-brand-teal sm:inline-flex"
          >
            Contact Us
          </a>
          <Button to="/assessment" variant="primary">
            Request a Demo
          </Button>
        </div>
      </div>
    </nav>
  );
}
