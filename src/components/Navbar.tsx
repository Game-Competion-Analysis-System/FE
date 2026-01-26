const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md shadow-sm border-b border-teal-100">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3 font-black text-2xl shrink-0 text-teal-700">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl shadow-lg flex items-center justify-center">
            <span className="text-white text-xl">⚔️</span>
          </div>
          VLK Analyzer
        </div>

        {/* Search */}
        <div className="hidden md:block flex-1 max-w-xl">
          <input
            className="w-full rounded-full px-6 py-3 bg-teal-50 border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
            placeholder="Search game stats..."
          />
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-8 text-sm font-semibold shrink-0">
          <a className="hover:text-teal-600 transition" href="#features">Features</a>
          <a className="hover:text-teal-600 transition" href="#how">How It Works</a>
          <button className="bg-teal-600 text-white px-6 py-2 rounded-full hover:bg-teal-700 transition shadow-md hover:shadow-lg">
            Dashboard
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
