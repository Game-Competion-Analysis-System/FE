import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import AnalysisResult from "@/components/AnalysisResult";
import { getAuthToken } from "@/lib/api";

const Home = () => {
  const navigate = useNavigate();

  const handleAnalyzeClick = () => {
    const token = getAuthToken();
    navigate(token ? "/game-selection" : "/login");
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 text-gray-900 font-sans overflow-x-hidden">
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
