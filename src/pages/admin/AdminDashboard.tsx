import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Users,
  Minus,
  Trophy,

  Clock,
  Search,
  Zap,
  Star,
  Activity,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import FallBeamBackground from "@/components/lightswind/fall-beam-background";
import { ApiError, getAuthToken } from "@/lib/api";
import { readHistory } from "@/pages/History/crud";

// -- Types --------------------------------------------------------------------

interface LeaderboardEntry {
  rank: number;
  playerName: string;
  score: number;
  guildName: string | null;
}

interface AnalysisItem {
  analysisId: number;
  processedTime: string;
  gameName: string | null;
  serverName: string | null;
  eventName: string | null;
  leaderboard: LeaderboardEntry[];
}

type ChartPoint = {
  analysisId: number;
  ts: number;
  label: string;
  score: number;
  rank: number;
};

// -- Helpers ------------------------------------------------------------------

const fmtScore = (n: number) => n.toLocaleString("vi-VN");

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

// Custom tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as ChartPoint;
  return (
    <div className="rounded-2xl border border-white/20 bg-gray-900/90 backdrop-blur-xl shadow-2xl px-5 py-4 text-sm">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
        <p className="font-black text-white text-lg tabular-nums">{fmtScore(p.score)}</p>
      </div>
      <p className="text-gray-400 text-xs">{p.label} � Analysis #{p.analysisId}</p>
      <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-1.5">
        <Trophy className="w-3 h-3 text-amber-400" />
        <p className="text-amber-400 text-xs font-bold">Rank #{p.rank}</p>
      </div>
    </div>
  );
};

// Card icon map
const statIcons = [
  <Clock className="w-4 h-4" />,
  <Zap className="w-4 h-4" />,
  <TrendingUp className="w-4 h-4" />,
  <Trophy className="w-4 h-4" />,
];
const statGradients = [
  "from-blue-500/10 to-blue-600/5",
  "from-violet-500/10 to-violet-600/5",
  "from-emerald-500/10 to-emerald-600/5",
  "from-amber-500/10 to-amber-600/5",
];
const statIconBg = [
  "bg-blue-500/10 text-blue-600",
  "bg-violet-500/10 text-violet-600",
  "bg-emerald-500/10 text-emerald-600",
  "bg-amber-500/10 text-amber-600",
];

