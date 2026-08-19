import SiteNav from "./SiteNav";
import SiteFooter from "./SiteFooter";
import Hero from "./sections/Hero";
import LogoStrip from "./sections/LogoStrip";
import PlatformFeatures from "./sections/PlatformFeatures";
import Stats from "./sections/Stats";
import WhyGrid from "./sections/WhyGrid";
import Programs from "./sections/Programs";
import HowItWorks from "./sections/HowItWorks";
import Quotes from "./sections/Quotes";
import Faq from "./sections/Faq";
import CtaBand from "./sections/CtaBand";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-brand-ink">
      <SiteNav />
      <main className="flex-1">
        <Hero />
        <LogoStrip />
        <PlatformFeatures />
        <Stats />
        <WhyGrid />
        <Programs />
        <HowItWorks />
        <Quotes />
        <Faq />
        <CtaBand />
      </main>
      <SiteFooter />
    </div>
  );
}
