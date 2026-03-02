
interface HeroProps {
  onAnalyzeClick?: () => void;
}

const Hero = ({ onAnalyzeClick }: HeroProps) => {
  return (
    <section
      className="relative w-screen min-h-[70vh] flex items-center justify-start bg-cover bg-center"
      aria-hidden={false}
      style={{
        backgroundImage: "url('https://i.pinimg.com/1200x/45/3c/2a/453c2a84b5b5facd0868ec0d5ce1a893.jpg')",
        backgroundPosition: "center 40%"
      }}
    >
      {/* Overlay for contrast */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/45 via-transparent to-black/25" aria-hidden="true" />

      <div className="relative z-10 max-w-2xl px-6 md:px-12 text-white">
        <span className="inline-block mb-6 px-5 py-2 rounded-full bg-teal-500/40 backdrop-blur-md text-white text-sm font-bold tracking-wide border border-white/20 shadow-xl">
          🎮 100% ACCURATE AI ANALYSIS
        </span>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black leading-tight mb-4 drop-shadow-2xl">
          Analyze Võ Lâm
          <br />
          <span className="text-teal-300">with AI Power</span>
        </h1>

        <p className="text-white mb-8 text-lg sm:text-xl leading-relaxed max-w-lg drop-shadow-lg">
          Discover in-depth insights about players, matches and strategies. Fast, visual, and actionable analysis for competitive play.
        </p>

        <div className="flex gap-4 flex-wrap">
          <button
            onClick={onAnalyzeClick}
            aria-label="Upload screenshot to analyze"
            className="bg-teal-500 text-white font-bold px-8 py-3 rounded-2xl hover:scale-105 hover:bg-teal-400 transition-all duration-300 shadow-2xl"
          >
            Upload Screenshot
          </button>
          <button
            aria-label="Watch demo video"
            className="border-2 border-white/70 backdrop-blur-md bg-white/15 px-6 py-3 rounded-2xl hover:bg-white hover:text-teal-900 transition-all duration-300 font-bold shadow-xl"
          >
            Watch Demo
          </button>
        </div>

        {/* Stats */}
        <div className="mt-12 flex gap-12">
          <div>
            <p className="text-3xl font-black text-teal-300">100%</p>
            <p className="text-white/80 text-sm mt-1">Accuracy</p>
          </div>
          <div>
            <p className="text-3xl font-black text-teal-300">&lt;2s</p>
            <p className="text-white/80 text-sm mt-1">Analyze Time</p>
          </div>
          <div>
            <p className="text-3xl font-black text-teal-300">3+</p>
            <p className="text-white/80 text-sm mt-1">Data Types</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;