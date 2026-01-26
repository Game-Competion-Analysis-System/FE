const steps = [
  { name: "Upload", desc: "Take a screenshot of your game" },
  { name: "Analyze", desc: "AI processes your image instantly" },
  { name: "Understand", desc: "Get detailed game insights" },
  { name: "Act", desc: "Apply insights to improve" }
];

const HowItWorks = () => {
  return (
    <section id="how" className="py-24 bg-gradient-to-b from-teal-50/40 to-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-teal-900 mb-2">How It Works</h2>
          <p className="text-teal-700/70 text-lg">4 simple steps to get started</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {steps.map((step, index) => (
            <div key={step.name} className="group cursor-pointer">
              <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-white to-teal-50 shadow-lg flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:shadow-2xl group-hover:scale-110 border-4 border-teal-100 group-hover:border-teal-400 mb-4">
                <span className="text-5xl font-black text-teal-600 group-hover:text-teal-500 transition-colors">
                  {index + 1}
                </span>
              </div>
              <p className="font-bold text-sm text-teal-900 group-hover:text-teal-600 transition">{step.name}</p>
              <p className="text-xs text-teal-600/70 mt-2">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
