import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const typeStyles: Record<string, { border: string; bg: string; title: string; desc: string; icon: string; close: string }> = {
  default: {
    border: "border-white/[0.08]",
    bg: "bg-[#0a0e1a]/80",
    title: "text-white",
    desc: "text-gray-300",
    icon: "text-gray-200",
    close: "border-white/[0.08] bg-white/[0.04] text-gray-200 hover:bg-white/[0.08]",
  },
  success: {
    border: "border-emerald-200",
    bg: "bg-emerald-50/95",
    title: "text-emerald-950",
    desc: "text-emerald-800",
    icon: "text-emerald-600",
    close: "border-emerald-200 bg-white/80 text-emerald-700 hover:bg-emerald-100",
  },
  info: {
    border: "border-cyan-200",
    bg: "bg-cyan-50/95",
    title: "text-cyan-950",
    desc: "text-cyan-800",
    icon: "text-cyan-600",
    close: "border-cyan-200 bg-white/80 text-cyan-700 hover:bg-cyan-100",
  },
  warning: {
    border: "border-amber-300",
    bg: "bg-amber-50/95",
    title: "text-amber-950",
    desc: "text-amber-800",
    icon: "text-amber-600",
    close: "border-amber-200 bg-white/80 text-amber-700 hover:bg-amber-100",
  },
  destructive: {
    border: "border-red-200",
    bg: "bg-red-50/95",
    title: "text-red-950",
    desc: "text-red-800",
    icon: "text-red-600",
    close: "border-red-200 bg-white/80 text-red-700 hover:bg-red-100",
  },
};

const typeIcons: Record<string, typeof Info> = {
  default: Info,
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  destructive: XCircle,
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
        const Icon = typeIcons[typeKey] ?? typeIcons.default;

        return (
          <div
            key={t.id}
            role="status"
            className={[
              "pointer-events-auto overflow-hidden rounded-2xl border backdrop-blur-xl shadow-2xl shadow-black/15",
              "transition-all duration-300 ease-out",
              t.open ? "opacity-100 translate-y-0 sm:translate-x-0" : "opacity-0 -translate-y-2 sm:translate-x-6",
              styles.border,
              styles.bg,
            ].join(" ")}
          >
            <div className="px-4 py-3 flex items-start gap-3">
              <div className={["mt-0.5 shrink-0", styles.icon].join(" ")}>
                <Icon className="w-5 h-5" />
              </div>

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
                className={["shrink-0 rounded-xl border p-2 transition", styles.close].join(" ")}
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

