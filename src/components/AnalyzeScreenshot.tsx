import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  FileImage,
  Loader2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import FallBeamBackground from "@/components/lightswind/fall-beam-background";
import { ApiError, apiForm } from "@/lib/api";
import { normalizeAiAnalysis, toConfidencePercent } from "@/lib/ai";
import { saveAnalysisMeta } from "@/lib/analysisMeta";
import { normalizeAnalysisItem } from "@/pages/History/normalize";

interface AnalyzeScreenshotProps {
  onBack: () => void;
  selectedGame?: string;
  server?: string;
  serverName?: string;
  gameName?: string;
}

const AnalyzeScreenshot = ({ onBack, selectedGame, server, serverName, gameName }: AnalyzeScreenshotProps) => {
  const navigate = useNavigate();
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<unknown>(null);

  const processFile = (nextFile: File) => {
    setError(null);
    setAnalysisResult(null);
    setFile(nextFile);
    setFileName(nextFile.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
    };
    reader.readAsDataURL(nextFile);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = e.target.files?.[0];
    if (nextFile && nextFile.type.startsWith("image/")) processFile(nextFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const nextFile = e.dataTransfer.files?.[0];
    if (nextFile && nextFile.type.startsWith("image/")) processFile(nextFile);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleClear = () => {
    setImage(null);
    setFile(null);
    setFileName("");
    setError(null);
    setAnalysisResult(null);
  };

  const handleAnalyze = async () => {
    setError(null);
    setAnalysisResult(null);

    if (!file) {
      setError("Please upload an image first.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const form = new FormData();
      form.append("file", file);
      if (selectedGame) form.append("selectedGame", selectedGame);
      if (server && server.trim().length) form.append("server", server.trim());

      const result = await apiForm<unknown>("/ai/analyze", form);
      const normalized = normalizeAiAnalysis(result);
      if (normalized.analysisId != null) {
        const gameId = selectedGame?.trim() ? selectedGame.trim() : null;
        const trimmedGameName = gameName?.trim() ? gameName.trim() : null;
        const resolvedGameName = trimmedGameName && trimmedGameName !== "Game" ? trimmedGameName : null;
        const resolvedServerName = serverName?.trim() ? serverName.trim() : null;
        saveAnalysisMeta(normalized.analysisId, {
          gameId,
          gameName: resolvedGameName,
          server: server?.trim() ? server.trim() : null,
          serverId: server?.trim() ? server.trim() : null,
          serverName: resolvedServerName,
        });
      }
      setAnalysisResult(result);
    } catch (e: unknown) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        setError("Please login to analyze screenshots.");
        navigate("/login");
        return;
      }
      const message = e instanceof Error ? e.message : "Analyze failed";
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const derived = useMemo(() => {
    if (!analysisResult) return null;
    const normalized = normalizeAiAnalysis(analysisResult);
    const history = normalizeAnalysisItem(analysisResult, 0);
    return {
      ...normalized,
      analysisId: normalized.analysisId ?? history.analysisId,
      processedTime: normalized.processedTime ?? history.processedTime,
      confidencePct: toConfidencePercent(normalized.confidenceScore),
      leaderboard: history.leaderboard,
    };
  }, [analysisResult]);

  const trimmedGameName = gameName?.trim() ? gameName.trim() : null;
  const displayGameName = trimmedGameName && trimmedGameName !== "Game" ? trimmedGameName : null;

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 overflow-hidden">
      <FallBeamBackground lineCount={14} beamColorClass="cyan-400" />

      <header className="sticky top-0 z-30 border-b border-gray-200/70 bg-white/75 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white/90 px-4 py-2 text-sm font-bold text-gray-800 hover:bg-white transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <button
            type="button"
            onClick={() => navigate("/history")}
            aria-label="History"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white/90 px-4 py-2 text-sm font-bold text-gray-800 hover:bg-white hover:border-teal-200 transition shadow-sm"
          >
            <Clock className="w-4 h-4 text-teal-600" />
            <span className="hidden sm:inline">History</span>
          </button>

          <div className="ml-auto text-sm font-black text-teal-800/80 hidden sm:flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            {displayGameName ? `${displayGameName} • Analysis` : "VLK Analyzer • Screenshot Analysis"}
          </div>
        </div>
      </header>

      <div className="relative z-20 max-w-7xl mx-auto px-6 py-10 lg:py-14">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-black tracking-wide shadow-lg">
            <Sparkles className="w-4 h-4" />
            GAME ANALYSIS ENGINE
            {displayGameName ? ` • ${displayGameName}` : null}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-3 leading-tight">
            Upload & Analyze
          </h1>
          <p className="text-gray-700 text-lg sm:text-xl max-w-2xl font-medium">
            Drop your {gameName || "Võ Lâm"} screenshot and get instant AI-powered insights. Rankings, strategy
            recommendations, and detailed stats in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={[
                "relative rounded-3xl border-2 border-dashed transition-all duration-200 overflow-hidden",
                dragActive ? "border-cyan-400 bg-cyan-50" : "border-teal-200 bg-white/75 hover:bg-white/90",
              ].join(" ")}
            >
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-teal-200/20 via-transparent to-cyan-200/20" />

              <label className="relative block cursor-pointer p-10 sm:p-14">
                <div className="flex items-start gap-5">
                  <div className="shrink-0 rounded-3xl bg-gradient-to-br from-teal-600 to-cyan-600 p-4 shadow-xl shadow-teal-500/15">
                    <UploadCloud className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xl sm:text-2xl font-black text-gray-900">Click to upload or drag & drop</p>
                    <p className="mt-2 text-gray-600 font-medium">
                      PNG, JPG, WebP. Keep it under 2MB (API limit).
                    </p>
                    {fileName ? (
                      <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-800 shadow-sm">
                        <FileImage className="w-4 h-4 text-teal-600" />
                        <span className="truncate max-w-[22rem]">{fileName}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  aria-label="Upload screenshot"
                />
              </label>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                <span>{error}</span>
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-gray-200 bg-white/80 backdrop-blur-sm p-6 shadow-xl">
              {image ? (
                <div className="space-y-4">
                  <div className="rounded-2xl overflow-hidden bg-gray-100 ring-1 ring-gray-200">
                    <img src={image} alt="Uploaded screenshot" className="w-full h-auto object-contain" />
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-3 text-sm font-black text-white shadow-xl shadow-teal-500/15 hover:shadow-teal-500/25 transition disabled:opacity-70"
                    >
                      {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {isAnalyzing ? "Analyzing..." : "Analyze Now"}
                    </button>

                    <button
                      onClick={handleClear}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-black text-gray-800 hover:bg-gray-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear & Upload New
                    </button>
                  </div>

                  {analysisResult ? (
                    <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-gray-500 font-black">Analysis Saved</p>
                          <p className="text-gray-900 font-black text-lg leading-tight">
                            {derived?.analysisId ? `#${derived.analysisId}` : "Result"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-black text-teal-800">
                          {derived?.confidencePct !== null && derived?.confidencePct !== undefined
                            ? `${derived.confidencePct}% confidence`
                            : "Confidence n/a"}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                          <p className="text-[11px] text-gray-600 font-black">Model</p>
                          <p className="mt-1 text-sm text-gray-900 font-black inline-flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-teal-600" />
                            {derived?.aiModelVersion ?? "n/a"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                          <p className="text-[11px] text-gray-600 font-black">Processed</p>
                          <p className="mt-1 text-sm text-gray-900 font-black">{derived?.processedTime ?? "n/a"}</p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs font-black text-gray-700">Results</p>
                        {derived?.leaderboard?.length ? (
                          <div className="mt-3 overflow-auto">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="text-gray-600 font-black">
                                  <th className="py-2 pr-3 w-16">Rank</th>
                                  <th className="py-2 pr-3">Player</th>
                                  {derived.leaderboard.some((e) => e.guildName) ? (
                                    <th className="py-2 pr-3 hidden sm:table-cell">Guild</th>
                                  ) : null}
                                  <th className="py-2 text-right w-28">Score</th>
                                </tr>
                              </thead>
                              <tbody className="text-gray-800 font-medium">
                                {derived.leaderboard
                                  .slice()
                                  .sort((a, b) => a.rank - b.rank)
                                  .map((entry) => (
                                    <tr key={entry.rank} className="border-t border-gray-200">
                                      <td className="py-2 pr-3 whitespace-nowrap font-black text-gray-900">{entry.rank}</td>
                                      <td className="py-2 pr-3">{entry.playerName || "n/a"}</td>
                                      {derived.leaderboard.some((e) => e.guildName) ? (
                                        <td className="py-2 pr-3 hidden sm:table-cell">{entry.guildName ?? "—"}</td>
                                      ) : null}
                                      <td className="py-2 text-right whitespace-nowrap font-black text-teal-700 tabular-nums">
                                        {entry.score ? entry.score.toLocaleString("vi-VN") : "—"}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        ) : derived?.extractedFields?.length ? (
                          <div className="mt-3 overflow-auto">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="text-gray-600 font-black">
                                  <th className="py-2 pr-3">Field</th>
                                  <th className="py-2 pr-3">Text</th>
                                  <th className="py-2">Confidence</th>
                                </tr>
                              </thead>
                              <tbody className="text-gray-800 font-medium">
                                {derived.extractedFields.map((f, idx) => {
                                  const pct = toConfidencePercent(f.confidence);
                                  return (
                                    <tr key={`${f.fieldType ?? "field"}-${idx}`} className="border-t border-gray-200">
                                      <td className="py-2 pr-3 whitespace-nowrap font-black text-gray-900">
                                        {f.fieldType ?? "n/a"}
                                      </td>
                                      <td className="py-2 pr-3">{f.rawText ?? "n/a"}</td>
                                      <td className="py-2 whitespace-nowrap">{pct === null ? "n/a" : `${pct}%`}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-gray-600 font-medium">
                            No results extracted. Try a clearer screenshot (crop to the leaderboard area) and re-upload.
                          </p>
                        )}
                      </div>

                      
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5 text-center">
                      <p className="text-gray-900 font-black">Ready to analyze</p>
                      <p className="mt-1 text-sm text-gray-600 font-medium">
                        Upload a screenshot and run analysis.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/10">
                    <UploadCloud className="w-6 h-6 text-white" />
                  </div>
                  <p className="mt-4 text-gray-900 font-black">Upload a screenshot</p>
                  <p className="mt-1 text-sm text-gray-600 font-medium">
                    Then click Analyze to call the API.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyzeScreenshot;
