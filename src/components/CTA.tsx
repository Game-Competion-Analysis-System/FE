interface CTAProps {
  onAnalyzeClick?: () => void;
}

const CTA = ({ onAnalyzeClick }: CTAProps) => {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-teal-50/40">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-3xl overflow-hidden shadow-2xl">
          {/* Content */}
          <div className="relative z-10 p-12 md:p-20 text-white">
            <h2 className="text-4xl md:text-5xl font-black leading-tight mb-6">
              Ready to Master Võ Lâm?
            </h2>
            <p className="text-teal-100 text-lg leading-relaxed max-w-2xl mb-8">
              Upload your first screenshot now and discover insights that will transform your gameplay. 
              Get 100% accurate analysis in less than 2 seconds.
            </p>

            <button 
              onClick={onAnalyzeClick}
              className="bg-white text-teal-600 font-bold px-10 py-4 rounded-2xl hover:scale-105 hover:shadow-2xl transition-all duration-300 shadow-xl"
            >
              Start Free Analysis
            </button>
            <p className="text-teal-100 text-sm mt-4">No credit card required. Instant results.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
