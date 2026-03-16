import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import {
  BarChart3,
  FileText,
  Users,
} from "lucide-react";
import { clearAuthUser, getAuthToken, getAuthUser, setAuthToken } from "@/lib/api";

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
    <div className="min-h-screen bg-[#1f2630] text-gray-200 flex">
      <aside className="w-[260px] shrink-0 border-r border-white/[0.06] bg-[#1b222c]">
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
                      ? "bg-[#2a3340] text-white shadow-inner"
                      : "text-gray-300 hover:bg-[#242c36] hover:text-white"
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

      <main className="flex-1 bg-gradient-to-b from-[#1f2630] to-[#171d26]">
        
        <div className="px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
