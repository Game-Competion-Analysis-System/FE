const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-teal-800 to-teal-800 text-white py-20">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 text-sm">
        <div>
          <div className="flex items-center gap-3 font-black text-2xl mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl shadow-lg flex items-center justify-center">
              <span className="text-white text-xl">⚔️</span>
            </div>
            VLK Analyzer
          </div>
          <p className="text-teal-200/80 leading-relaxed">
            Advanced AI analysis for Võ Lâm players. Get detailed insights to master your game.
          </p>
        </div>

        <div>
          <h4 className="font-bold mb-4 text-lg text-teal-300">Quick Links</h4>
          <ul className="space-y-3 text-teal-200/80">
            <li className="hover:text-white transition cursor-pointer">About Us</li>
            <li className="hover:text-white transition cursor-pointer">How It Works</li>
            <li className="hover:text-white transition cursor-pointer">Pricing</li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-4 text-lg text-teal-300">Features</h4>
          <ul className="space-y-3 text-teal-200/80">
            <li className="hover:text-white transition cursor-pointer">Ranking Analysis</li>
            <li className="hover:text-white transition cursor-pointer">Event Detection</li>
            <li className="hover:text-white transition cursor-pointer">Player Insights</li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-4 text-lg text-teal-300">Newsletter</h4>
          <p className="text-teal-200/80 mb-3">Get weekly tips & updates</p>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="Email address"
            />
            <button className="bg-gradient-to-r from-teal-400 to-cyan-400 text-teal-900 font-bold px-5 rounded-lg hover:scale-105 transition-transform shadow-md">
              →
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-teal-700/50 text-center text-teal-200/60 text-sm">
        © 2026 VLK Analyzer. All rights reserved. Made with 💚 for players.
      </div>
    </footer>
  );
};

export default Footer;
