import { LandingEffects } from "@/components/landing/effects";
import { Bridge, Features, FinalCta, Footer, Hero, HowItWorks, Nav, Stats, Ticker } from "@/components/landing/sections";
import "./landing.css";

export default function Home() {
  return (
    <div className="landing">
      <Nav />
      <main>
        <Hero />
        <Ticker />
        <Features />
        <HowItWorks />
        <Bridge />
        <Stats />
        <FinalCta />
      </main>
      <Footer />
      <LandingEffects />
    </div>
  );
}
