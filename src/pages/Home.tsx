import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import AnalyzeScreenshot from "@/components/AnalyzeScreenshot";

const Home = () => {
  const [showAnalyzePage, setShowAnalyzePage] = useState(false);

  if (showAnalyzePage) {
    return <AnalyzeScreenshot onBack={() => setShowAnalyzePage(false)} />;
  }

  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 text-gray-900 font-sans overflow-x-hidden">
      <Navbar />
      <Hero onAnalyzeClick={() => setShowAnalyzePage(true)} />
      <Features />
      <HowItWorks />
      <CTA onAnalyzeClick={() => setShowAnalyzePage(true)} />
      <Footer />
    </div>
  );
};

export default Home;
