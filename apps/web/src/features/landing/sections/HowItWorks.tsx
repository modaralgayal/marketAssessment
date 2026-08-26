import { SectionHead } from "../ui";
import ProcessDiagram from "./ProcessDiagram";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bp scroll-mt-24 px-8 py-24">
      <div className="mx-auto max-w-[1160px]">
        <SectionHead eyebrow="How It Works" title="From kickoff to signed contract" />
        <ProcessDiagram />
      </div>
    </section>
  );
}
