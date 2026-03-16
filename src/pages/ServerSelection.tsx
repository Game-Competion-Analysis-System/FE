import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, ServerIcon, Sparkles } from "lucide-react";
import UserPageShell from "@/components/UserPageShell";
import { isAllowedGameId, resolveGameName } from "@/lib/games";
import { toast } from "@/hooks/use-toast";
import { apiJson } from "@/lib/api";

type ServerOption = {
  value: string;
  label: string;
};

function normalizeServerOptions(input: unknown): ServerOption[] {
  const raw =
    input && typeof input === "object"
      ? "items" in (input as any)
        ? (input as any).items
        : "data" in (input as any)
          ? (input as any).data
          : input
      : input;
  if (!Array.isArray(raw)) return [];

  const options: ServerOption[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    if (typeof item === "string") {
      const value = item.trim();
      if (!value || seen.has(value)) continue;
      seen.add(value);
      options.push({ value, label: value });
      continue;
    }

    if (item && typeof item === "object") {
      const obj = item as Record<string, unknown>;
      const serverName =
        (typeof obj.serverName === "string" && obj.serverName.trim()) ||
        (typeof obj.ServerName === "string" && obj.ServerName.trim()) ||
        (typeof obj.name === "string" && obj.name.trim()) ||
        (typeof obj.Name === "string" && obj.Name.trim()) ||
        (typeof obj.code === "string" && obj.code.trim()) ||
        (typeof obj.Code === "string" && obj.Code.trim()) ||
        "";

      const serverIdRaw = obj.serverId ?? obj.ServerId ?? obj.id ?? obj.Id;
      const serverId =
        typeof serverIdRaw === "number"
          ? String(serverIdRaw)
          : typeof serverIdRaw === "string" && serverIdRaw.trim()
            ? serverIdRaw.trim()
            : "";

      const gameName =
        (typeof obj.gameName === "string" && obj.gameName.trim()) ||
        (typeof obj.GameName === "string" && obj.GameName.trim()) ||
        "";

      const value = serverId;
      if (!value || seen.has(value)) continue;
      seen.add(value);
      const label = gameName ? `${serverName || value} • ${gameName}` : serverName || value;
      options.push({ value, label });
    }
  }

  return options;
}

const ServerSelection = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("game") || "";
  const [server, setServer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resolvedGameName, setResolvedGameName] = useState<string | null>(null);
  const [servers, setServers] = useState<ServerOption[]>([]);
  const [serversLoading, setServersLoading] = useState(false);
  const [serversError, setServersError] = useState<string | null>(null);

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

  useEffect(() => {
    let isActive = true;

    const loadServers = async () => {
      setServersLoading(true);
      setServersError(null);
      try {
        const data = await apiJson<unknown>("/servers", { method: "GET" });
        const list = normalizeServerOptions(data);
        if (!isActive) return;
        setServers(list);
        if (list.length > 0) {
          setServer((prev) => (prev ? prev : list[0].value));
        }
      } catch (err) {
        if (!isActive) return;
        const message = err instanceof Error ? err.message : "Failed to load servers";
        if (message.toLowerCase() === "canceled") return;
        setServersError(message);
      } finally {
        if (isActive) setServersLoading(false);
      }
    };

    loadServers();
    return () => {
      isActive = false;
    };
  }, []);

  const gameName = gameId ? resolvedGameName ?? "Game" : "Game";

  const handleContinue = () => {
    const trimmed = server.trim();
    if (!gameId) {
      setError("Missing game selection. Please pick a game first.");
      return;
    }
    if (!trimmed) {
      setError("Vui lòng chọn server.");
      return;
    }
    setError(null);
    const selected = servers.find((s) => s.value === trimmed);
    const serverName = selected?.label ? selected.label.split(" • ")[0] : "";
    const serverNameParam = serverName ? `&serverName=${encodeURIComponent(serverName)}` : "";
    navigate(`/analyze?game=${encodeURIComponent(gameId)}&server=${encodeURIComponent(trimmed)}${serverNameParam}`);
  };

  return (
    <UserPageShell
      eyebrow="Server Selection"
      title="Choose the server you are playing on"
      description="Server context helps the analyzer interpret rankings and leaderboard data more accurately before screenshot processing starts."
      backHref="/game-selection"
      actions={
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-teal-200 bg-white/90 px-4 py-2 text-xs font-black text-teal-700 shadow-sm">
          <Sparkles className="h-4 w-4 text-teal-600" />
          {gameName} • Select Server
        </div>
      }
      aside={
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg">
              <ServerIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Game</p>
              <p className="mt-1 text-lg font-black text-slate-950">{gameName}</p>
            </div>
          </div>
          <div className="rounded-3xl border border-teal-100 bg-teal-500/10 p-4">
            <p className="text-sm font-black text-slate-900">Next step</p>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
              After selecting a server, you will continue to the screenshot upload and AI analysis screen.
            </p>
          </div>
        </div>
      }
      contentClassName="max-w-3xl"
    >
      <div className="rounded-[2rem] border border-slate-200 bg-white/85 p-6 shadow-[0_24px_80px_rgba(14,116,144,0.12)] backdrop-blur-sm sm:p-8">
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
            <label htmlFor="server" className="mb-2 block text-sm font-black text-gray-800">
              Server
            </label>
            {serversLoading ? (
              <div className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm font-semibold text-gray-600">
                Đang tải danh sách server...
              </div>
            ) : serversError ? (
              <div className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-700">
                {serversError}
              </div>
            ) : (
              <select
                id="server"
                value={server}
                onChange={(e) => setServer(e.target.value)}
                className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white outline-none transition-all duration-200 text-gray-800 font-medium"
              >
                <option value="">Chọn server</option>
                {servers.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            )}
            {!serversLoading && !serversError ? (
              <p className="mt-2 text-xs text-gray-600 font-medium">
                Chọn server có sẵn từ danh sách.
              </p>
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-6">
            <button
              onClick={handleContinue}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-3 text-sm font-black text-white shadow-xl shadow-teal-500/15 transition hover:shadow-teal-500/25"
            >
              Continue
              <ArrowRight className="w-6 h-6" />
            </button>
            <p className="text-sm font-medium text-slate-500">
              Current options: {serversLoading ? "loading" : servers.length}
            </p>
          </div>
      </div>
    </UserPageShell>
  );
};

export default ServerSelection;

