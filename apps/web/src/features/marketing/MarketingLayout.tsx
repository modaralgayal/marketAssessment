import { useEffect, useRef, useState } from "react";
import { useLocation, Outlet } from "react-router-dom";
import { useProject, TLink, OrgModalProvider, text } from "./content";
import "./marketing.css";

function Nav() {
  const { project } = useProject();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const location = useLocation();
  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [location.pathname]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (openDropdown && navRef.current && !navRef.current.contains(e.target as Node)) setOpenDropdown(null);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [openDropdown]);

  if (!project) return <header className="site-nav" />;

  const nav = project.global.nav;
  const routePath = "/" + (location.pathname.split("/")[1] ?? "");

  return (
    <header className="site-nav">
      <div className="wrap nav-inner">
        <a href="/home" className="brand-link" aria-label="Tradelomacy home">
          <img src={project.assets.logo} alt="TRADELOMACY" />
        </a>
        <nav className="nav-links" aria-label="Main navigation" ref={navRef}>
          {nav.map((n, i) =>
            n.children?.length ? (
              <div className="nav-dropdown" key={i}>
                <button
                  type="button"
                  className="solutions-toggle"
                  aria-expanded={openDropdown === n.label}
                  aria-controls={`solutions-desktop`}
                  onClick={() => setOpenDropdown((o) => (o === n.label ? null : n.label))}
                >
                  {n.label}
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="m2 4 4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>
                <div className="solutions-menu" id="solutions-desktop" hidden={openDropdown !== n.label}>
                  {n.children.map((c, j) => (
                    <TLink key={j} href={c.href} ariaCurrent={c.href === routePath}>
                      {c.label}
                      <span aria-hidden="true">↗</span>
                    </TLink>
                  ))}
                </div>
              </div>
            ) : (
              <TLink key={i} href={n.href} ariaCurrent={n.href === routePath}>
                {text(project, `global.nav.${i}.label`)}
              </TLink>
            ),
          )}
        </nav>
        <div className="nav-actions">
          <TLink href="#/contact" className="sales-link">
            {project.global.secondaryLabel}
          </TLink>
          <TLink href="#/start-trading" className="button">
            {project.global.primaryLabel}
            <span className="arrow" aria-hidden="true">
              ↗
            </span>
          </TLink>
        </div>
        <button
          className="menu-toggle"
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label="Open navigation"
          onClick={() => setMobileOpen((o) => !o)}
        >
          ☰
        </button>
      </div>
      <nav className={`mobile-nav${mobileOpen ? " open" : ""}`} id="mobile-menu" aria-label="Mobile navigation">
        {nav.map((n, i) => (
          <TLink key={i} href={n.href}>
            {text(project, `global.nav.${i}.label`)}
          </TLink>
        ))}
        <TLink href="#/contact">{project.global.secondaryLabel}</TLink>
        <TLink href="#/start-trading">{project.global.primaryLabel}</TLink>
      </nav>
    </header>
  );
}

function Footer() {
  const { project } = useProject();
  if (!project) return <footer className="footer" />;
  const p = "global.footer";
  const footer = project.global.footer;
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-top">
          <div>
            <a href="/home">
              <img className="footer-logo" src={project.assets.logo} alt="TRADELOMACY" />
            </a>
            <p className="footer-tag">{footer.tagline}</p>
            <p>{footer.description}</p>
          </div>
          <nav className="footer-links" aria-label="Footer">
            {footer.links.map((x, i) => (
              <TLink key={i} href={x.href}>
                {text(project, `${p}.links.${i}.label`)}
              </TLink>
            ))}
          </nav>
        </div>
        <div className="footer-bottom">
          <span>{footer.copyright}</span>
          <a href={`mailto:${footer.email}`}>{footer.email}</a>
        </div>
      </div>
    </footer>
  );
}

export function MarketingLayout() {
  return (
    <div className="tl">
      <OrgModalProvider>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Nav />
        <Outlet />
        <Footer />
      </OrgModalProvider>
    </div>
  );
}
