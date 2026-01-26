import { useState } from "react";

interface AnalyzeScreenshotProps {
  onBack: () => void;
}

const AnalyzeScreenshot = ({ onBack }: AnalyzeScreenshotProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md shadow-sm border-b border-teal-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-6">
          <button 
            onClick={onBack}
            className="text-teal-600 hover:text-teal-700 font-semibold text-sm transition flex items-center gap-2"
          >
            ← VLK Analyzer
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-teal-900 mb-2">Analyze Screenshot</h1>
          <p className="text-teal-700/70 text-lg">
            Take a screenshot of your game and upload it to get AI-powered analysis
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="bg-white rounded-3xl border-2 border-dashed border-teal-300 p-12 flex flex-col items-center justify-center hover:border-teal-500 hover:bg-teal-50/50 transition cursor-pointer shadow-lg"
          >
            <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
              <p className="font-bold text-teal-900 text-center text-lg mb-2">
                Click to upload or drag & drop
              </p>
              <p className="text-sm text-teal-600">
                PNG, JPG or WebP up to 10MB
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Preview/Status Area */}
          <div className="bg-white rounded-3xl border-2 border-teal-200 p-12 flex flex-col items-center justify-center shadow-lg">
            {image ? (
              <div className="w-full">
                <div className="rounded-2xl overflow-hidden mb-6 max-h-64">
                  <img 
                    src={image} 
                    alt="Uploaded screenshot" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-4">
                  <div className="bg-teal-50 p-4 rounded-lg">
                    <p className="text-sm text-teal-600">File: {fileName}</p>
                  </div>
                  <button className="w-full bg-teal-600 text-white font-bold py-3 rounded-xl hover:bg-teal-700 transition shadow-md">
                    Analyze Now
                  </button>
                  <button 
                    onClick={() => {
                      setImage(null);
                      setFileName("");
                    }}
                    className="w-full border-2 border-teal-300 text-teal-600 font-bold py-3 rounded-xl hover:bg-teal-50 transition"
                  >
                    Upload Different Image
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-4">⚡</div>
                <p className="font-bold text-teal-900 text-lg mb-2">
                  Upload a screenshot to get started
                </p>
                <p className="text-sm text-teal-600">
                  Our AI will analyze rankings, events, and players in your image
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyzeScreenshot;
