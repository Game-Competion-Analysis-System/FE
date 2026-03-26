import { useEffect, useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import UserPageShell from "@/components/UserPageShell";
import { apiJson } from "@/lib/api";

type PlayerItem = {
  playerId: number;
  playerName: string;
  guildName: string | null;
  latestScore: number | null;
  latestRank: number | null;
  serverName: string | null;
};

type PlayersResponse = {
  items: PlayerItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

const normalizePlayers = (payload: unknown): PlayersResponse => {
  if (Array.isArray(payload)) {
    const items: PlayerItem[] = payload
      .map((it: any) => ({
        playerId: Number(it.playerId ?? it.id ?? 0),
        playerName: String(it.playerName ?? it.name ?? ""),
        guildName: typeof it.guildName === "string" ? it.guildName : null,
        latestScore: typeof it.latestScore === "number" ? it.latestScore : it.latestScore != null ? Number(it.latestScore) : null,
        latestRank: typeof it.latestRank === "number" ? it.latestRank : it.latestRank != null ? Number(it.latestRank) : null,
        serverName: typeof it.serverName === "string" ? it.serverName : null,
      }))
      .filter((p: PlayerItem) => p.playerId && p.playerName);

    return {
      items,
      totalCount: items.length,
      pageNumber: 1,
      pageSize: items.length,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    };
  }

  const obj = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const itemsRaw = Array.isArray((obj as any).items) ? (obj as any).items : [];
  const items: PlayerItem[] = itemsRaw
    .map((it: any) => ({
      playerId: Number(it.playerId ?? it.id ?? 0),
      playerName: String(it.playerName ?? it.name ?? ""),
      guildName: typeof it.guildName === "string" ? it.guildName : null,
      latestScore: typeof it.latestScore === "number" ? it.latestScore : it.latestScore != null ? Number(it.latestScore) : null,
      latestRank: typeof it.latestRank === "number" ? it.latestRank : it.latestRank != null ? Number(it.latestRank) : null,
      serverName: typeof it.serverName === "string" ? it.serverName : null,
    }))
    .filter((p: PlayerItem) => p.playerId && p.playerName);

  return {
    items,
    totalCount: typeof obj.totalCount === "number" ? obj.totalCount : items.length,
    pageNumber: typeof obj.pageNumber === "number" ? obj.pageNumber : 1,
    pageSize: typeof obj.pageSize === "number" ? obj.pageSize : items.length,
    totalPages: Math.max(1, typeof obj.totalPages === "number" ? obj.totalPages : 1),
    hasPrevious: typeof obj.hasPrevious === "boolean" ? obj.hasPrevious : false,
    hasNext: typeof obj.hasNext === "boolean" ? obj.hasNext : false,
  };
};

const Players = () => {
  const pageSize = 10;
  const [items, setItems] = useState<PlayerItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [serverIdInput, setServerIdInput] = useState("");
  const [serverId, setServerId] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => setSearchTerm(searchInput.trim()), 500);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (serverId) setPage(1);
  }, [serverId]);

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (serverId) {
          const data = await apiJson<unknown>(`/Players/server/${serverId}`, { method: "GET" });
          const res = normalizePlayers(data);
          setItems(res.items);
          setTotalCount(res.totalCount);
          setTotalPages(res.totalPages);
          setHasPrevious(res.hasPrevious);
          setHasNext(res.hasNext);
        } else {
          const numericId = /^\d+$/.test(searchTerm) ? searchTerm : "";
          if (numericId) {
            const data = await apiJson<unknown>(`/Players/${numericId}`, { method: "GET" });
            const res = normalizePlayers({ items: [data], totalCount: 1, pageNumber: 1, pageSize: 1, totalPages: 1, hasPrevious: false, hasNext: false });
            setItems(res.items);
            setTotalCount(res.totalCount);
            setTotalPages(res.totalPages);
            setHasPrevious(res.hasPrevious);
            setHasNext(res.hasNext);
          } else {
            const params = new URLSearchParams();
            params.set("PageNumber", String(page));
            params.set("PageSize", String(pageSize));
            if (searchTerm) params.set("SearchTerm", searchTerm);

            const data = await apiJson<unknown>(`/Players?${params.toString()}`, { method: "GET" });
            const res = normalizePlayers(data);
            setItems(res.items);
            setTotalCount(res.totalCount);
            setTotalPages(res.totalPages);
            setHasPrevious(res.hasPrevious);
            setHasNext(res.hasNext);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load players";
        setError(message);
        setItems([]);
        setTotalCount(0);
        setTotalPages(1);
        setHasPrevious(false);
        setHasNext(false);
      } finally {
        setIsLoading(false);
      }
    };
    run();
    }, [page, pageSize, searchTerm, serverId]);

  const displayItems = useMemo(() => items, [items]);
  const queryLabel = serverId ? `Server ${serverId}` : (searchTerm || "All players");

  const handleServerSearch = () => {
    const value = serverIdInput.trim();
    if (!value) return;
    if (!/^\d+$/.test(value)) {
      setError("Server ID must be a number.");
      return;
    }
    setError(null);
    setServerId(value);
    setSearchInput("");
    setSearchTerm("");
  };

  return (
    <UserPageShell
      eyebrow="Players"
      title="Browse players across ranked records"
      description="Search by player ID or name, inspect ranking snapshots quickly, and move through paginated results without losing context."
      backHref="/"
      aside={
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Total</p>
            <p className="mt-2 text-4xl font-black text-slate-950">{totalCount}</p>
            <p className="mt-2 text-sm font-medium text-slate-600">Players returned from the current query.</p>
          </div>
          <div className="rounded-3xl border border-teal-100 bg-teal-500/10 p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Page</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{page} / {totalPages}</p>
          </div>
        </div>
      }
      contentClassName="max-w-7xl"
    >
      <div className="mb-6 grid gap-4 lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(18rem,24rem)]">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Visible</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{displayItems.length}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Pagination</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{hasNext || hasPrevious ? totalPages : 1}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-900">
            <Users className="h-4 w-4 text-teal-600" />
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Query</p>
          </div>
          <p className="mt-2 truncate text-lg font-black text-slate-950">{queryLabel}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
            Search player
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => {
                if (serverId) setServerId("");
                setSearchInput(e.target.value);
              }}
              placeholder="Tìm theo ID hoặc tên..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm font-semibold text-slate-800 shadow-sm transition focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <input
              value={serverIdInput}
              onChange={(e) => setServerIdInput(e.target.value)}
              placeholder="Server ID"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <button
              type="button"
              onClick={handleServerSearch}
              className="whitespace-nowrap rounded-2xl bg-teal-600 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white shadow-sm transition hover:bg-teal-700"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-teal-100 bg-white/80 px-6 py-5 font-semibold text-teal-700 shadow-sm">
          Đang tải danh sách player...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-5 font-semibold text-red-700 shadow-sm">
          {error}
        </div>
      ) : null}

      {!isLoading && !error && displayItems.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white/80 px-6 py-5 font-semibold text-slate-700 shadow-sm">
          Không có dữ liệu.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[2rem] border border-teal-100 bg-white shadow-[0_24px_80px_rgba(14,116,144,0.12)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-teal-50 text-teal-700">
                <tr>
                  <th className="px-4 py-3 text-left font-black">ID</th>
                  <th className="px-4 py-3 text-left font-black">Player</th>
                  <th className="px-4 py-3 text-left font-black">Guild</th>
                  <th className="px-4 py-3 text-right font-black">Score</th>
                  <th className="px-4 py-3 text-right font-black">Rank</th>
                  <th className="px-4 py-3 text-left font-black">Server</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-teal-100">
                {displayItems.map((p) => (
                  <tr key={p.playerId} className="hover:bg-teal-50/40">
                    <td className="px-4 py-3 font-bold text-gray-800">{p.playerId}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{p.playerName}</td>
                    <td className="px-4 py-3 text-gray-600">{p.guildName ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-teal-700">
                      {p.latestScore != null ? p.latestScore.toLocaleString("vi-VN") : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">
                      {p.latestRank != null ? p.latestRank : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.serverName ?? "—"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white/90 px-4 py-4 shadow-sm">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={!hasPrevious}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
            !hasPrevious
              ? "cursor-not-allowed border-teal-100 bg-teal-50 text-teal-300"
              : "border-teal-200 bg-white text-teal-700 hover:bg-teal-50"
          }`}
        >
          Prev
        </button>
        <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
          <span>Page</span>
          <select
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
            className="rounded-lg border border-teal-200 bg-white px-2 py-1 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-300"
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <span>of {totalPages}</span>
        </div>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={!hasNext}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
            !hasNext
              ? "cursor-not-allowed border-teal-100 bg-teal-50 text-teal-300"
              : "border-teal-200 bg-white text-teal-700 hover:bg-teal-50"
          }`}
        >
          Next
        </button>
      </div>
    </UserPageShell>
  );
};

export default Players;

