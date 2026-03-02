
const AnalysisResult = () => {
  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-teal-100 shadow-lg p-6">
        <div className="flex items-start justify-between gap-6 flex-col md:flex-row">
          <div className="flex-1">
            <h2 className="text-2xl font-extrabold text-teal-900 mb-1">Sample Analysis</h2>
            <p className="text-sm text-teal-700/80 mb-4">Example output from a recent screenshot upload — shows key metrics and quick recommendations.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-teal-50 rounded-lg">
                <p className="text-3xl font-black text-teal-600">S+120</p>
                <p className="text-xs text-teal-700/80 mt-1">Player Power</p>
              </div>
              <div className="p-4 bg-teal-50 rounded-lg">
                <p className="text-3xl font-black text-teal-600">#12</p>
                <p className="text-xs text-teal-700/80 mt-1">Server Rank</p>
              </div>
              <div className="p-4 bg-teal-50 rounded-lg">
                <p className="text-3xl font-black text-teal-600">87%</p>
                <p className="text-xs text-teal-700/80 mt-1">Win Rate</p>
              </div>
            </div>
          </div>

          <div className="w-full md:w-72 mt-6 md:mt-0">
            <div className="bg-white rounded-xl border p-4 shadow-sm">
              <p className="text-sm text-teal-700/80 font-semibold">Quick Advice</p>
              <p className="text-sm mt-2 text-gray-800">Focus on defensive items early, avoid open-field duels, and prioritize event objectives.</p>
              <button className="mt-4 w-full bg-teal-600 text-white py-2 rounded-md font-bold hover:bg-teal-700 transition">View Full Report</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnalysisResult;
