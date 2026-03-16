import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight,
  RefreshCw, Search, ShieldAlert, Trash2, Users, X,
} from "lucide-react";
import { ApiError, apiJson, clearAuthUser, getAuthToken, getAuthUser, setAuthToken } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ConfirmDialog";

type UserRow = {
  userid?: number;
  username?: string;
  email?: string;
  role?: string;
};

type PaginatedUsers = {
  items: UserRow[];
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

type SortField = "userid" | "username" | "email" | "role";

function getRole(u: unknown): string | null {
  if (!u || typeof u !== "object") return null;
  const obj = u as Record<string, unknown>;
  const role = obj.Role ?? obj.role;
  return typeof role === "string" && role.trim() ? role.trim().toLowerCase() : null;
}

function getId(u: UserRow): number | null {
  const v = u.userid;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function getName(u: UserRow): string {
  return (u.username ?? "").trim();
}

function getEmail(u: UserRow): string {
  return (u.email ?? "").trim();
}

function getUserRole(u: UserRow): string {
  return (u.role ?? "").trim();
}

function normalizeUserRow(input: unknown): UserRow {
  const obj = input && typeof input === "object" ? (input as Record<string, unknown>) : {};

  const useridRaw = obj.userid ?? obj.userId ?? obj.Userid ?? obj.UserId;
  const userid =
    typeof useridRaw === "number" && Number.isFinite(useridRaw)
      ? useridRaw
      : typeof useridRaw === "string" && useridRaw.trim() !== "" && Number.isFinite(Number(useridRaw))
        ? Number(useridRaw)
        : undefined;

  const usernameRaw = obj.username ?? obj.Username;
  const emailRaw = obj.email ?? obj.Email;
  const roleRaw = obj.role ?? obj.Role;

  return {
    userid,
    username: typeof usernameRaw === "string" ? usernameRaw : undefined,
    email: typeof emailRaw === "string" ? emailRaw : undefined,
    role: typeof roleRaw === "string" ? roleRaw : undefined,
  };
}

function normalizeUserList(input: unknown): PaginatedUsers {
  const obj = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const raw =
    Array.isArray(input)
      ? input
      : Array.isArray((obj as any)?.items)
        ? (obj as any).items
        : Array.isArray((obj as any)?.data)
          ? (obj as any).data
          : Array.isArray((obj as any)?.result)
            ? (obj as any).result
            : [];

  const items = raw.map(normalizeUserRow);
  return {
    items,
    totalCount: typeof (obj as any).totalCount === "number" ? (obj as any).totalCount : items.length,
    totalPages: Math.max(1, typeof (obj as any).totalPages === "number" ? (obj as any).totalPages : 1),
    hasPrevious: typeof (obj as any).hasPrevious === "boolean" ? (obj as any).hasPrevious : false,
    hasNext: typeof (obj as any).hasNext === "boolean" ? (obj as any).hasNext : false,
  };
}

const PAGE_SIZE = 10;

const SORT_FIELDS: { value: SortField; label: string }[] = [
  { value: "userid", label: "ID" },
  { value: "username", label: "Username" },
  { value: "email", label: "Email" },
  { value: "role", label: "Role" },
];

const roleBadge = (role: string) => {
  const r = role.toLowerCase();
  if (r === "admin")
    return "bg-rose-500/15 border-rose-500/30 text-rose-200";
  if (r === "user")
    return "bg-teal-500/15 border-teal-500/30 text-teal-200";
  return "bg-white/[0.06] border-white/[0.10] text-gray-300";
};

const AdminUsers = () => {
  const navigate = useNavigate();

  // Server-side state
  const [items, setItems] = useState<UserRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [page, setPage] = useState(1);

  // Filter state (inputs — debounced → committed values below)
  const [searchInput, setSearchInput] = useState("");
  const [filterInput, setFilterInput] = useState("");
  const [gameNameInput, setGameNameInput] = useState("");
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("");
  const [gameName, setGameName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [sortBy, setSortBy] = useState<SortField>("userid");
  const [isDescending, setIsDescending] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmUserId, setConfirmUserId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Auth guard
  useEffect(() => {
    const token = getAuthToken();
    const user = getAuthUser();
    if (!token) { navigate("/login"); return; }
    if (getRole(user) !== "admin") { navigate("/game-selection"); }
  }, [navigate]);

  // Debounce inputs → committed values
  useEffect(() => {
    const h = setTimeout(() => { setSearchTerm(searchInput.trim()); setPage(1); }, 400);
    return () => clearTimeout(h);
  }, [searchInput]);

  useEffect(() => {
    const h = setTimeout(() => { setFilter(filterInput.trim()); setPage(1); }, 400);
    return () => clearTimeout(h);
  }, [filterInput]);

  useEffect(() => {
    const h = setTimeout(() => { setGameName(gameNameInput.trim()); setPage(1); }, 400);
    return () => clearTimeout(h);
  }, [gameNameInput]);

  useEffect(() => {
    const h = setTimeout(() => { setStartDate(startDateInput.trim()); setPage(1); }, 400);
    return () => clearTimeout(h);
  }, [startDateInput]);

  useEffect(() => {
    const h = setTimeout(() => { setEndDate(endDateInput.trim()); setPage(1); }, 400);
    return () => clearTimeout(h);
  }, [endDateInput]);

  // Reset page on sort change
  useEffect(() => { setPage(1); }, [sortBy, isDescending]);

  // Fetch
  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("PageNumber", String(page));
      params.set("PageSize", String(PAGE_SIZE));
      if (searchTerm) params.set("SearchTerm", searchTerm);
      if (sortBy) params.set("SortBy", sortBy);
      params.set("IsDescending", String(isDescending));
      if (filter) params.set("Filter", filter);
      if (startDate) params.set("StartDate", startDate);
      if (endDate) params.set("EndDate", endDate);
      if (gameName) params.set("GameName", gameName);

      const data = await apiJson<unknown>(`/Users?${params.toString()}`, { method: "GET" });
      const res = normalizeUserList(data);
      setItems(res.items);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
      setHasPrevious(res.hasPrevious);
      setHasNext(res.hasNext);
    } catch (e: unknown) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        setAuthToken(null); clearAuthUser(); navigate("/login"); return;
      }
      const msg = e instanceof Error ? e.message : "Failed to load users";
      setError(msg);
      toast.destructive({ title: "Failed to load users", description: msg });
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ },
    [page, searchTerm, sortBy, isDescending, filter, startDate, endDate, gameName]);

  const runDelete = async (userId: number) => {
    setDeletingId(userId);
    setError(null);
    try {
      await apiJson<unknown>(`/Users/${userId}`, { method: "DELETE" });
      toast.success({ title: "User deleted", description: `#${userId}` });
      load();
    } catch (e: unknown) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        setAuthToken(null); clearAuthUser(); navigate("/login"); return;
      }
      const msg = e instanceof Error ? e.message : "Delete failed";
      setError(msg);
      toast.destructive({ title: "Delete failed", description: msg });
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setSearchInput(""); setFilterInput(""); setGameNameInput("");
    setStartDateInput(""); setEndDateInput("");
  };

  const hasActiveFilters = searchInput || filterInput || gameNameInput || startDateInput || endDateInput;

  return (
    <div className="relative">
      <ConfirmDialog
        open={confirmUserId != null}
        title={confirmUserId != null ? `Delete user #${confirmUserId}?` : "Delete user?"}
        description="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isBusy={deletingId != null}
        onClose={() => { if (deletingId != null) return; setConfirmUserId(null); }}
        onConfirm={() => {
          const id = confirmUserId;
          if (id == null) return;
          setConfirmUserId(null);
          runDelete(id);
        }}
      />

      {/* ── Header ── */}
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-teal-200 text-xs font-black tracking-wide">
            <Users className="w-3.5 h-3.5 text-teal-300" />
            ADMIN
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">User Management</h1>
          <p className="mt-1 text-sm text-gray-400 font-medium">
            {isLoading ? "Loading…" : `${totalCount} user(s) total`}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-black text-gray-200 hover:bg-white/[0.08] transition disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="mb-5 rounded-3xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-sm space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Filters</p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-gray-300 hover:bg-white/[0.08] transition"
            >
              <X className="w-3 h-3" />
              Clear filters
            </button>
          ) : null}
        </div>

        {/* Row 1: Search + Filter + GameName */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="ID / username / email..."
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-9 pr-3 py-2.5 text-sm font-semibold text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/30 transition"
              />
            </div>
          </div>
          
          
        </div>

        {/* Row 2: Start Date + End Date + Sort */}
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDateInput}
              onChange={(e) => setStartDateInput(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/30 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">End Date</label>
            <input
              type="date"
              value={endDateInput}
              onChange={(e) => setEndDateInput(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/30 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 [&>option]:bg-[#1b222c] transition"
            >
              {SORT_FIELDS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">Order</label>
            <button
              type="button"
              onClick={() => setIsDescending((v) => !v)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-gray-200 hover:bg-white/[0.08] transition"
            >
              {isDescending
                ? <><ArrowDown className="w-4 h-4 text-teal-300" /> Descending by {SORT_FIELDS.find(f => f.value === sortBy)?.label ?? sortBy}</>
                : <><ArrowUp className="w-4 h-4 text-teal-300" /> Ascending by {SORT_FIELDS.find(f => f.value === sortBy)?.label ?? sortBy}</>}
            </button>
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {error ? (
        <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-red-300" />
          <span>{error}</span>
        </div>
      ) : null}

      {/* ── Table ── */}
      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm font-black text-white">
            Users
            {(searchTerm || filter || gameName || startDate || endDate) && (
              <span className="ml-2 text-xs font-bold text-teal-300">— filtered</span>
            )}
          </p>
          <p className="text-xs font-bold text-gray-400">
            {isLoading ? "Loading..." : `${items.length} / ${totalCount}`}
          </p>
        </div>

        {isLoading ? (
          <div className="p-10 text-gray-300 font-medium">Loading users…</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-gray-400 font-medium">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-black text-gray-400 bg-white/[0.03] border-b border-white/[0.06]">
                  {[
                    { field: "userid" as SortField, label: "ID", cls: "w-20 text-left" },
                    { field: "username" as SortField, label: "Username", cls: "text-left" },
                    { field: "email" as SortField, label: "Email", cls: "text-left" },
                    { field: "role" as SortField, label: "Role", cls: "w-28 text-left" },
                  ].map(({ field, label, cls }) => (
                    <th
                      key={field}
                      className={`px-5 py-3 cursor-pointer select-none hover:text-gray-200 transition ${cls}`}
                      onClick={() => {
                        if (sortBy === field) setIsDescending((v) => !v);
                        else { setSortBy(field); setIsDescending(false); }
                      }}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {label}
                        {sortBy === field
                          ? isDescending
                            ? <ArrowDown className="w-3 h-3 text-teal-300" />
                            : <ArrowUp className="w-3 h-3 text-teal-300" />
                          : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                      </span>
                    </th>
                  ))}
                  <th className="px-5 py-3 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => {
                  const id = getId(u);
                  const role = getUserRole(u);
                  return (
                    <tr
                      key={String(id ?? Math.random())}
                      className="border-t border-white/[0.06] hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="px-5 py-3 font-black text-white tabular-nums">{id ?? "—"}</td>
                      <td className="px-5 py-3 font-bold text-gray-100">{getName(u) || "—"}</td>
                      <td className="px-5 py-3 text-gray-300">{getEmail(u) || "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-black ${roleBadge(role)}`}>
                          {role || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => (id != null ? setConfirmUserId(id) : null)}
                          disabled={id == null || deletingId === id}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-black text-red-200 hover:bg-red-500/15 hover:border-red-500/40 transition disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {deletingId === id ? "Deleting…" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 || totalCount > 0 ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!hasPrevious}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
              !hasPrevious
                ? "border-white/[0.06] text-gray-600 cursor-not-allowed"
                : "border-white/[0.10] bg-white/[0.06] text-gray-200 hover:bg-white/[0.10] hover:text-white"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>

          <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
            <span>Page</span>
            <select
              value={page}
              onChange={(e) => setPage(Number(e.target.value))}
              className="rounded-lg border border-white/[0.10] bg-white/[0.06] px-2 py-1 text-xs font-bold text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 [&>option]:bg-[#1b222c]"
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <span>of {totalPages}</span>
            <span className="text-gray-600">({totalCount} total)</span>
          </div>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={!hasNext}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
              !hasNext
                ? "border-white/[0.06] text-gray-600 cursor-not-allowed"
                : "border-white/[0.10] bg-white/[0.06] text-gray-200 hover:bg-white/[0.10] hover:text-white"
            }`}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default AdminUsers;

