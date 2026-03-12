import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const typeStyles: Record<string, { border: string; bg: string; title: string; desc: string }> = {
  default: {
    border: "border-white/[0.08]",
    bg: "bg-[#0a0e1a]/80",
    title: "text-white",
    desc: "text-gray-300",
  },
  success: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    title: "text-emerald-100",
    desc: "text-emerald-200/80",
  },
  info: {
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/10",
    title: "text-cyan-100",
    desc: "text-cyan-200/80",
  },
  warning: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    title: "text-amber-100",
    desc: "text-amber-200/80",
  },
  destructive: {
    border: "border-red-500/30",
    bg: "bg-red-500/10",
    title: "text-red-100",
    desc: "text-red-200/80",
  },
};

export default function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      className="fixed z-[100] top-4 right-4 left-4 sm:left-auto sm:w-[420px] flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-relevant="additions removals"
    >
      {toasts.map((t) => {
        const typeKey = t.type ?? t.variant ?? "default";
        const styles = typeStyles[typeKey] ?? typeStyles.default;

        return (
          <div
            key={t.id}
            role="status"
            className={[
              "pointer-events-auto rounded-2xl border backdrop-blur-xl shadow-2xl shadow-black/30 overflow-hidden",
              "transition-all duration-300 ease-out",
              t.open ? "opacity-100 translate-y-0 sm:translate-x-0" : "opacity-0 -translate-y-2 sm:translate-x-6",
              styles.border,
              styles.bg,
            ].join(" ")}
          >
            <div className="px-4 py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                {t.title ? (
                  <div className={["text-sm font-black leading-snug", styles.title].join(" ")}>
                    {t.title}
                  </div>
                ) : null}
                {t.description ? (
                  <div className={["mt-0.5 text-xs font-semibold leading-snug", styles.desc].join(" ")}>
                    {t.description}
                  </div>
                ) : null}
                {t.action ? <div className="mt-2">{t.action}</div> : null}
              </div>

              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-xl border border-white/[0.08] bg-white/[0.04] p-2 text-gray-200 hover:bg-white/[0.08] transition"
                aria-label="Close toast"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

