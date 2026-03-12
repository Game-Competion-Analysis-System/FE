import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AnalyzeScreenshot from "@/components/AnalyzeScreenshot";
import { isAllowedGameId, resolveGameName } from "@/lib/games";
import { toast } from "@/hooks/use-toast";

interface AnalyzeProps {}

const Analyze = ({}: AnalyzeProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const gameId = searchParams.get("game");
  const server = searchParams.get("server");
  const [gameName, setGameName] = useState<string>("Game");

  useEffect(() => {
    if (!gameId) return;
    const n = Number(gameId);
    if (!Number.isFinite(n) || !isAllowedGameId(n)) {
      toast.warning({
        title: "Unsupported game",
        description: "Please pick a supported game from the list.",
      });
      navigate("/game-selection");
    }
  }, [gameId, navigate]);

  useEffect(() => {
    const controller = new AbortController();

    resolveGameName(gameId, { signal: controller.signal })
      .then((name) => setGameName(name ?? "Game"))
      .catch(() => {
        setGameName("Game");
      });

    return () => controller.abort();
  }, [gameId]);

  const handleBack = () => {
    navigate("/game-selection");
  };

  return (
    <AnalyzeScreenshot 
      onBack={handleBack} 
      selectedGame={gameId || ""} 
      server={server || ""}
      gameName={gameName}
    />
  );
};

export default Analyze;
