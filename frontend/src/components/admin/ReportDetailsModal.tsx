import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { ReportItem } from "./adminTypes";
import { useToast } from "../../contexts/ToastContext";

type Props = {
  report: ReportItem;
  onClose: () => void;
  onResolve: (reportId: string) => void;
  onDismiss: (reportId: string) => void;
  onBanUser: (reportId: string) => void;
  onSuspendVehicle: (reportId: string) => void;
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  RESOLVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  DISMISSED: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const TARGET_I18N: Record<string, string> = {
  VEHICLE: "admin.reports.targetVehicle",
  USER: "admin.reports.targetUser",
  BOOKING: "admin.reports.targetBooking",
};

export function ReportDetailsModal({
  report,
  onClose,
  onResolve,
  onDismiss,
  onBanUser,
  onSuspendVehicle,
}: Props) {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const detail = (label: string, value: React.ReactNode) => (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </p>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("admin.reports.detailsTitle")}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
              📋 {t("admin.reports.detailsTitle")}
            </h2>
            <div className="mt-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[report.status] ?? STATUS_STYLES.PENDING}`}>
                {report.status}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label={t("common.close")}
          >
            ✕
          </button>
        </div>

        {/* Détails */}
        <div className="mt-5 grid grid-cols-2 gap-4">
          {detail(t("admin.reports.colReason"), report.reason)}
          {detail(
            t("admin.reports.colTargetType"),
            TARGET_I18N[report.targetType] ? t(TARGET_I18N[report.targetType]) : report.targetType,
          )}
          {detail(
            t("admin.reports.colTargetId"),
            <span className="font-mono text-xs">{report.targetId}</span>,
          )}
          {detail(
            t("admin.reports.colDate"),
            new Date(report.createdAt).toLocaleDateString("fr-FR", {
              dateStyle: "medium",
              timeStyle: "short",
            }),
          )}
        </div>

        {/* Description */}
        {report.description && (
          <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("admin.reports.description")}
            </p>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">
              {report.description}
            </p>
          </div>
        )}

        {/* Signaleur */}
        <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("admin.reports.colReporter")}
          </p>
          <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
            {report.reporter.firstName} {report.reporter.lastName}
          </p>
          {report.reporter.phone && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {report.reporter.phone}
            </p>
          )}
        </div>

        {/* Actions */}
        {report.status === "PENDING" && (
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {t("common.close")}
            </button>
            <button
              type="button"
              onClick={() => { onDismiss(report.id); onClose(); }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              ❌ {t("admin.reports.dismiss")}
            </button>
            <button
              type="button"
              onClick={() => { onResolve(report.id); onClose(); }}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
            >
              ✅ {t("admin.reports.resolve")}
            </button>
          </div>
        )}

        {report.status === "PENDING" && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            {report.targetType === "USER" && (
              <button
                type="button"
                onClick={() => { onBanUser(report.id); onClose(); }}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
              >
                🚫 {t("admin.reports.banUser")}
              </button>
            )}
            {report.targetType === "VEHICLE" && (
              <button
                type="button"
                onClick={() => { onSuspendVehicle(report.id); onClose(); }}
                className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-700"
              >
                ⛔ {t("admin.reports.suspendVehicle")}
              </button>
            )}
            {report.targetType === "VEHICLE" && (
              <Link
                to={`/vehicules/${report.targetId}`}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {t("admin.reports.viewVehicle")}
              </Link>
            )}
            {report.targetType === "USER" && (
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                onClick={() => {
                  navigator.clipboard.writeText(report.targetId).then(() => {
                    showToast(t("admin.reports.idCopied"), "success");
                  }).catch(() => {});
                }}
              >
                📋 {t("admin.reports.copyUserId")}
              </button>
            )}
          </div>
        )}

        {report.status !== "PENDING" && (
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
            >
              {t("common.close")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
