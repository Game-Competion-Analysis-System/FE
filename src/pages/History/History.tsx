import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Clock, FileText, ShieldAlert, Trophy,
  ChevronDown, BarChart3, Sparkles, Search,
  TrendingUp, Medal, Swords, Users, Building2, Hash, Trash2
} from "lucide-react";
import FallBeamBackground from "@/components/lightswind/fall-beam-background";
import { ApiError, getAuthToken, getAuthUser } from "@/lib/api";
import { getAnalysisMeta } from "@/lib/analysisMeta";
import { fetchGames } from "@/lib/games";
import { toast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import { deleteHistory, readHistory } from "./crud";
import type { AnalysisItem, LeaderboardEntry } from "./types";

const parseApiDate = (raw: string): Date | null => {
  const s = raw.trim();
  if (!s) return null;

  // If backend returns an ISO string without timezone (e.g. 2026-03-13T01:49:00),
  // assume it's UTC and append "Z" so the UI shows correct local time.
  const looksIsoWithoutZone =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?$/.test(s) &&
    !/[zZ]$/.test(s) &&
    !/[+-]\d{2}:\d{2}$/.test(s);

  const isoUtc = looksIsoWithoutZone ? `${s}Z` : s;
  const d = new Date(isoUtc);
  if (isNaN(d.getTime())) return null;
  return d;
};

const formatDate = (s: string) => {
  const d = parseApiDate(s);
  if (!d) return "N/A";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });
};

const formatScore = (score: number) => {
  if (score === 0) return "—";
  return score.toLocaleString("vi-VN");
};

const rankMedal = (rank: number) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
};

const rankBadgeStyle = (rank: number) => {
  if (rank === 1) return "bg-gradient-to-br from-amber-300/90 to-yellow-400/80 text-amber-950 ring-1 ring-amber-200/30 shadow-md shadow-amber-500/10";
  if (rank === 2) return "bg-gradient-to-br from-slate-200/90 to-gray-300/80 text-slate-900 ring-1 ring-white/25 shadow-md shadow-white/5";
  if (rank === 3) return "bg-gradient-to-br from-orange-300/90 to-amber-500/80 text-amber-950 ring-1 ring-orange-200/25 shadow-md shadow-orange-500/10";
  return "bg-white/[0.06] text-gray-300 ring-1 ring-white/[0.10]";
};

const hasGuildData = (entries: LeaderboardEntry[]) =>
  entries.some(e => e.guildName !== null);

const getRole = (u: unknown): string | null => {
  if (!u || typeof u !== "object") return null;
  const obj = u as Record<string, unknown>;
  const role = obj.Role ?? obj.role;
  return typeof role === "string" && role.trim() ? role.trim().toLowerCase() : null;
};

const GAME_NAMES: Record<string, string> = {
  vlk2: "VLTK 2.0",
  "vlk-mobile": "VLTK Mobile",
};

const getGameDisplayName = (game: string | null) => {
  if (!game) return null;
  return GAME_NAMES[game] ?? game;
};

// ── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="rounded-3xl border border-white/[0.06] bg-white/[0.04] shadow-sm overflow-hidden animate-pulse">
    <div className="px-6 py-5 flex items-center gap-5">
      <div className="w-10 h-10 rounded-2xl bg-white/[0.08] shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-white/[0.08] rounded-full w-2/5" />
        <div className="h-3 bg-white/[0.06] rounded-full w-3/5" />
      </div>
      <div className="w-16 h-6 rounded-full bg-white/[0.06]" />
    </div>
  </div>
);

// ── Component ────────────────────────────────────────────────────────────────

