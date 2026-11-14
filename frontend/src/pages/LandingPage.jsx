// src/pages/LandingPage.jsx
import Navbar from './landing/Navbar';
import Hero from './landing/Hero';
import Stats from './landing/Stats';
import Features from './landing/Features';
import Roles from './landing/Roles';
import HowItWorks from './landing/HowItWorks';
import EngineDeepDive from './landing/EngineDeepDive';
import Scenarios from './landing/Scenarios';
import Benefits from './landing/Benefits';
import Testimonials from './landing/Testimonials';
import Pricing from './landing/Pricing';
import FAQ from './landing/FAQ';
import FinalCTA from './landing/FinalCTA';
import Footer from './landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <Roles />
      <HowItWorks />
      <EngineDeepDive />
      <Scenarios />
      <Benefits />
      <Testimonials />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}