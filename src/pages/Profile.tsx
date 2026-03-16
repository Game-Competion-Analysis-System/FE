import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Save, User } from "lucide-react";
import FallBeamBackground from "@/components/lightswind/fall-beam-background";
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
    <div className="min-h-screen relative bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 px-4 py-10 overflow-hidden">
      <FallBeamBackground lineCount={12} beamColorClass="cyan-400" />

      <div className="relative z-20 max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white/85 px-4 py-2 text-sm font-bold text-gray-800 hover:bg-white transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white/90 shadow-2xl overflow-hidden">
          <div className="px-8 py-7 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-teal-600 uppercase tracking-wide">Profile</p>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900">{displayName}</h1>
              </div>
            </div>
            <button
              onClick={load}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-black text-teal-700 hover:bg-teal-100 transition disabled:opacity-70"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          <div className="p-8">
            {error ? (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-semibold">
                {error}
              </div>
            ) : null}

            {isLoading && !profile ? (
              <div className="text-gray-600 font-semibold">Loading profile…</div>
            ) : (
              <form onSubmit={handleSave} className="grid sm:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-2">User ID</p>
                  <p className="text-lg font-black text-gray-900">{profile?.userId ?? "—"}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-2">Role</p>
                  <p className="text-lg font-black text-gray-900">{profile?.role ?? "—"}</p>
                </div>

                <div className="sm:col-span-2 rounded-2xl border border-gray-200 bg-white p-5">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-2">
                    Username
                  </label>
                  <input
                    value={form.username}
                    onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 transition"
                    placeholder="Username"
                  />
                </div>

                <div className="sm:col-span-2 rounded-2xl border border-gray-200 bg-white p-5">
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 transition"
                    placeholder="Email"
                  />
                </div>

                <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition disabled:opacity-70"
                  >
                    <Save className="w-4 h-4" />
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
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-black text-gray-700 hover:bg-gray-50 transition"
                  >
                    Reset
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

