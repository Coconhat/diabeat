// ── Confirm Modal ──────────────────────────────────────────────
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Top accent bar */}
        <div
          className="h-1 w-full"
          style={{
            background:
              variant === "danger"
                ? "linear-gradient(90deg, #EF4444, #DC2626)"
                : "linear-gradient(90deg, #3B82F6, #6366F1)",
          }}
        />

        <div className="px-6 pt-5 pb-6">
          {/* Icon */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
            style={{
              backgroundColor: variant === "danger" ? "#FEF2F2" : "#EFF6FF",
            }}
          >
            {variant === "danger" ? (
              <svg
                className="w-5 h-5 text-red-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-blue-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z"
                />
              </svg>
            )}
          </div>

          {/* Text */}
          <p className="text-[15px] font-bold text-gray-900 leading-snug">
            {title}
          </p>
          <p className="text-[13px] text-gray-400 mt-1.5 leading-relaxed">
            {description}
          </p>

          {/* Actions */}
          <div className="flex gap-2.5 mt-5">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style={{
                backgroundColor: variant === "danger" ? "#DC2626" : "#2563EB",
              }}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
