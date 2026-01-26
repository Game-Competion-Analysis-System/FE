const features = [
  {
    name: "Ranking Analysis",
    desc: "Get detailed insights into player rankings, competitive standings, and tier distributions.",
    img: "https://i.pinimg.com/1200x/3c/cb/24/3ccb24171608cac8e6df452341e54613.jpg"
  },
  {
    name: "Event Detection",
    desc: "Automatically identify current events, seasonal updates, and limited-time opportunities.",
    img: "https://i.pinimg.com/736x/13/03/21/130321249124b8d39ec9d07fd1f1bf7c.jpg"
  },
  {
    name: "Player Insights",
    desc: "Analyze player profiles, equipment, skills, and strategy information in one glance.",
    img: "https://i.pinimg.com/1200x/45/1e/dd/451eddc019cbfd5771d8eea67cd3a2f1.jpg"
  },
  {
    name: "Performance Metrics",
    desc: "Track your progress with comprehensive statistics and detailed game analysis.",
    img: "https://i.pinimg.com/1200x/8d/ff/a1/8dffa167d7c06c98303cf74e1e684c0c.jpg"
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-gradient-to-b from-white to-teal-50/40">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-16">
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-teal-900 mb-2">Featured Features</h2>
            <p className="text-teal-700/70 text-lg">
              Powerful analysis tools for Võ Lâm players
            </p>
          </div>
          <a className="text-teal-600 font-bold text-sm hover:text-teal-700 transition flex items-center gap-2 hover:gap-3" href="#">
            Browse all <span className="text-lg transition-all">→</span>
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f) => (
            <div
              key={f.name}
              className="bg-white rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-teal-100 hover:border-teal-300 hover:scale-105 group"
            >
              <div className="relative">
                <div className="h-32 bg-gradient-to-br from-cyan-200 to-teal-200 rounded-2xl mb-5 overflow-hidden group-hover:shadow-lg transition-shadow">
                  <img 
                    src={f.img} 
                    alt={f.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              </div>
              <h3 className="font-bold text-teal-900 text-lg mb-3">{f.name}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
