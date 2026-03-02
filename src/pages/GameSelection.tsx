import { useNavigate } from "react-router-dom";
import FallBeamBackground from "@/components/lightswind/fall-beam-background";

interface GameOption {
  id: string;
  name: string;
  description: string;
  image: string;
  icon: string;
}

const GameSelection = () => {
  const navigate = useNavigate();

  const games: GameOption[] = [
    {
      id: "vlk2",
      name: "Võ Lâm Truyền Kì 2.0",
      description: "Phân tích chi tiết gameplay, nhân vật và kỹ năng",
      image: "https://images2.thanhnien.vn/528068263637045248/2025/8/6/vltk20-1-17544736359611649581292.jpg",
      icon: "",
    },
    {
      id: "vlk-mobile",
      name: "Võ Lâm Truyền Kì Mobile",
      description: "Phân tích chiến t huật và build nhân vật mobile",
      image: "https://cdn.sforum.vn/sforum/wp-content/uploads/2021/04/VLTK-1-mobile-cover.png",
      icon: "",
    },
  ];

  const handleGameSelect = (gameId: string) => {
    navigate(`/analyze?game=${gameId}`);
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 flex items-center justify-center px-4 py-8 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Fall Beam Background */}
      <FallBeamBackground lineCount={12} beamColorClass="cyan-400" />

      {/* Content */}
      <div className="relative z-20 max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-4 py-2 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 text-white text-xs font-bold tracking-wide">
             SELECT YOUR GAME
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
            Choose Your Game
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Select which Võ Lâm Truyền Kì version you want to analyze
          </p>
        </div>

        {/* Game Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => handleGameSelect(game.id)}
              className="group relative h-80 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              style={{
                backgroundImage: `url(${game.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {/* Card border */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-cyan-400 transition-colors duration-300 rounded-2xl" />

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 bg-transparent transition-all duration-300">
                {/* Icon */}
                <div className="text-7xl mb-6 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
                  {game.icon}
                </div>

                {/* Game Name */}
                <h2 className="text-3xl font-bold text-white mb-3 text-center">
                  {game.name}
                </h2>

                {/* Description */}
                <p className="text-gray-300 text-center mb-6 group-hover:text-gray-200 transition-colors">
                  {game.description}
                </p>

                {/* CTA Button */}
                <div className="mt-auto">
                  <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold group-hover:from-teal-400 group-hover:to-cyan-400 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                    <span>Analyze Now</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Back Button */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-all duration-300 backdrop-blur-sm border border-white/20 hover:border-white/40"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameSelection;
