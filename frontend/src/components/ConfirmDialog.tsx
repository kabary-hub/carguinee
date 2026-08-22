import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: "emerald" | "rose" | "amber";
  requireReason?: boolean;
  reasonPlaceholder?: string;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  tone = "emerald",
  requireReason = false,
  reasonPlaceholder,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  const resolvedConfirmLabel = confirmLabel || t("confirmDialog.confirm");
  const resolvedReasonPlaceholder = reasonPlaceholder || t("confirmDialog.reasonPlaceholder");

  useEffect(() => {
    if (open) {
      setReason("");
      setTouched(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const reasonError = requireReason && touched && reason.trim().length === 0;

  const submit = () => {
    if (requireReason && reason.trim().length === 0) {
      setTouched(true);
      return;
    }
    onConfirm(requireReason ? reason.trim() : undefined);
  };

  const buttonTone =
    tone === "rose"
      ? "bg-rose-600 hover:bg-rose-700"
      : tone === "amber"
        ? "bg-amber-600 hover:bg-amber-700"
        : "bg-emerald-600 hover:bg-emerald-700";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
          {message}
        </p>

        {requireReason && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("confirmDialog.reasonLabel")}
              <textarea
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setTouched(true);
                }}
                rows={3}
                placeholder={resolvedReasonPlaceholder}
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 ${
                  reasonError
                    ? "border-rose-400"
                    : "border-slate-300"
                }`}
              />
            </label>
            {reasonError && (
              <p className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                {t("confirmDialog.reasonRequired")}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {t("confirmDialog.cancel")}
          </button>
          <button
            type="button"
            onClick={submit}
            className={`rounded-lg px-4 py-2 text-sm font-bold text-white ${buttonTone}`}
          >
            {resolvedConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
