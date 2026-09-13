import { Eyebrow } from "../ui";
import ProcessDiagram from "./ProcessDiagram";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 px-8 py-24">
      <div className="mx-auto max-w-[1160px]">
        <Eyebrow>Tradelomacy Process</Eyebrow>
        <ProcessDiagram />
      </div>
    </section>
  );
}
