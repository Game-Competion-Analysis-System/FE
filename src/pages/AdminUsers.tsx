import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, Trash2, Users } from "lucide-react";
import { ApiError, apiJson, clearAuthUser, getAuthToken, getAuthUser, setAuthToken } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ConfirmDialog";

type UserRow = {
  userid?: number;
  username?: string;
  email?: string;
  role?: string;
};

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

function normalizeUserList(input: unknown): UserRow[] {
  const raw =
    Array.isArray(input)
      ? input
      : Array.isArray((input as any)?.items)
        ? (input as any).items
        : Array.isArray((input as any)?.data)
          ? (input as any).data
          : Array.isArray((input as any)?.result)
            ? (input as any).result
            : [];
  return raw.map(normalizeUserRow);
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<UserRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [confirmUserId, setConfirmUserId] = useState<number | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    const user = getAuthUser();
    if (!token) {
      navigate("/login");
      return;
    }
    if (getRole(user) !== "admin") {
      navigate("/game-selection");
      return;
    }
  }, [navigate]);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiJson<unknown>("/Users", { method: "GET" });
      setItems(normalizeUserList(data));
    } catch (e: unknown) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        setAuthToken(null);
        clearAuthUser();
        navigate("/login");
        return;
      }
      const msg = e instanceof Error ? e.message : "Failed to load users";
      setError(msg);
      toast.destructive({
        title: "Failed to load users",
        description: msg,
      });
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items ?? [];
    if (!q) return list;
    return list.filter((u) => {
      const hay = `${getId(u) ?? ""} ${getName(u)} ${getEmail(u)} ${getUserRole(u)}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  const runDelete = async (userId: number) => {
    setError(null);
    try {
      await apiJson<unknown>(`/Users/${userId}`, { method: "DELETE" });
      await load();
      toast.success({
        title: "User deleted",
        description: `#${userId}`,
      });
    } catch (e: unknown) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        setAuthToken(null);
        clearAuthUser();
        navigate("/login");
        return;
      }
      const msg = e instanceof Error ? e.message : "Delete failed";
      setError(msg);
      toast.destructive({
        title: "Delete failed",
        description: msg,
      });
    }
  };

  return (
    <div className="relative">
      <ConfirmDialog
        open={confirmUserId != null}
        title={confirmUserId != null ? `Delete user #${confirmUserId}?` : "Delete user?"}
        description="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onClose={() => setConfirmUserId(null)}
        onConfirm={() => {
          const id = confirmUserId;
          if (id == null) return;
          setConfirmUserId(null);
          runDelete(id);
        }}
      />
      <div className="relative z-20 max-w-7xl mx-auto">
        <div className="mb-8 flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 mb-3 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-teal-200 text-xs font-black tracking-wide shadow-sm">
              <Users className="w-4 h-4 text-teal-300" />
              ADMIN
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">User Management</h1>
          </div>

          <div className="min-w-[280px]">
            <label className="block text-xs font-black text-gray-400 mb-2">Search</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="id / username / email / role"
              className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-semibold text-gray-100 placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/30 transition"
            />
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-red-300" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm font-black text-white">Users</p>
            <p className="text-xs font-bold text-gray-400">
              {isLoading ? "Loading..." : `${filtered.length} user(s)`}
            </p>
          </div>

          {isLoading ? (
            <div className="p-10 text-gray-300 font-medium">Loading users…</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-gray-300 font-medium">No users.</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-black text-gray-400 bg-white/[0.03] border-b border-white/[0.06]">
                    <th className="px-5 py-3 text-left w-20">ID</th>
                    <th className="px-5 py-3 text-left">Username</th>
                    <th className="px-5 py-3 text-left">Email</th>
                    <th className="px-5 py-3 text-left w-28">Role</th>
                    <th className="px-5 py-3 text-right w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const id = getId(u);
                    return (
                      <tr key={String(id ?? Math.random())} className="border-t border-white/[0.06] hover:bg-white/[0.03] transition-colors">
                        <td className="px-5 py-3 font-black text-white">{id ?? "—"}</td>
                        <td className="px-5 py-3 font-bold text-gray-100">{getName(u) || "—"}</td>
                        <td className="px-5 py-3 text-gray-300">{getEmail(u) || "—"}</td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs font-black text-gray-200">
                            {getUserRole(u) || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => (id != null ? setConfirmUserId(id) : null)}
                            disabled={id == null}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-black text-red-200 hover:bg-red-500/15 hover:border-red-500/40 transition disabled:opacity-60"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
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
      </div>
    </div>
  );
};

export default AdminUsers;

