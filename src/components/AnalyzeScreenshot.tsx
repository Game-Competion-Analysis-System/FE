import { useState } from "react";

interface AnalyzeScreenshotProps {
  onBack: () => void;
  selectedGame?: string;
  gameName?: string;
}

const AnalyzeScreenshot = ({ onBack, selectedGame, gameName }: AnalyzeScreenshotProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const processFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Header */}
      <header className="relative z-10 sticky top-0 w-full bg-white/10 backdrop-blur-xl border-b border-white/10 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/80 hover:text-white font-semibold text-sm transition duration-300 group"
          >
            <span className="group-hover:-translate-x-1 transition">←</span>
            <span>Back</span>
          </button>
          <div className="ml-auto text-white/50 text-sm hidden sm:block">
            {gameName ? `${gameName} • Analysis` : "VLK Analyzer • Screenshot Analysis"}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-16">
        {/* Title Section */}
        <div className="mb-12 text-center lg:text-left">
          <div className="inline-block mb-4 px-4 py-2 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 text-white text-xs font-bold tracking-wide">
            🎮 GAME ANALYSIS ENGINE
            {gameName && ` • ${gameName}`}
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-4 leading-tight">
            Upload & Analyze
          </h1>
          <p className="text-white/70 text-lg sm:text-xl max-w-2xl">
            Drop your {gameName || "Võ Lâm"} screenshot and get instant AI-powered insights. Rankings, strategy recommendations, and detailed stats — all in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Upload Area */}
          <div className="lg:col-span-3">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative group rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden
                ${dragActive
                  ? "border-cyan-400 bg-cyan-500/20 shadow-2xl shadow-cyan-500/30"
                  : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10 hover:shadow-xl hover:shadow-white/10"
                }`}
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 via-transparent to-cyan-500/0 group-hover:from-teal-500/10 group-hover:to-cyan-500/10 transition-all duration-300" />

              <label className="relative flex flex-col items-center justify-center p-12 sm:p-16 cursor-pointer">
                <div className="text-6xl sm:text-7xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  
                </div>
                <p className="font-bold text-white text-center text-xl sm:text-2xl mb-2">
                  Click to upload or drag & drop
                </p>
                <p className="text-white/60 text-center text-sm sm:text-base">
                  PNG, JPG or WebP • Max 10MB
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  aria-label="Upload screenshot"
                />
              </label>
            </div>
          </div>

          {/* Preview/Status Area */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-8 shadow-2xl h-full flex flex-col">
              {image ? (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-black/30 ring-2 ring-white/10 group">
                    <img
                      src={image}
                      alt="Uploaded screenshot"
                      className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="bg-white/10 backdrop-blur p-3 rounded-lg border border-white/20">
                    <p className="text-xs text-white/70 truncate">📄 {fileName}</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsAnalyzing(true);
                      setTimeout(() => setIsAnalyzing(false), 2000);
                    }}
                    className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-extrabold py-3 rounded-lg hover:shadow-lg hover:shadow-teal-500/40 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <span className="animate-spin">⚙️</span> Analyzing...
                      </>
                    ) : (
                      <>
                        ⚡ Analyze Now
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setImage(null);
                      setFileName("");
                    }}
                    className="w-full border-2 border-white/20 text-white/80 font-bold py-2.5 rounded-lg hover:bg-white/10 transition-all duration-300"
                  >
                    Clear & Upload New
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-center">
                  <div className="text-5xl mb-3 animate-bounce" style={{ animationDelay: "0s" }}>
                    ⚡
                  </div>
                  <p className="font-bold text-white text-lg mb-2">
                    Ready to analyze
                  </p>
                  <p className="text-white/60 text-sm">
                    Upload a screenshot to get started with AI insights
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="group rounded-xl border border-white/20 bg-white/5 backdrop-blur p-6 hover:bg-white/10 transition-all duration-300">
            <p className="text-2xl mb-2">🎯</p>
            <p className="font-bold text-white mb-1">Instant Results</p>
            <p className="text-sm text-white/60">Get analysis in under 2 seconds</p>
          </div>
          <div className="group rounded-xl border border-white/20 bg-white/5 backdrop-blur p-6 hover:bg-white/10 transition-all duration-300">
            <p className="text-2xl mb-2">📊</p>
            <p className="font-bold text-white mb-1">Detailed Metrics</p>
            <p className="text-sm text-white/60">Rankings, stats, and recommendations</p>
          </div>
          <div className="group rounded-xl border border-white/20 bg-white/5 backdrop-blur p-6 hover:bg-white/10 transition-all duration-300">
            <p className="text-2xl mb-2">🔒</p>
            <p className="font-bold text-white mb-1">Privacy First</p>
            <p className="text-sm text-white/60">Your data stays secure and private</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyzeScreenshot;
