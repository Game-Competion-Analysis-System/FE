import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearAuthUser, getAuthToken, getAuthUser, setAuthToken } from "@/lib/api";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const [user, setUser] = useState<any>(() => getAuthUser());

  useEffect(() => {
    const sync = () => {
      setToken(getAuthToken());
      setUser(getAuthUser());
    };
    window.addEventListener("auth:changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("auth:changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isAuthed = useMemo(() => !!token, [token]);
  const displayName = useMemo(() => {
    const u = user;
    return (
      u?.username ??
      null
    );
  }, [user]);

  const isAdmin = useMemo(() => {
    const u = user as unknown;
    if (!u || typeof u !== "object") return false;
    const obj = u as Record<string, unknown>;
    const role = obj.Role ?? obj.role;
    return typeof role === "string" && role.trim().toLowerCase() === "admin";
  }, [user]);

  const handleLogout = () => {
    setAuthToken(null);
    clearAuthUser();
    setOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md shadow-sm border-b border-teal-100">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 font-extrabold text-2xl shrink-0 text-teal-700">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl shadow-lg flex items-center justify-center">
            <span className="text-white text-xl"></span>
          </div>
          <span>VLK Analyzer</span>
        </Link>

        {/* Search (desktop) */}
        <div className="hidden md:flex flex-1 max-w-xl">
          <input
            aria-label="Search game stats"
            className="w-full rounded-full px-4 py-2 bg-teal-50 border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
            placeholder="Search players, matches, items..."
          />
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold shrink-0">
          <a className="hover:text-teal-600 transition" href="#features">Features</a>
          <a className="hover:text-teal-600 transition" href="#how">How It Works</a>
          <a className="hover:text-teal-600 transition" href="#pricing">Plans</a>
          {isAuthed ? (
            <div className="flex items-center gap-3">
              <Link to="/history" className="text-teal-700 font-bold hover:text-teal-800 transition">
                History
              </Link>
              {isAdmin ? (
                <Link to="/admin/users" className="text-teal-700 font-bold hover:text-teal-800 transition">
                  Admin
                </Link>
              ) : null}
              {displayName ? (
                <div className="max-w-[220px] truncate rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-teal-800 font-bold shadow-sm">
                  {displayName}
                </div>
              ) : null}
              <button
                onClick={handleLogout}
                className="border border-teal-200 text-teal-700 bg-white px-4 py-2 rounded-full hover:bg-teal-50 transition shadow-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="bg-teal-600 text-white px-5 py-2 rounded-full hover:bg-teal-700 transition shadow-md hover:shadow-lg">
              Login
            </Link>
          )}
        </nav>

        {/* Mobile menu button */}
        <div className="md:hidden ml-auto">
          <button
            onClick={() => setOpen((s) => !s)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="p-2 rounded-md bg-white border border-teal-100 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-300"
          >
            <span className="sr-only">Open main menu</span>
            <svg className="w-6 h-6 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      <div id="mobile-menu" className={`${open ? "block" : "hidden"} md:hidden border-t border-teal-100 bg-white/98`}>
        <div className="px-4 py-4 space-y-3">
          <div>
            <input
              aria-label="Search game stats"
              className="w-full rounded-full px-4 py-2 bg-teal-50 border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-300 transition"
              placeholder="Search players, matches..."
            />
          </div>
          <a className="block px-2 py-2 text-teal-700 font-semibold hover:bg-teal-50 rounded" href="#features">Features</a>
          <a className="block px-2 py-2 text-teal-700 font-semibold hover:bg-teal-50 rounded" href="#how">How It Works</a>
          <a className="block px-2 py-2 text-teal-700 font-semibold hover:bg-teal-50 rounded" href="#pricing">Plans</a>
          <div className="pt-2">
            {isAuthed ? (
              <div className="space-y-2">
                <Link
                  to="/history"
                  onClick={() => setOpen(false)}
                  className="block w-full text-center border border-teal-200 text-teal-700 bg-white px-4 py-2 rounded-full hover:bg-teal-50 transition shadow-sm"
                >
                  History
                </Link>
                {isAdmin ? (
                  <Link
                    to="/admin/users"
                    onClick={() => setOpen(false)}
                    className="block w-full text-center border border-teal-200 text-teal-700 bg-white px-4 py-2 rounded-full hover:bg-teal-50 transition shadow-sm"
                  >
                    Admin
                  </Link>
                ) : null}
                {displayName ? (
                  <div className="w-full text-center rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-800 shadow-sm">
                    {displayName}
                  </div>
                ) : null}
                <button
                  onClick={handleLogout}
                  className="block w-full text-center border border-teal-200 text-teal-700 bg-white px-4 py-2 rounded-full hover:bg-teal-50 transition shadow-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="block w-full text-center bg-teal-600 text-white px-4 py-2 rounded-full hover:bg-teal-700 transition shadow-sm"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
