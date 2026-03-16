import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Smartphone, Swords } from "lucide-react";
import UserPageShell from "@/components/UserPageShell";
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
    <UserPageShell
      eyebrow="Game Selection"
      title="Choose the game you want to analyze"
      description="Start the analysis flow by selecting the title you are currently playing. Each option leads into a server-specific analysis path."
      backHref="/"
      actions={
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-teal-200 bg-white/90 px-4 py-2 text-xs font-black text-teal-700 shadow-sm">
          <Sparkles className="h-4 w-4 text-teal-600" />
          Remote API ready
        </div>
      }
      aside={
        <div className="space-y-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Available</p>
            <p className="mt-2 text-4xl font-black text-slate-950">{games.length}</p>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
              Supported games returned from the backend and ready for the next step.
            </p>
          </div>
          <div className="rounded-3xl border border-teal-100 bg-teal-500/10 p-4">
            <p className="text-sm font-black text-slate-900">Flow</p>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
              Select game, choose server, then upload a screenshot for analysis.
            </p>
          </div>
        </div>
      }
      contentClassName="max-w-6xl"
    >
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            <div className="md:col-span-2 xl:col-span-3 rounded-[2rem] border border-slate-200 bg-white/80 p-10 text-center text-slate-600 font-semibold shadow-sm">
              Loading games…
            </div>
          ) : error ? (
            <div className="md:col-span-2 xl:col-span-3 rounded-[2rem] border border-red-200 bg-red-50 p-10 text-center text-red-700 font-bold shadow-sm">
              {error}
            </div>
          ) : (
            games.map((game) => {
              const card = cardFor(game.gameName);
              return (
                <button
                  key={game.gameId}
                  onClick={() => handleGameSelect(game.gameId)}
                  className="group relative overflow-hidden rounded-[2rem] text-left shadow-[0_24px_80px_rgba(14,116,144,0.12)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_90px_rgba(14,116,144,0.18)] focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-transparent"
                >
                  <div className="absolute inset-0 bg-white/92 backdrop-blur-sm" />
                  <div className="absolute inset-0 ring-1 ring-slate-200 transition group-hover:ring-teal-300" />

                  <div className="relative z-10">
                    <div className="h-44 overflow-hidden">
                      <img
                        src={card.image}
                        alt={game.gameName}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                      />
                    </div>

                    <div className="p-7">
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

                      <div className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-3 text-sm font-black text-white shadow-xl shadow-teal-500/15 transition group-hover:shadow-teal-500/25">
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
    </UserPageShell>
  );
};

export default GameSelection;
