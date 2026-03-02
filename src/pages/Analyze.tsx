import { useSearchParams, useNavigate } from "react-router-dom";
import AnalyzeScreenshot from "@/components/AnalyzeScreenshot";

interface AnalyzeProps {}

const Analyze = ({}: AnalyzeProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const gameId = searchParams.get("game");

  const gameNames: Record<string, string> = {
    vlk2: "Võ Lâm Truyền Kì 2.0",
    "vlk-mobile": "Võ Lâm Truyền Kì Mobile",
  };

  const handleBack = () => {
    navigate("/game-selection");
  };

  return (
    <AnalyzeScreenshot 
      onBack={handleBack} 
      selectedGame={gameId || ""} 
      gameName={gameNames[gameId || ""] || "Game"}
    />
  );
};

export default Analyze;
