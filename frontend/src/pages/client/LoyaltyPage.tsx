/**
 * LoyaltyPage — Page de fidélité pour le client.
 *
 * Affiche :
 * - Le solde actuel de points
 * - L'historique des transactions (gains et dépenses)
 * - Comment gagner des points
 */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "../../components/AppShell";
import { useToast } from "../../contexts/ToastContext";
import { apiFetch } from "../../lib/api";
import { formatDate, type ApiResponse } from "../../lib/domain";
import { getHomeRouteForRole } from "../../lib/roles";
import { useAuth } from "../../contexts/AuthContext";

interface LoyaltyTransaction {
  id: string;
  points: number;
  type: string;
  description: string | null;
  referenceId: string | null;
  balance: number;
  createdAt: string;
}

const TYPE_LABELS: Record<string, { fr: string; en: string; color: string }> = {
  EARN_BOOKING: { fr: "Réservation", en: "Booking", color: "text-emerald-600 dark:text-emerald-400" },
  EARN_REFERRAL: { fr: "Parrainage", en: "Referral", color: "text-blue-600 dark:text-blue-400" },
  EARN_REVIEW: { fr: "Avis", en: "Review", color: "text-amber-600 dark:text-amber-400" },
  SPEND_DISCOUNT: { fr: "Réduction", en: "Discount", color: "text-rose-600 dark:text-rose-400" },
};

export function LoyaltyPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const isFr = i18n.language?.startsWith("fr");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [pointsRes, historyRes] = await Promise.all([
          apiFetch<ApiResponse<{ points: number }>>("/api/loyalty/points"),
          apiFetch<ApiResponse<LoyaltyTransaction[]>>("/api/loyalty/history"),
        ]);
        setPoints(pointsRes.data.points);
        setHistory(historyRes.data);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Erreur de chargement", "error");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <button
          onClick={() => navigate(getHomeRouteForRole(user?.role ?? "CLIENT"))}
          className="flex items-center gap-1 text-sm font-bold text-emerald-700 dark:text-emerald-400"
        >
          ← {t("common.back")}
        </button>

        <h1 className="mt-4 text-2xl font-black sm:text-3xl">
          {t("loyalty.title", { defaultValue: "Programme de fidélité" })}
        </h1>

        {/* ── Solde ── */}
        <div className="mt-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 text-white shadow-lg shadow-emerald-500/20 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider opacity-80">
            {t("loyalty.yourPoints", { defaultValue: "Vos points" })}
          </p>
          <p className="mt-2 text-5xl font-black">{points.toLocaleString()}</p>
          <p className="mt-2 text-sm opacity-80">
            {t("loyalty.pointsExplanation", { defaultValue: "10 points gagnés par réservation confirmée" })}
          </p>
        </div>

        {/* ── Comment gagner des points ── */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("loyalty.howToEarn", { defaultValue: "Comment gagner des points" })}
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-emerald-50 p-4 text-center dark:bg-emerald-500/10">
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">+10</p>
              <p className="mt-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                {t("loyalty.bookingPoints", { defaultValue: "Par réservation" })}
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 p-4 text-center dark:bg-blue-500/10">
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400">+50</p>
              <p className="mt-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                {t("loyalty.referralPoints", { defaultValue: "Par parrainage" })}
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4 text-center dark:bg-amber-500/10">
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">+5</p>
              <p className="mt-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                {t("loyalty.reviewPoints", { defaultValue: "Par avis" })}
              </p>
            </div>
          </div>
        </div>

        {/* ── Historique ── */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("loyalty.history", { defaultValue: "Historique des points" })}
          </h2>

          {loading && (
            <div className="flex items-center justify-center py-10">
              <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
            </div>
          )}

          {!loading && history.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              {t("loyalty.noHistory", { defaultValue: "Aucune transaction pour le moment." })}
            </p>
          )}

          {!loading && history.length > 0 && (
            <div className="mt-4 space-y-3">
              {history.map((tx) => {
                const label = TYPE_LABELS[tx.type] ?? { fr: tx.type, en: tx.type, color: "text-slate-600 dark:text-slate-400" };
                const isGain = tx.points > 0;
                return (
                  <div key={tx.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                    <div>
                      <p className={`text-xs font-bold uppercase ${label.color}`}>
                        {isFr ? label.fr : label.en}
                      </p>
                      {tx.description && (
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{tx.description}</p>
                      )}
                      <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                        {formatDate(tx.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-black ${isGain ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {isGain ? "+" : ""}{tx.points}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        {t("loyalty.balance", { defaultValue: "Solde" })} : {tx.balance}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Lien parrainage ── */}
        <div className="mt-6 rounded-2xl border-2 border-blue-200 bg-blue-50 p-5 shadow-sm dark:border-blue-800 dark:bg-blue-500/10">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            {t("loyalty.inviteTitle", { defaultValue: "Parrainez vos amis" })}
          </p>
          <p className="mt-2 text-sm text-blue-800 dark:text-blue-200">
            {t("loyalty.inviteDescription", { defaultValue: "Gagnez 50 points pour chaque ami qui s'inscrit et effectue sa première réservation." })}
          </p>
          <Link
            to="/parrainage"
            className="mt-3 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {t("loyalty.inviteButton", { defaultValue: "Inviter un ami" })}
          </Link>
        </div>
      </main>
    </AppShell>
  );
}