// -- Component ----------------------------------------------------------------

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<AnalysisItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [searchPlayer, setSearchPlayer] = useState<string>("");

  useEffect(() => {
    if (!getAuthToken()) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await readHistory({ pageNumber: 1, pageSize: 200, sortBy: "analysisId", isDescending: true });
        setItems(res.items as AnalysisItem[]);
      } catch (e: unknown) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          navigate("/login");
          return;
        }
        setError(e instanceof Error ? e.message : "Failed to load data");
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [navigate]);

  const players = useMemo(() => {
    const set = new Set<string>();
    for (const item of items ?? []) {
      for (const entry of item.leaderboard ?? []) {
        if (entry.playerName) set.add(entry.playerName);
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, "vi"));
  }, [items]);

  useEffect(() => {
    if (!selectedPlayer && players.length) setSelectedPlayer(players[0]);
  }, [players, selectedPlayer]);

  const filteredPlayers = useMemo(() => {
    const q = searchPlayer.trim().toLowerCase();
    if (!q) return players;
    return players.filter(p => p.toLowerCase().includes(q));
  }, [players, searchPlayer]);

  const series = useMemo((): ChartPoint[] => {
    if (!selectedPlayer) return [];
    const needle = selectedPlayer.trim().toLowerCase();
    const out: ChartPoint[] = [];

    for (const item of items ?? []) {
      const entry = (item.leaderboard ?? []).find(
        e => e.playerName.trim().toLowerCase() === needle
      );
      if (!entry || entry.score === 0) continue;

      const ts = Date.parse(item.processedTime);
      if (!Number.isFinite(ts)) continue;

      out.push({
        analysisId: item.analysisId,
        ts,
        label: format(new Date(ts), "dd/MM HH:mm"),
        score: entry.score,
        rank: entry.rank,
      });
    }

    return out.sort((a, b) => a.ts - b.ts);
  }, [items, selectedPlayer]);

  const scoreDomain = useMemo(() => {
    if (!series.length) return { min: 0, max: 0 };
    const scores = series.map((s) => s.score);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const range = Math.max(1, max - min);
    const pad = Math.max(1000, Math.round(range * 0.5));
    return {
      min: Math.max(0, min - pad),
      max: max + pad,
    };
  }, [series]);

  const monthCompare = useMemo(() => {
    const now = new Date();
    const startThis = new Date(now.getFullYear(), now.getMonth(), 1);
    const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startNext = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    let thisScore = 0;
    let prevScore = 0;

    const needle = selectedPlayer.trim().toLowerCase();

    for (const item of items ?? []) {
      const ts = Date.parse(item.processedTime);
      if (!Number.isFinite(ts)) continue;

      let sumScore = 0;
      if (needle) {
        const entry = (item.leaderboard ?? []).find(
          (e) => e.playerName.trim().toLowerCase() === needle
        );
        if (!entry) continue;
        sumScore = entry.score ?? 0;
      } else {
        for (const entry of item.leaderboard ?? []) {
          sumScore += entry.score ?? 0;
        }
      }

      if (ts >= startThis.getTime() && ts < startNext.getTime()) {
        thisScore += sumScore;
      } else if (ts >= startPrev.getTime() && ts < startThis.getTime()) {
        prevScore += sumScore;
      }
    }

    const delta = thisScore - prevScore;
    const pct = prevScore > 0 ? (delta / prevScore) * 100 : null;
    return { thisScore, prevScore, delta, pct };
  }, [items, selectedPlayer]);

  const leaderboardAgg = useMemo(() => {
    const totals = new Map<string, number>();
    for (const item of items ?? []) {
      for (const entry of item.leaderboard ?? []) {
        const name = entry.playerName?.trim();
        if (!name) continue;
        totals.set(name, (totals.get(name) ?? 0) + (entry.score ?? 0));
      }
    }
    const list = [...totals.entries()]
      .map(([playerName, totalScore]) => ({ playerName, totalScore }))
      .sort((a, b) => b.totalScore - a.totalScore);

    const topPlayer = list[0] ?? null;
    const totalScore = list.reduce((acc, p) => acc + p.totalScore, 0);
    return { list, topPlayer, totalScore };
  }, [items]);

  const stats = useMemo(() => {
    if (series.length < 2) return null;
    const first = series[0].score;
    const last = series[series.length - 1].score;
    const delta = last - first;
    const pct = first > 0 ? (delta / first) * 100 : null;
    const bestRank = Math.min(...series.map(s => s.rank));
    return { first, last, delta, pct, bestRank };
  }, [series]);

  const trendColor =
    !stats ? "text-gray-400"
    : stats.delta > 0 ? "text-emerald-600"
    : stats.delta < 0 ? "text-red-500"
    : "text-gray-500";

  const TrendIcon =
    !stats ? Minus
    : stats.delta > 0 ? TrendingUp
    : stats.delta < 0 ? TrendingDown
    : Minus;

  return (
    <div className="min-h-screen relative bg-[#0a0e1a] overflow-hidden">
      {/* -- Ambient background -- */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-teal-500/15 to-cyan-500/10 blur-[120px]" />
        <div className="absolute top-1/2 -left-60 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/8 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-violet-500/8 to-fuchsia-500/5 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
      <FallBeamBackground lineCount={8} beamColorClass="cyan-400" />

  

      <div className="relative z-20 max-w-7xl mx-auto px-6 py-10 lg:py-14">

        {/* -- Hero Section -- */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="mb-12 flex items-end justify-between gap-8 flex-wrap"
        >
          <motion.div variants={fadeUp} custom={0}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold mb-5 backdrop-blur-sm">
              <Activity className="w-3 h-3" />
              <span>Analytics Dashboard</span>
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[0.9]">
              Combat
              <span className="block bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Analytics
              </span>
            </h1>
            <p className="mt-4 text-gray-500 font-medium flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-gray-600" />
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-teal-500/30 border-t-teal-400 rounded-full animate-spin" />
                  Loading�
                </span>
              ) : (
                <span>{players.length} players � {(items ?? []).length} analyses</span>
              )}
            </p>
          </motion.div>

          {/* Player selector */}
          <motion.div variants={fadeUp} custom={1} className="min-w-[280px] flex-shrink-0">
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
              Player
            </label>
            <div className="relative mb-2.5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input
                type="text"
                placeholder="Search player�"
                value={searchPlayer}
                onChange={e => setSearchPlayer(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/30 backdrop-blur-sm transition-all"
              />
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm overflow-hidden">
              <select
                value={selectedPlayer}
                onChange={e => { setSelectedPlayer(e.target.value); setSearchPlayer(""); }}
                className="w-full bg-transparent px-4 py-2.5 text-sm font-semibold text-gray-200 focus:outline-none focus:ring-0 custom-scrollbar [&>option]:bg-[#1a1f2e] [&>option]:text-gray-200"
                size={Math.min(5, filteredPlayers.length || 1)}
                disabled={!players.length}
              >
                {filteredPlayers.length ? (
                  filteredPlayers.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))
                ) : (
                  <option value="">Not found</option>
                )}
              </select>
            </div>
          </motion.div>
        </motion.div>

        {/* -- Error -- */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/[0.06] backdrop-blur-sm px-5 py-4 text-sm text-red-300 flex items-start gap-3"
            >
              <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0 text-red-400" />
              <div>
                <p className="font-bold text-red-300">Unable to load data</p>
                <p className="text-red-400/70 text-xs mt-1">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* -- Stats Cards -- */}
        <AnimatePresence>
          {stats && (
            <motion.div
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            >
              {[
                { label: "Starting score", value: fmtScore(stats.first), sub: "first recorded value", color: "text-blue-400" },
                { label: "Current score", value: fmtScore(stats.last), sub: "latest value", color: "text-violet-400" },
                {
                  label: "Growth",
                  value: `${stats.delta >= 0 ? "+" : ""}${fmtScore(stats.delta)}`,
                  sub: stats.pct != null ? `${stats.pct >= 0 ? "+" : ""}${stats.pct.toFixed(1)}%` : "",
                  color: trendColor.replace("text-emerald-600", "text-emerald-400").replace("text-red-500", "text-red-400"),
                },
                { label: "Best rank", value: `#${stats.bestRank}`, sub: "best achieved", color: "text-amber-400" },
              ].map((card, i) => (
                <motion.div
                  key={card.label}
                  variants={fadeUp}
                  custom={i}
                  className={`group relative rounded-2xl border border-white/[0.06] bg-gradient-to-br ${statGradients[i]} backdrop-blur-sm p-5 hover:border-white/[0.12] transition-all duration-300 overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{card.label}</p>
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${statIconBg[i]}`}>
                        {statIcons[i]}
                      </div>
                    </div>
                    <p className={`text-2xl lg:text-3xl font-black tabular-nums ${card.color}`}>{card.value}</p>
                    {card.sub && <p className="text-xs text-gray-600 font-medium mt-1">{card.sub}</p>}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* -- Month Compare -- */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-5">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              This month score
            </p>
            <p className="text-3xl font-black text-white tabular-nums mt-2">
              {fmtScore(monthCompare.thisScore)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-5">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              Last month score
            </p>
            <p className="text-3xl font-black text-white tabular-nums mt-2">
              {fmtScore(monthCompare.prevScore)}
            </p>
            <div className="mt-2 text-xs font-bold">
              <span className={
                monthCompare.delta > 0
                  ? "text-emerald-400"
                  : monthCompare.delta < 0
                  ? "text-red-400"
                  : "text-gray-400"
              }>
                {monthCompare.delta >= 0 ? "+" : ""}{fmtScore(monthCompare.delta)}
              </span>
              {monthCompare.pct != null ? (
                <span className="text-gray-500 ml-2">({monthCompare.pct >= 0 ? "+" : ""}{monthCompare.pct.toFixed(1)}%)</span>
              ) : null}
            </div>
          </div>
        </div>

        {/* -- Aggregated Stats -- */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-5">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              Total score (all players)
            </p>
            <p className="text-3xl font-black text-white tabular-nums mt-2">
              {fmtScore(leaderboardAgg.totalScore)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-5">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              Top player
            </p>
            <p className="text-2xl font-black text-white mt-2 truncate">
              {leaderboardAgg.topPlayer?.playerName ?? "—"}
            </p>
            <p className="text-sm text-teal-400 font-bold tabular-nums mt-1">
              {leaderboardAgg.topPlayer ? fmtScore(leaderboardAgg.topPlayer.totalScore) : "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-5">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              Total players
            </p>
            <p className="text-3xl font-black text-white tabular-nums mt-2">
              {leaderboardAgg.list.length}
            </p>
          </div>
        </div>

        {/* -- Chart Card -- */}
        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-500/10">
                <BarChart3 className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                  <p className="text-sm font-bold text-white">
                  {selectedPlayer || "Select a player"}
                  </p>
                {!isLoading && series.length > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">{series.length} data points over time</p>
                )}
              </div>
            </div>
            {stats && (
              <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black border ${
                stats.delta > 0
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : stats.delta < 0
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : "bg-gray-500/10 border-gray-500/20 text-gray-400"
              }`}>
                <TrendIcon className="w-3.5 h-3.5" />
                {stats.delta >= 0 ? "+" : ""}{fmtScore(stats.delta)}
                {stats.pct != null && (
                  <span className="opacity-60 ml-1">({stats.pct >= 0 ? "+" : ""}{stats.pct.toFixed(1)}%)</span>
                )}
              </div>
            )}
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="h-[380px] flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 border-2 border-teal-500/20 border-t-teal-400 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-cyan-500/20 border-b-cyan-400 rounded-full animate-spin" style={{ animationDirection: "reverse" }} />
                  </div>
                </div>
                <p className="text-gray-500 font-medium text-sm">Loading data�</p>
              </div>
            ) : series.length === 0 ? (
              <div className="h-[380px] flex flex-col items-center justify-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-gray-700" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-400 text-sm">
                    {selectedPlayer
                      ? `No data for "${selectedPlayer}"`
                      : "Select a player to view the chart"}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">Data will appear once analyses are available.</p>
                </div>
              </div>
            ) : (
              <div className="h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.3} />
                        <stop offset="50%" stopColor="#06b6d4" stopOpacity={0.1} />
                        <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#14b8a6" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#4b5563" }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={30}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#4b5563" }}
                      axisLine={false}
                      tickLine={false}
                      width={72}
                      tickFormatter={v => Number(v).toLocaleString("vi-VN")}
                      domain={[scoreDomain.min, scoreDomain.max]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="linear"
                      dataKey="score"
                      stroke="url(#strokeGradient)"
                      strokeWidth={2.5}
                      fill="url(#scoreGradient)"
                      dot={{ r: 4, fill: "#14b8a6", strokeWidth: 2, stroke: "#0a0e1a" }}
                      activeDot={{ r: 7, fill: "#14b8a6", stroke: "#0a0e1a", strokeWidth: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </motion.div>

        {/* -- Appearances table -- */}
        <AnimatePresence>
          {series.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-white/[0.06] flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-500/10">
                  <Star className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">History details</p>
                  <p className="text-xs text-gray-500 mt-0.5">{series.length} appearances in the leaderboard</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/[0.04]">
                      <th className="px-6 py-4 text-left">Time</th>
                      <th className="px-6 py-4 text-center">Rank</th>
                      <th className="px-6 py-4 text-right">Score</th>
                      <th className="px-6 py-4 text-right hidden sm:table-cell">Analysis ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...series].reverse().map((pt) => (
                      <tr
                        key={pt.analysisId}
                        className="border-t border-white/[0.03] hover:bg-white/[0.03] transition-colors duration-200"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-500/60" />
                            <span className="text-gray-300 font-medium">{pt.label}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black ${
                            pt.rank === 1
                              ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/20"
                              : pt.rank === 2
                              ? "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800"
                              : pt.rank === 3
                              ? "bg-gradient-to-br from-orange-300 to-orange-400 text-orange-900"
                              : "bg-white/[0.06] text-gray-400 border border-white/[0.06]"
                          }`}>
                            {pt.rank}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-black text-teal-400 tabular-nums">{fmtScore(pt.score)}</span>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600 text-xs hidden sm:table-cell font-mono">
                          #{pt.analysisId}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* -- Leaderboard Table -- */}
        <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-white/[0.06] flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-500/10">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Leaderboard (Total Score)</p>
              <p className="text-xs text-gray-500 mt-0.5">Top players by total score</p>
            </div>
          </div>
          {leaderboardAgg.list.length === 0 ? (
            <div className="p-8 text-gray-500 text-sm">No leaderboard data.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/[0.04]">
                    <th className="px-6 py-4 text-left">Rank</th>
                    <th className="px-6 py-4 text-left">Player</th>
                    <th className="px-6 py-4 text-right">Total Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardAgg.list.slice(0, 10).map((row, idx) => (
                    <tr
                      key={row.playerName}
                      className="border-t border-white/[0.03] hover:bg-white/[0.03] transition-colors duration-200"
                    >
                      <td className="px-6 py-4 font-black text-gray-300">#{idx + 1}</td>
                      <td className="px-6 py-4 text-gray-200 font-semibold">{row.playerName}</td>
                      <td className="px-6 py-4 text-right font-black text-teal-400 tabular-nums">
                        {fmtScore(row.totalScore)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="h-20" />
      </div>
    </div>
  );
};

export default AdminDashboard;
