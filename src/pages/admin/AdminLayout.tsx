import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import {
  BarChart3,
  FileText,
  Users,
} from "lucide-react";
import { clearAuthUser, getAuthToken, getAuthUser, setAuthToken } from "@/lib/api";
import FallBeamBackground from "@/components/lightswind/fall-beam-background";

const navItems = [
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/history", label: "History", icon: FileText },
  { to: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
  
];

const AdminLayout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = getAuthToken();
    const user = getAuthUser();
    if (!token) {
      navigate("/login");
      return;
    }
    const role = (user?.role ?? user?.Role ?? "").toString().trim().toLowerCase();
    if (role !== "admin") {
      setAuthToken(null);
      clearAuthUser();
      navigate("/login");
    }
  }, [navigate]);

  const displayName = useMemo(() => {
    const u = getAuthUser() as Record<string, unknown> | null;
    return typeof u?.username === "string" ? u.username : "Admin";
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-gray-200 flex relative overflow-hidden">
      {/* Ambient blobs — full page, matches History & Dashboard */}
      <div className="pointer-events-none absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-teal-500/15 to-cyan-500/10 blur-[120px] z-0" />
      <div className="pointer-events-none absolute top-1/2 -left-20 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/8 blur-[100px] z-0" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-violet-500/8 to-fuchsia-500/5 blur-[100px] z-0" />
      <div className="pointer-events-none absolute inset-0 z-0">
        <FallBeamBackground />
      </div>

      <aside className="relative z-10 w-[260px] shrink-0 border-r border-white/[0.06] bg-[#0a0e1a]/80 backdrop-blur-sm">
        <div className="px-5 py-5 border-b border-white/[0.06]">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-black">A</span>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold">Admin Panel</p>
              <p className="text-sm font-black text-white truncate max-w-[160px]">{displayName}</p>
            </div>
          </Link>
        </div>

        <nav className="px-3 py-4 space-y-1 text-sm font-semibold">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 transition ${
                    isActive
                      ? "bg-white/[0.08] text-white shadow-inner"
                      : "text-gray-400 hover:bg-white/[0.05] hover:text-white"
                  }`
                }
              >
                <Icon className="w-4 h-4 text-gray-400" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <main className="relative z-10 flex-1">
        <div className="px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
