import { ShieldAlert, X } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger";
  isBusy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  variant = "default",
  isBusy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmClasses =
    variant === "danger"
      ? "bg-gradient-to-r from-red-600 to-rose-500 shadow-red-500/20 hover:brightness-110"
      : "bg-gradient-to-r from-teal-600 to-cyan-500 shadow-teal-500/20 hover:brightness-110";

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-md rounded-3xl border border-white/[0.10] bg-[#0a0e1a]/90 backdrop-blur-2xl shadow-2xl shadow-black/40 overflow-hidden">
        <div className="p-5 sm:p-6 flex items-start gap-4">
          <div
            className={[
              "shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center border",
              variant === "danger"
                ? "bg-red-500/10 border-red-500/20 text-red-200"
                : "bg-teal-500/10 border-teal-500/20 text-teal-200",
            ].join(" ")}
          >
            <ShieldAlert className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-base sm:text-lg font-black text-white leading-snug">{title}</p>
            {description ? (
              <p className="mt-1 text-sm font-semibold text-gray-300 leading-snug">{description}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl border border-white/[0.10] bg-white/[0.04] p-2 text-gray-200 hover:bg-white/[0.08] transition"
            aria-label="Close"
            disabled={isBusy}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-2.5 text-sm font-black text-gray-200 hover:bg-white/[0.08] transition"
            disabled={isBusy}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-2xl px-4 py-2.5 text-sm font-black text-white shadow-lg transition ${confirmClasses}`}
            disabled={isBusy}
          >
            {isBusy ? "Đang xử lý..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

