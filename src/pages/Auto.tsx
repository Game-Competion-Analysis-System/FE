import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CloudUpload, Sparkles } from "lucide-react";
import UserPageShell from "@/components/UserPageShell";
import { apiJson, getAuthToken } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

type AutoState = {
  images: string[];
  isLoading: boolean;
  error: string | null;
};

const Auto = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<AutoState>({
    images: [],
    isLoading: true,
    error: null,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const loadImages = async (signal?: AbortSignal) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await apiJson<unknown>("/ai/airtest-uploads", {
        method: "GET",
        signal,
      });
      const list = Array.isArray(data) ? data.filter((url) => typeof url === "string") : [];
      setState({ images: list, isLoading: false, error: null });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const message = err instanceof Error ? err.message : "Failed to load images";
      setState({ images: [], isLoading: false, error: message });
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    loadImages(controller.signal);
    return () => controller.abort();
  }, []);

  const handleAnalyzeLatest = async () => {
    if (isAnalyzing) return;
    if (!getAuthToken()) {
      toast.warning({
        title: "Login required",
        description: "Please sign in before starting automatic analysis.",
      });
      navigate("/login");
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await apiJson<unknown>("/ai/analyze/automatic", { method: "POST" });
      toast.success({
        title: "Phân tích tự động đã bắt đầu",
        description: "Hệ thống đang xử lý ảnh mới nhất trên cloud.",
      });
      if (res && typeof res === "object" && "analysisId" in (res as any)) {
        const id = (res as any).analysisId;
        if (id != null) {
          toast.info({
            title: "Đã tạo bản ghi phân tích",
            description: `Mã phân tích: #${id}`,
          });
        }
      }
      await loadImages();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Auto analyze failed";
      toast.destructive({
        title: "Phân tích tự động thất bại",
        description: message || "Không thể phân tích ảnh mới nhất. Vui lòng thử lại.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <UserPageShell
      eyebrow="Auto Analyze"
      title="Review cloud uploads and trigger automatic analysis"
      description="This screen tracks images uploaded from Airtest or cloud automation, then lets you start analysis on the newest capture without leaving the page."
      backHref="/"
      actions={
        <button
          type="button"
          onClick={handleAnalyzeLatest}
          disabled={isAnalyzing}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-teal-500/20 transition hover:shadow-teal-500/30 disabled:opacity-70"
        >
          <Sparkles className="h-4 w-4" />
          {isAnalyzing ? "Analyzing..." : "Analyze Latest"}
        </button>
      }
      aside={
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Images</p>
            <p className="mt-2 text-4xl font-black text-slate-950">{state.images.length}</p>
          </div>
          <div className="rounded-3xl border border-teal-100 bg-teal-500/10 p-4">
            <div className="flex items-center gap-2 text-slate-900">
              <CloudUpload className="h-4 w-4 text-teal-600" />
              <p className="text-sm font-black">Automation state</p>
            </div>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
              New screenshots appear here after cloud upload. Run the latest analysis once the queue is ready.
            </p>
          </div>
        </div>
      }
      contentClassName="max-w-7xl"
    >
      <div className="mb-6 rounded-3xl border border-slate-200 bg-white/90 px-5 py-4 shadow-sm">
        <p className="text-sm font-medium text-slate-600">
          List of images uploaded from the cloud.
        </p>
      </div>

      {state.isLoading ? (
        <div className="rounded-3xl border border-teal-100 bg-white/80 px-6 py-5 font-semibold text-teal-700 shadow-sm">
          Loading images...
        </div>
      ) : null}

      {state.error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-5 font-semibold text-red-700 shadow-sm">
          {state.error}
        </div>
      ) : null}

      {!state.isLoading && !state.error && state.images.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white/80 px-6 py-5 font-semibold text-slate-700 shadow-sm">
          No images available.
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {state.images.map((src, idx) => (
          <div
            key={`${src}-${idx}`}
            className="group overflow-hidden rounded-[2rem] border border-teal-100 bg-white shadow-[0_24px_80px_rgba(14,116,144,0.12)] transition hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(14,116,144,0.18)]"
          >
            <div className="aspect-[4/3] overflow-hidden bg-teal-50">
              <img
                src={src}
                alt={`Auto upload ${idx + 1}`}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="px-5 py-4">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-600">Auto #{idx + 1}</p>
              <p className="mt-2 text-xs text-slate-500 truncate">{src}</p>
            </div>
          </div>
        ))}
      </div>
    </UserPageShell>
  );
};

export default Auto;
