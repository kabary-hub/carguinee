import { useTranslation } from "react-i18next";
import { apiFetch } from "../../lib/api";
import type { ReportItem } from "./adminTypes";

type Props = {
  reports: ReportItem[];
  setReports: React.Dispatch<React.SetStateAction<ReportItem[]>>;
  showToast: (msg: string, type?: string) => void;
};

export function AdminReportsTab({ reports, setReports, showToast }: Props) {
  const { t } = useTranslation();

  return (
    <section className="mt-6">
      <h2 className="text-lg font-black">📋 {t("admin.dashboard.reportsTitle", { count: reports.length })}</h2>
      <div className="mt-4 space-y-3">
        {reports.map((report) => (
          <article key={report.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
                  onClick={async () => {
                    try {
                      await apiFetch(`/api/admin/reports/${report.id}/resolve`, {
                        method: "PATCH",
                        body: JSON.stringify({ status: "RESOLVED" }),
                      });
                      setReports((prev) => prev.map((r) => r.id === report.id ? { ...r, status: "RESOLVED" } : r));
                      showToast("Signalement résolu.", "success");
                    } catch {
                      showToast("Erreur lors de la résolution.", "error");
                    }
                  }}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  ✅ Résoudre
                </button>
                <button
                  onClick={async () => {
                    try {
                      await apiFetch(`/api/admin/reports/${report.id}/resolve`, {
                        method: "PATCH",
                        body: JSON.stringify({ status: "DISMISSED" }),
                      });
                      setReports((prev) => prev.map((r) => r.id === report.id ? { ...r, status: "DISMISSED" } : r));
                      showToast("Signalement rejeté.", "success");
                    } catch {
                      showToast("Erreur lors du rejet.", "error");
                    }
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  ❌ Rejeter
                </button>
                {report.targetType === "USER" && (
                  <button
                    onClick={async () => {
                      if (!window.confirm("Bannir cet utilisateur ? Son compte sera désactivé.")) return;
                      try {
                        await apiFetch(`/api/admin/reports/${report.id}/ban-user`, { method: "PATCH" });
                        setReports((prev) => prev.map((r) => r.id === report.id ? { ...r, status: "RESOLVED" } : r));
                        showToast("Utilisateur banni.", "success");
                      } catch {
                        showToast("Erreur lors du bannissement.", "error");
                      }
                    }}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
                  >
                    🚫 Bannir l'utilisateur
                  </button>
                )}
                {report.targetType === "VEHICLE" && (
                  <button
                    onClick={async () => {
                      if (!window.confirm("Suspendre ce véhicule ? Sa publication sera archivée.")) return;
                      try {
                        await apiFetch(`/api/admin/reports/${report.id}/suspend-vehicle`, { method: "PATCH" });
                        setReports((prev) => prev.map((r) => r.id === report.id ? { ...r, status: "RESOLVED" } : r));
                        showToast("Véhicule suspendu.", "success");
                      } catch {
                        showToast("Erreur lors de la suspension.", "error");
                      }
                    }}
                    className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-700"
                  >
                    ⛔ Suspendre le véhicule
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
    </section>
  );
}
