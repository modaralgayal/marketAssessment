import SiteNav from "./SiteNav";
import SiteFooter from "./SiteFooter";
import Hero from "./sections/Hero";
import OurVision from "./sections/OurVision";
import Stats from "./sections/Stats";
import PlatformFeatures from "./sections/PlatformFeatures";
import WhyGrid from "./sections/WhyGrid";
import HowItWorks from "./sections/HowItWorks";
import Programs from "./sections/Programs";
import Faq from "./sections/Faq";
import CtaBand from "./sections/CtaBand";

export default function LandingPage() {
  return (
    <div className="landing-bg flex min-h-screen flex-col font-sans text-brand-ink">
      <SiteNav />
      <main className="flex-1">
        <Hero />
        <OurVision />
        <Stats />
        <PlatformFeatures />
        <WhyGrid />
        <HowItWorks />
        <Programs />
        <Faq />
        <CtaBand />
      </main>
      <SiteFooter />
    </div>
  );
}
