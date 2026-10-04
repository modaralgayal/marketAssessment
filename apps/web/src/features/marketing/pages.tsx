import { useEffect } from "react";
import { useProject } from "./content";
import { SectionView } from "./sections";

export function MarketingPage({ route }: { route: string }) {
  const { project } = useProject();

  // Scroll to top on route (page) change — matches the reference SPA behaviour
  // where clicking a nav link (e.g. For Manufacturers) glides back to the top.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [route]);

  if (!project) {
    return (
      <main id="main">
        <div className="wrap section">
          <p className="section-intro">Loading…</p>
        </div>
      </main>
    );
  }
  const page = project.pages[route] ?? project.pages["home"];
  return (
    <main id="main">
      {page.sections.map((s, i) => (
        <SectionView key={i} project={project} route={route} i={i} section={s} />
      ))}
    </main>
  );
}
