import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, RefreshCw, Save, ShieldCheck, User } from "lucide-react";
import UserPageShell from "@/components/UserPageShell";
import { ApiError, apiJson, clearAuthUser, getAuthToken, getAuthUser, setAuthToken, setAuthUser } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

type UserProfile = {
  userId: number | null;
  username: string | null;
  email: string | null;
  role: string | null;
};

function normalizeProfile(input: unknown): UserProfile | null {
  if (!input || typeof input !== "object") return null;
  const obj = input as Record<string, unknown>;

  const rawId = obj.userId ?? obj.userid ?? obj.UserId ?? obj.Userid ?? obj.id ?? obj.ID;
  const userId =
    typeof rawId === "number" && Number.isFinite(rawId)
      ? rawId
      : typeof rawId === "string" && rawId.trim() !== "" && Number.isFinite(Number(rawId))
        ? Number(rawId)
        : null;

  const rawName = obj.username ?? obj.Username ?? obj.name ?? obj.Name;
  const username = typeof rawName === "string" && rawName.trim() ? rawName.trim() : null;

  const rawEmail = obj.email ?? obj.Email;
  const email = typeof rawEmail === "string" && rawEmail.trim() ? rawEmail.trim() : null;

  const rawRole = obj.role ?? obj.Role;
  const role = typeof rawRole === "string" && rawRole.trim() ? rawRole.trim() : null;

  if (!userId && !username && !email && !role) return null;
  return { userId, username, email, role };
}

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ username: "", email: "" });

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiJson<unknown>("/Users/profile", { method: "GET" });
      const normalized = normalizeProfile(data) ?? normalizeProfile((data as any)?.data) ?? null;
      if (!normalized) {
        throw new Error("Profile response missing fields");
      }
      setProfile(normalized);
      setAuthUser(normalized, true);
    } catch (e: unknown) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        setAuthToken(null);
        clearAuthUser();
        navigate("/login");
        return;
      }
      const msg = e instanceof Error ? e.message : "Failed to load profile";
      setError(msg);
      toast.destructive({
        title: "Failed to load profile",
        description: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayName = useMemo(() => {
    return profile?.username ?? (getAuthUser()?.username as string | undefined) ?? "User";
  }, [profile]);

  useEffect(() => {
    const fallback = getAuthUser() as Record<string, unknown> | null;
    const username = profile?.username ?? (typeof fallback?.username === "string" ? fallback.username : "");
    const email = profile?.email ?? (typeof fallback?.email === "string" ? fallback.email : "");
    setForm({ username, email });
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
      };
      const res = await apiJson<unknown>("/Users/profile", { method: "PUT", body: payload });
      const normalized = normalizeProfile(res) ?? normalizeProfile((res as any)?.data) ?? null;
      if (normalized) {
        setProfile(normalized);
        setAuthUser(normalized, true);
      } else {
        await load();
      }
      toast.success({
        title: "Profile updated",
        description: "Your changes have been saved.",
      });
    } catch (e: unknown) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        setAuthToken(null);
        clearAuthUser();
        navigate("/login");
        return;
      }
      const msg = e instanceof Error ? e.message : "Failed to update profile";
      setError(msg);
      toast.destructive({
        title: "Update failed",
        description: msg,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <UserPageShell
      eyebrow="Profile"
      title={`Manage your account as ${displayName}`}
      description="Keep your identity and contact information up to date so the app can personalize analysis history and account-level actions consistently."
      onBack={() => navigate(-1)}
      actions={
        <button
          type="button"
          onClick={load}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-2xl border border-teal-200 bg-white/90 px-4 py-2.5 text-sm font-black text-teal-700 shadow-sm transition hover:bg-white disabled:opacity-70"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      }
      aside={
        <div className="space-y-4">
          <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-black text-slate-950">{displayName}</p>
              <p className="truncate text-sm font-medium text-slate-500">{(profile?.email ?? form.email) || "No email yet"}</p>
            </div>
          </div>
          <div className="rounded-3xl border border-teal-100 bg-teal-500/10 p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Role</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{profile?.role ?? "--"}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-4">
            <p className="text-sm font-black text-slate-900">Account status</p>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
              Profile data is synced from the authenticated backend account and can be refreshed any time.
            </p>
          </div>
        </div>
      }
      contentClassName="max-w-5xl"
    >
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-[0_24px_80px_rgba(14,116,144,0.12)]">
        <div className="border-b border-slate-100 px-6 py-6 sm:px-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-600">Account Details</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Profile settings</h2>
        </div>

        <div className="p-6 sm:p-8">
          {error ? (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}

          {isLoading && !profile ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-6 text-sm font-semibold text-slate-600">
              Loading profile...
            </div>
          ) : (
            <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                    Username
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={form.username}
                      onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm font-semibold text-slate-800 transition focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-300"
                      placeholder="Username"
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm font-semibold text-slate-800 transition focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-300"
                      placeholder="Email"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-teal-500/20 transition hover:shadow-teal-500/30 disabled:opacity-70"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForm({
                        username: profile?.username ?? "",
                        email: profile?.email ?? "",
                      });
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">User ID</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{profile?.userId ?? "--"}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                  <div className="flex items-center gap-2 text-slate-900">
                    <ShieldCheck className="h-4 w-4 text-teal-600" />
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Role</p>
                  </div>
                  <p className="mt-2 text-2xl font-black text-slate-950">{profile?.role ?? "--"}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <p className="text-sm font-black text-slate-900">Profile summary</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                    Changes made here update your backend profile and the local authenticated user cache used by the navbar.
                  </p>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </UserPageShell>
  );
};

export default Profile;

