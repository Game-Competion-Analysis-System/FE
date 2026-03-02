import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import AnalysisResult from "@/components/AnalysisResult";

const Home = () => {
  const navigate = useNavigate();

  const handleAnalyzeClick = () => {
    navigate("/game-selection");
  };

  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 text-gray-900 font-sans overflow-x-hidden">
      <Navbar />
      <Hero onAnalyzeClick={handleAnalyzeClick} />
        
      <AnalysisResult />
      <Features />
      <HowItWorks />
      <CTA onAnalyzeClick={handleAnalyzeClick} />
      <Footer />
    </div>
  );
};

export default Home;
