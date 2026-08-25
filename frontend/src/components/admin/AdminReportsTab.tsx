import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "../ConfirmDialog";
import { apiFetch } from "../../lib/api";
import type { ApiResponse } from "../../lib/domain";
import type { ReportItem } from "./adminTypes";
import { ReportDetailsModal } from "./ReportDetailsModal";

type Props = {
  showToast: (msg: string, type?: "success" | "error") => void;
};

const PAGE_SIZE = 10;

type PendingConfirm = {
  type: "ban-user" | "suspend-vehicle";
  reportId: string;
};

export function AdminReportsTab({ showToast }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  const { data: result, isLoading: loading } = useQuery({
    queryKey: ["admin", "reports", page],
    queryFn: () =>
      apiFetch<ApiResponse<{ items: ReportItem[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>>(
        `/api/admin/reports?page=${page}&pageSize=${PAGE_SIZE}`,
      ),
    select: (res) => res.data,
    placeholderData: (prev) => prev,
  });

  const reports = result?.items ?? [];
  const pagination = result?.pagination ?? null;

  const executeAction = async () => {
    if (!pendingConfirm) return;
    const { type, reportId } = pendingConfirm;
    setPendingConfirm(null);

    try {
      if (type === "ban-user") {
        await apiFetch(`/api/admin/reports/${reportId}/ban-user`, { method: "PATCH" });
        await queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
        showToast(t("admin.reports.userBanned"), "success");
      } else if (type === "suspend-vehicle") {
        await apiFetch(`/api/admin/reports/${reportId}/suspend-vehicle`, { method: "PATCH" });
        await queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
        showToast(t("admin.reports.vehicleSuspended"), "success");
      }
    } catch {
      showToast(t("admin.reports.actionError"), "error");
    }
  };

  if (loading) {
    return (
      <section className="mt-6">
        <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          {t("common.loading")}
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6">
      <h2 className="text-lg font-black">📋 {t("admin.dashboard.reportsTitle", { count: pagination?.total ?? reports.length })}</h2>
      <div className="mt-4 space-y-3">
        {reports.map((report) => (
          <article key={report.id} onClick={() => setSelectedReport(report)} className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{report.reason}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {report.reporter.firstName} {report.reporter.lastName} · {report.targetType} ·
                  {new Date(report.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                report.status === "PENDING" ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                : report.status === "RESOLVED" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              }`}>
                {report.status}
              </span>
            </div>
            {report.status === "PENDING" && (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <button
                  onClick={(e) => { e.stopPropagation(); void (async () => {
                    try {
                      await apiFetch(`/api/admin/reports/${report.id}/resolve`, {
                        method: "PATCH",
                        body: JSON.stringify({ status: "RESOLVED" }),
                      });
                      await queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
                      showToast(t("admin.reports.resolved"), "success");
                    } catch {
                      showToast(t("admin.reports.resolveError"), "error");
                    }
                  })(); }}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  ✅ {t("admin.reports.resolve")}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); void (async () => {
                    try {
                      await apiFetch(`/api/admin/reports/${report.id}/resolve`, {
                        method: "PATCH",
                        body: JSON.stringify({ status: "DISMISSED" }),
                      });
                      await queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
                      showToast(t("admin.reports.dismissed"), "success");
                    } catch {
                      showToast(t("admin.reports.dismissError"), "error");
                    }
                  })(); }}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  ❌ {t("admin.reports.dismiss")}
                </button>
                {report.targetType === "USER" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setPendingConfirm({ type: "ban-user", reportId: report.id }); }}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
                  >
                    🚫 {t("admin.reports.banUser")}
                  </button>
                )}
                {report.targetType === "VEHICLE" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setPendingConfirm({ type: "suspend-vehicle", reportId: report.id }); }}
                    className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-700"
                  >
                    ⛔ {t("admin.reports.suspendVehicle")}
                  </button>
                )}
              </div>
            )}
          </article>
        ))}
        {reports.length === 0 && (
          <p className="rounded-xl bg-slate-100 p-5 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {t("admin.dashboard.noReports")}
          </p>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Page {pagination.page}/{pagination.totalPages} · {pagination.total} signalement(s)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
            >
              ← Précédent
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
            >
              Suivant →
            </button>
          </div>
        </div>
      )}

      {/* Modale détails du signalement */}
      {selectedReport && (
        <ReportDetailsModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onResolve={async (reportId) => {
            try {
              await apiFetch(`/api/admin/reports/${reportId}/resolve`, {
                method: "PATCH",
                body: JSON.stringify({ status: "RESOLVED" }),
              });
              await queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
              showToast(t("admin.reports.resolved"), "success");
            } catch {
              showToast(t("admin.reports.resolveError"), "error");
            }
          }}
          onDismiss={async (reportId) => {
            try {
              await apiFetch(`/api/admin/reports/${reportId}/resolve`, {
                method: "PATCH",
                body: JSON.stringify({ status: "DISMISSED" }),
              });
              await queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
              showToast(t("admin.reports.dismissed"), "success");
            } catch {
              showToast(t("admin.reports.dismissError"), "error");
            }
          }}
          onBanUser={(reportId) => setPendingConfirm({ type: "ban-user", reportId })}
          onSuspendVehicle={(reportId) => setPendingConfirm({ type: "suspend-vehicle", reportId })}
        />
      )}

      {/* Modales de confirmation */}
      {pendingConfirm?.type === "ban-user" && (
        <ConfirmDialog
          open
          title={t("admin.reports.banUserTitle")}
          message={t("admin.reports.banUserMessage")}
          confirmLabel={t("admin.reports.banUser")}
          tone="rose"
          requireReason
          onConfirm={executeAction}
          onCancel={() => setPendingConfirm(null)}
        />
      )}
      {pendingConfirm?.type === "suspend-vehicle" && (
        <ConfirmDialog
          open
          title={t("admin.reports.suspendVehicleTitle")}
          message={t("admin.reports.suspendVehicleMessage")}
          confirmLabel={t("admin.reports.suspendVehicle")}
          tone="rose"
          requireReason
          onConfirm={executeAction}
          onCancel={() => setPendingConfirm(null)}
        />
      )}
    </section>
  );
}
