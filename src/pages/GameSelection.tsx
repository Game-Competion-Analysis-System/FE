import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Sparkles, Smartphone, Swords } from "lucide-react";
import FallBeamBackground from "@/components/lightswind/fall-beam-background";
import { ApiError } from "@/lib/api";
import { fetchGames, type Game } from "@/lib/games";

type GameCard = {
  image: string;
  description: string;
  icon: ReactNode;
  tag: string;
};

const GameSelection = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchGames({ signal: controller.signal })
      .then((list) => {
        setGames(Array.isArray(list) ? list : []);
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Failed to load game list");
        setGames([]);
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, []);

  const cardFor = useMemo(() => {
    const fallback: GameCard = {
      image: "https://images2.thanhnien.vn/528068263637045248/2025/8/6/vltk20-1-17544736359611649581292.jpg",
      description: "Analyze leaderboards and get strategy suggestions.",
      icon: <Swords className="w-6 h-6 text-white" />,
      tag: "Game",
    };

    const byName: Record<string, GameCard> = {
      "vltk mobile": {
        image: "https://cdn.sforum.vn/sforum/wp-content/uploads/2021/04/VLTK-1-mobile-cover.png",
        description: "Analyze tactics and builds for mobile.",
        icon: <Smartphone className="w-6 h-6 text-white" />,
        tag: "Mobile",
      },
      "vltk 2.0": {
        image: "https://images2.thanhnien.vn/528068263637045248/2025/8/6/vltk20-1-17544736359611649581292.jpg",
        description: "Analyze gameplay, characters, and skills in detail.",
        icon: <Swords className="w-6 h-6 text-white" />,
        tag: "PC MMORPG",
      },
    };

    return (gameName: string): GameCard => byName[gameName.trim().toLowerCase()] ?? fallback;
  }, []);

  const handleGameSelect = (gameId: number) => {
    navigate(`/server-selection?game=${encodeURIComponent(String(gameId))}`);
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 px-4 py-10 overflow-hidden">
      <FallBeamBackground lineCount={12} beamColorClass="cyan-400" />

      <div className="relative z-20 max-w-6xl mx-auto">
        <div className="mb-10 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white/85 px-4 py-2 text-sm font-bold text-gray-800 hover:bg-white transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs font-black text-teal-700/70">
            <Sparkles className="w-4 h-4 text-teal-600" />
            Remote API ready
          </div>
        </div>

        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-black tracking-wide shadow-lg">
            SELECT YOUR GAME
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-4 leading-tight">
            Choose Your Game
          </h1>
          <p className="text-gray-700 text-lg max-w-2xl mx-auto font-medium">
            Choose a game to analyze
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {isLoading ? (
            <div className="md:col-span-2 rounded-3xl border border-gray-200 bg-white/80 p-10 text-center text-gray-600 font-semibold">
              Loading games…
            </div>
          ) : error ? (
            <div className="md:col-span-2 rounded-3xl border border-red-200 bg-red-50 p-10 text-center text-red-700 font-bold">
              {error}
            </div>
          ) : (
            games.map((game) => {
              const card = cardFor(game.gameName);
              return (
                <button
                  key={game.gameId}
                  onClick={() => handleGameSelect(game.gameId)}
                  className="group relative rounded-3xl overflow-hidden text-left transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-transparent shadow-xl hover:shadow-2xl"
                >
                  <div className="absolute inset-0 bg-white/92 backdrop-blur-sm" />
                  <div className="absolute inset-0 ring-1 ring-gray-200 group-hover:ring-teal-300 transition" />

                  <div className="relative z-10">
                    <div className="h-44 overflow-hidden">
                      <img
                        src={card.image}
                        alt={game.gameName}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                      />
                    </div>

                    <div className="p-8">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="inline-flex items-center gap-3">
                          <div className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 p-3 shadow-lg">
                            {card.icon}
                          </div>
                          <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-black text-teal-800">
                            {card.tag}
                          </span>
                        </div>
                      </div>

                      <h2 className="text-3xl font-black text-gray-900 mb-2">{game.gameName}</h2>
                      <p className="text-gray-600 mb-7 group-hover:text-gray-700 transition-colors max-w-md font-medium">
                        {card.description}
                      </p>

                      <div className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-3 text-sm font-black text-white shadow-xl shadow-teal-500/15 group-hover:shadow-teal-500/25 transition">
                        <span>Analyze</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default GameSelection;
