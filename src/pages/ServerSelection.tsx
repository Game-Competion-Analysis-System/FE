import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import FallBeamBackground from "@/components/lightswind/fall-beam-background";
import { isAllowedGameId, resolveGameName } from "@/lib/games";
import { toast } from "@/hooks/use-toast";

const ServerSelection = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("game") || "";
  const [server, setServer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resolvedGameName, setResolvedGameName] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;
    const n = Number(gameId);
    if (!Number.isFinite(n) || !isAllowedGameId(n)) {
      toast.warning({
        title: "Game không hỗ trợ",
        description: "Vui lòng chọn lại game trong danh sách.",
      });
      navigate("/game-selection");
    }
  }, [gameId, navigate]);

  useEffect(() => {
    if (!gameId) return;

    const controller = new AbortController();
    resolveGameName(gameId, { signal: controller.signal })
      .then((name) => setResolvedGameName(name ?? null))
      .catch(() => setResolvedGameName(null));

    return () => controller.abort();
  }, [gameId]);

  const gameName = gameId ? resolvedGameName ?? "Game" : "Game";

  const handleContinue = () => {
    const trimmed = server.trim();
    if (!gameId) {
      setError("Missing game selection. Please pick a game first.");
      return;
    }
    if (!trimmed) {
      setError("Please enter your server.");
      return;
    }
    setError(null);
    navigate(`/analyze?game=${encodeURIComponent(gameId)}&server=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 overflow-hidden">
      <FallBeamBackground lineCount={12} beamColorClass="cyan-400" />

      <header className="sticky top-0 z-30 border-b border-gray-200/70 bg-white/75 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/game-selection")}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white/90 px-4 py-2 text-sm font-bold text-gray-800 hover:bg-white transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="ml-auto text-sm font-black text-teal-800/80 hidden sm:flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            {gameName} • Select Server
          </div>
        </div>
      </header>

      <div className="relative z-20 max-w-3xl mx-auto px-6 py-10 lg:py-14">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-black tracking-wide shadow-lg">
            SELECT SERVER
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight">Server đang chơi</h1>
          <p className="mt-3 text-gray-700 text-lg font-medium">
            Nhập server bạn đang chơi để hệ thống có thêm ngữ cảnh khi phân tích.
          </p>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white/85 backdrop-blur-sm shadow-xl p-6 sm:p-8">
          {!gameId ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
              Bạn chưa chọn game. Quay lại{" "}
              <Link to="/game-selection" className="underline">
                Game Selection
              </Link>
              .
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6">
            <label htmlFor="server" className="block text-sm font-black text-gray-800 mb-2">
              Server
            </label>
            <input
              id="server"
              value={server}
              onChange={(e) => setServer(e.target.value)}
              placeholder="Ví dụ: S1 Thiên Vương / S5 ..."
              className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white outline-none transition-all duration-200 text-gray-800 font-medium"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleContinue();
              }}
            />
            <p className="mt-2 text-xs text-gray-600 font-medium">
              Bạn có thể nhập tên server hoặc mã server tuỳ theo game.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleContinue}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-3 text-sm font-black text-white shadow-xl shadow-teal-500/15 hover:shadow-teal-500/25 transition"
            >
              Continue
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerSelection;