const History = () => {
  const navigate = useNavigate();
  const pageSize = 10;
  const [items, setItems] = useState<AnalysisItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [gamesById, setGamesById] = useState<Map<number, string>>(new Map());
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const isAdmin = getRole(getAuthUser()) === "admin";

  useEffect(() => {
    if (!getAuthToken()) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    const controller = new AbortController();

    fetchGames({ signal: controller.signal })
      .then((list) => {
        const map = new Map<number, string>();
        for (const g of list) {
          const name = g.gameName?.trim();
          if (name) map.set(g.gameId, name);
        }
        setGamesById(map);
      })
      .catch(() => {
        // ignore: History can still render using other fallbacks
      });

    return () => controller.abort();
  }, []);

  const resolveBeGameName = useMemo(() => {
    return (raw: string | null): string | null => {
      const v = raw?.trim();
      if (!v) return null;
      const id = Number(v);
      if (!Number.isFinite(id)) return null;
      return gamesById.get(id) ?? null;
    };
  }, [gamesById]);

  const handleDelete = async (analysisId: number) => {
    setDeletingId(analysisId);
    setError(null);
    try {
      await deleteHistory(analysisId);
      setItems((prev) => (prev ? prev.filter((i) => i.analysisId !== analysisId) : prev));
      setOpenId((prev) => (prev === analysisId ? null : prev));
      toast.success({
        title: "Record deleted",
        description: `#${analysisId}`,
      });
    } catch (e: unknown) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        navigate("/login");
        return;
      }
      const msg = e instanceof Error ? e.message : "Delete failed";
      setError(msg);
      toast.destructive({
        title: "Delete failed",
        description: msg,
      });
    } finally {
      setDeletingId((prev) => (prev === analysisId ? null : prev));
      setConfirmDeleteId((prev) => (prev === analysisId ? null : prev));
    }
  };

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const list = await readHistory();
        setItems(list);
      } catch (e: unknown) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          navigate("/login");
          return;
        }
        const msg = e instanceof Error ? e.message : "Failed to load history";
        setError(msg);
        toast.destructive({
          title: "Failed to load history",
          description: msg,
        });
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [navigate]);

  const sorted = useMemo(
    () => [...(items ?? [])].sort((a, b) => b.analysisId - a.analysisId),
    [items]
  );

  const metaGameNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const item of items ?? []) {
      const meta = getAnalysisMeta(item.analysisId);
      const name = meta?.gameName?.trim();
      if (name) map.set(item.analysisId, name);
    }
    return map;
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(item =>
      (metaGameNameById.get(item.analysisId) ?? "").toLowerCase().includes(q) ||
      (resolveBeGameName(item.gameName) ?? "").toLowerCase().includes(q) ||
      (getGameDisplayName(item.gameName) ?? "").toLowerCase().includes(q) ||
      (item.gameName ?? "").toLowerCase().includes(q) ||
      (item.serverName ?? "").toLowerCase().includes(q) ||
      (item.eventName ?? "").toLowerCase().includes(q) ||
      String(item.analysisId).includes(q) ||
      item.leaderboard.some(e => e.playerName.toLowerCase().includes(q))
    );
  }, [sorted, search, metaGameNameById, resolveBeGameName]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / pageSize)),
    [filtered.length, pageSize]
  );

  useEffect(() => {
    setPage((prev) => Math.min(Math.max(1, prev), totalPages));
  }, [totalPages]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const stats = useMemo(() => ({
    total: sorted.length,
    withData: sorted.filter(i => i.leaderboard.length > 0).length,
    totalPlayers: sorted.reduce((acc, i) => acc + i.leaderboard.length, 0),
  }), [sorted]);

  return (
    <div className="min-h-screen relative bg-[#0a0e1a] overflow-hidden">
      <ConfirmDialog
        open={confirmDeleteId != null}
        title={confirmDeleteId != null ? `Delete record #${confirmDeleteId}?` : "Delete record?"}
        description="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isBusy={confirmDeleteId != null && deletingId === confirmDeleteId}
        onClose={() => {
          if (deletingId != null) return;
          setConfirmDeleteId(null);
        }}
        onConfirm={() => {
          const id = confirmDeleteId;
          if (id == null) return;
          if (!isAdmin) {
            toast.warning({
              title: "Permission denied",
              description: "Only admins can delete history records.",
            });
            setConfirmDeleteId(null);
            return;
          }
          handleDelete(id);
        }}
      />
      {/* ── Ambient background ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-teal-500/15 to-cyan-500/10 blur-[120px]" />
        <div className="absolute top-1/2 -left-60 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/8 blur-[110px]" />
        <div className="absolute bottom-0 right-1/4 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-violet-500/8 to-fuchsia-500/5 blur-[110px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
      <FallBeamBackground lineCount={8} beamColorClass="cyan-400" />

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0a0e1a]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          {!isAdmin ? (
            <button
              onClick={() => navigate(-1)}
              className="group inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-gray-300 hover:bg-white/[0.08] hover:text-white hover:border-teal-500/30 transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back
            </button>
          ) : null}
          <div className="flex-1" />
          <Link
            to="/dashboard"
            className="group inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-gray-300 hover:bg-white/[0.08] hover:text-white hover:border-teal-500/30 transition-all duration-300"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <Link
            to="/game-selection"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-500/20 hover:brightness-105 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            New Analysis
          </Link>
        </div>
      </header>

      <div className="relative z-20 max-w-7xl mx-auto px-6 py-10 lg:py-14">

        {/* ── Hero ── */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-teal-200 text-xs font-black mb-4 shadow-sm">
            <Clock className="w-4 h-4 text-teal-300" />
            Analysis History
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight leading-none">
            Your Records
          </h1>
          <p className="mt-3 text-gray-400 font-medium">
            {isLoading ? "Loading…" : `${sorted.length} total · showing ${paged.length} of ${filtered.length}`}
          </p>
        </div>

        {/* ── Stats ── */}
        {!isLoading && sorted.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { icon: <FileText className="w-5 h-5 text-teal-200" />, label: "Total analyses", value: stats.total, bg: "from-teal-500/10 to-cyan-500/5", iconBg: "bg-teal-500/10 border border-teal-500/20" },
              { icon: <TrendingUp className="w-5 h-5 text-cyan-200" />, label: "With results", value: stats.withData, bg: "from-cyan-500/10 to-blue-500/5", iconBg: "bg-cyan-500/10 border border-cyan-500/20" },
              { icon: <Medal className="w-5 h-5 text-amber-200" />, label: "Total players", value: stats.totalPlayers, bg: "from-amber-500/10 to-orange-500/5", iconBg: "bg-amber-500/10 border border-amber-500/20" },
            ].map(stat => (
              <div
                key={stat.label}
                className={`rounded-3xl border border-white/[0.06] bg-gradient-to-br ${stat.bg} px-5 py-4 flex items-center gap-4 backdrop-blur-sm`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${stat.iconBg}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-2xl font-black text-white tabular-nums">{stat.value}</p>
                  <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Search ── */}
        {!isLoading && sorted.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by game, server, event, player…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-14 py-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm text-sm font-semibold text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/30 shadow-sm transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 hover:text-white transition"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-200 flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-red-300" />
            <div>
              <p className="font-bold text-red-100">Unable to load history</p>
              <p className="text-red-200/80 text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ── List ── */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/[0.10] bg-white/[0.03] p-16 text-center">
            <Trophy className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="font-bold text-gray-300">
              {search ? "No results found" : "No analysis history yet."}
            </p>
            {search && (
              <button onClick={() => setSearch("")} className="mt-3 text-sm text-teal-300 font-semibold hover:underline">
                Clear filter
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {paged.map((item) => {
              const isOpen = openId === item.analysisId;
              const hasLeaderboard = item.leaderboard.length > 0;
              const showGuild = hasGuildData(item.leaderboard);
              // Display name priority: BE gameName (by id) → meta gameName → API gameName → fallback
              const metaGameName = metaGameNameById.get(item.analysisId) ?? null;
              const beGameName = resolveBeGameName(item.gameName);
              const gameDisplayName = beGameName ?? metaGameName ?? getGameDisplayName(item.gameName);
              const displayName = gameDisplayName ?? item.gameName ?? "Unknown";
              const top1 = item.leaderboard.find(e => e.rank === 1);

              return (
                <div
                  key={item.analysisId}
                  className="rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm shadow-sm hover:shadow-md hover:border-teal-500/30 transition-all duration-300 overflow-hidden"
                >
                  {/* ── Summary Row ── */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setOpenId(isOpen ? null : item.analysisId)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setOpenId(isOpen ? null : item.analysisId);
                      }
                    }}
                    className="w-full text-left px-6 py-5 flex items-center gap-4"
                  >
                    <div className="shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-200 text-white">
                      <Trophy className="w-[18px] h-[18px]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <p className="font-black text-white text-base truncate" title={displayName}>
                          {displayName}
                        </p>
                        <span className="text-xs text-gray-500 font-semibold shrink-0">#{item.analysisId}</span>
                      </div>
                      <div className="mt-1.5 flex items-center flex-wrap gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3 text-gray-500" />
                          {formatDate(item.processedTime)}
                        </span>
                        {item.serverName && (
                          <span className="text-xs font-semibold text-teal-200 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full">
                            {item.serverName}
                          </span>
                        )}
                        {item.eventName && item.eventName !== displayName && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-200 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                            <Swords className="w-3 h-3" />
                            {item.eventName}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Users className="w-3 h-3" />
                          {item.leaderboard.length} players
                        </span>
                      </div>
                    </div>

                    {/* Top 1 quick preview */}
                    {top1 && (
                      <div className="hidden sm:flex flex-col items-end shrink-0 gap-0.5">
                        <span className="text-[10px] text-gray-500 font-semibold">🏆 #1</span>
                        <span className="text-sm font-black text-gray-200 truncate max-w-[130px]">{top1.playerName}</span>
                        {top1.score > 0 && (
                          <span className="text-xs font-bold text-teal-300 tabular-nums">{formatScore(top1.score)}</span>
                        )}
                      </div>
                    )}

                    {!hasLeaderboard && (
                      <span className="shrink-0 text-xs font-bold px-3 py-1 rounded-full border bg-white/[0.04] border-white/[0.08] text-gray-400">
                        No data
                      </span>
                    )}

                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(item.analysisId);
                        }}
                        disabled={deletingId === item.analysisId}
                        className={`shrink-0 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                          deletingId === item.analysisId
                            ? "border-white/[0.08] bg-white/[0.04] text-gray-500 cursor-not-allowed"
                            : "border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/15 hover:border-red-500/40"
                        }`}
                        aria-label={`Delete history ${item.analysisId}`}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">{deletingId === item.analysisId ? "Deleting..." : "Delete"}</span>
                      </button>
                    ) : null}

                    <ChevronDown
                      className={`shrink-0 w-4 h-4 text-teal-300 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </div>

                  {/* ── Expanded Body ── */}
                  {isOpen && (
                    <div className="px-6 pb-6 border-t border-white/[0.06] bg-white/[0.02]">

                      {/* Meta chips */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {gameDisplayName && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-gray-200 shadow-sm">
                            <Trophy className="w-3 h-3 text-teal-300" />
                            {gameDisplayName}
                          </div>
                        )}
                        {item.serverName && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-gray-200 shadow-sm">
                            <Hash className="w-3 h-3 text-cyan-300" />
                            {item.serverName}
                          </div>
                        )}
                        {item.eventName && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-gray-200 shadow-sm">
                            <Swords className="w-3 h-3 text-purple-300" />
                            {item.eventName}
                          </div>
                        )}
                        {item.imageUrl && (
                          <a
                            href={item.imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="group inline-flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-2 py-2 shadow-sm hover:border-teal-500/30 transition"
                            title="Open image in new tab"
                          >
                            <img
                              src={item.imageUrl}
                              alt={`Screenshot #${item.analysisId}`}
                              loading="lazy"
                              className="h-10 w-16 rounded-lg object-cover bg-white/[0.06] ring-1 ring-white/[0.10]"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                            <span className="text-xs font-semibold text-gray-300 group-hover:text-teal-200 transition">
                              View image
                            </span>
                          </a>
                        )}
                      </div>

                      {/* Leaderboard table */}
                      {hasLeaderboard ? (
                        <div className="mt-4 rounded-2xl border border-white/[0.08] overflow-hidden shadow-sm bg-white/[0.02]">
                          <div className="px-5 py-3 bg-gradient-to-r from-teal-600 to-cyan-500 flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-white/90" />
                            <p className="text-xs font-black text-white tracking-wide uppercase">Leaderboard</p>
                            <span className="ml-auto text-xs text-white/70 font-semibold">{item.leaderboard.length} players</span>
                          </div>

                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-xs font-bold text-gray-400 bg-white/[0.03] border-b border-white/[0.06]">
                                <th className="px-4 py-3 text-left w-14">Rank</th>
                                <th className="px-4 py-3 text-left">Player</th>
                                {showGuild && (
                                  <th className="px-4 py-3 text-left hidden sm:table-cell">Guild</th>
                                )}
                                <th className="px-4 py-3 text-right">Score</th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.leaderboard
                                .slice()
                                .sort((a, b) => a.rank - b.rank)
                                .map(entry => {
                                  const medal = rankMedal(entry.rank);
                                  const isTop3 = entry.rank <= 3;
                                  return (
                                    <tr
                                      key={entry.rank}
                                      className={`border-t border-white/[0.06] transition-colors ${
                                        isTop3 ? "bg-gradient-to-r from-teal-500/10 to-transparent" : "hover:bg-white/[0.03]"
                                      }`}
                                    >
                                      <td className="px-4 py-3">
                                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${rankBadgeStyle(entry.rank)}`}>
                                          {medal ?? entry.rank}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3">
                                        <span className={`font-bold ${isTop3 ? "text-white" : "text-gray-200"}`}>
                                          {entry.playerName}
                                        </span>
                                      </td>
                                      {showGuild && (
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                          {entry.guildName ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-200 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                                              <Building2 className="w-3 h-3" />
                                              {entry.guildName}
                                            </span>
                                          ) : (
                                            <span className="text-xs text-gray-500">—</span>
                                          )}
                                        </td>
                                      )}
                                      <td className="px-4 py-3 text-right">
                                        <span className={`font-black tabular-nums ${entry.score > 0 ? "text-teal-300" : "text-gray-500"}`}>
                                          {formatScore(entry.score)}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-2xl border border-dashed border-white/[0.10] bg-white/[0.02] py-8 flex flex-col items-center gap-2 text-gray-400">
                          <Trophy className="w-6 h-6 text-white/25" />
                          <p className="text-sm font-semibold text-gray-300">No leaderboard data</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && filtered.length > pageSize && (
          <div className="mt-6 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
                page === 1
                  ? "border-white/[0.08] bg-white/[0.04] text-gray-500 cursor-not-allowed"
                  : "border-white/[0.10] bg-white/[0.06] text-gray-200 hover:bg-white/[0.10] hover:text-white"
              }`}
            >
              Prev
            </button>
            <div className="text-xs font-bold text-gray-400">
              Page {page} of {totalPages}
            </div>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
                page >= totalPages
                  ? "border-white/[0.08] bg-white/[0.04] text-gray-500 cursor-not-allowed"
                  : "border-white/[0.10] bg-white/[0.06] text-gray-200 hover:bg-white/[0.10] hover:text-white"
              }`}
            >
              Next
            </button>
          </div>
        )}

        <div className="h-16" />
      </div>
    </div>
  );
};

export default History;
