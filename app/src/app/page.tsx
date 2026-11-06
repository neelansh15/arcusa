import { LandingEffects } from "@/components/landing/effects";
import { Bento, Faq, FinalCta, Footer, Hero, HowItWorks, Nav, Phone, Try } from "@/components/landing/sections";
import "./landing.css";

export default function Home() {
  return (
    <div className="landing">
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <Bento />
        <Try />
        <Phone />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <LandingEffects />
    </div>
  );
}
