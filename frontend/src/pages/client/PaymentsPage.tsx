/**
 * PaymentsPage — Historique des paiements Orange Money.
 * Affiche la liste paginée des transactions avec statuts, détails booking/véhicule.
 */

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { AppShell } from "../../components/AppShell";

// ── Types ───────────────────────────────────────────────────────────────────

interface PaymentItem {
  id: string;
  amount: string | number;
  currency: string;
  provider: string;
  status: string;
  phone: string;
  providerTxId: string | null;
  paidAt: string | null;
  createdAt: string;
  metadata: {
    type?: string;
    level?: string;
    vehicleId?: string;
    simulated?: boolean;
  } | null;
  booking: {
    id: string;
    totalAmountGnf: number;
    startDate: string;
    endDate: string;
    status: string;
    vehicle: { brand: string; model: string };
  } | null;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ── Constantes ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  PAID: { label: "Payé", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", icon: "✅" },
  PENDING: { label: "En attente", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", icon: "⏳" },
  PROCESSING: { label: "En cours", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", icon: "🔄" },
  FAILED: { label: "Échoué", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300", icon: "❌" },
  REFUNDED: { label: "Remboursé", color: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300", icon: "↩️" },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatGNF(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("fr-GN").format(num) + " GNF";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Composant ───────────────────────────────────────────────────────────────

export function PaymentsPage() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchPayments = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/payments/history?page=${page}&pageSize=10`, { credentials: "include" });
      const json = await res.json();
      if (json.status === "ok") {
        setPayments(json.data.items);
        setPagination(json.data.pagination);
      } else {
        setError(json.message || "Erreur de chargement");
      }
    } catch {
      setError("Impossible de charger l'historique des paiements.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments(1);
  }, [fetchPayments]);

  // ── Résumé rapide ──
  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((acc, p) => acc + (typeof p.amount === "string" ? parseFloat(p.amount) : p.amount), 0);
  const totalPending = payments
    .filter((p) => p.status === "PENDING" || p.status === "PROCESSING")
    .reduce((acc, p) => acc + (typeof p.amount === "string" ? parseFloat(p.amount) : p.amount), 0);
  const paidCount = payments.filter((p) => p.status === "PAID").length;

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-black sm:text-3xl">
          💰 {t("payments.title", { defaultValue: "Mes paiements" })}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {t("payments.subtitle", { defaultValue: "Consultez l'historique de vos transactions Orange Money." })}
        </p>

        {/* ── Cartes résumé ── */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("payments.totalPaid", { defaultValue: "Total payé" })}
            </p>
            <p className="mt-1 text-xl font-black text-emerald-600 dark:text-emerald-400">
              {formatGNF(totalPaid)}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">{paidCount} {t("payments.transactions", { defaultValue: "transaction(s)" })}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("payments.pending", { defaultValue: "En attente" })}
            </p>
            <p className="mt-1 text-xl font-black text-amber-600 dark:text-amber-400">
              {formatGNF(totalPending)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("payments.totalTransactions", { defaultValue: "Total transactions" })}
            </p>
            <p className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100">
              {pagination.total}
            </p>
          </div>
        </div>

        {/* ── Liste des paiements ── */}
        <div className="mt-6">
          {loading && payments.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              <span className="ml-3 text-slate-500 dark:text-slate-400">
                {t("payments.loading", { defaultValue: "Chargement…" })}
              </span>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-500/10">
              <p className="text-red-700 dark:text-red-300">{error}</p>
              <button
                onClick={() => fetchPayments(pagination.page)}
                className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
              >
                {t("payments.retry", { defaultValue: "Réessayer" })}
              </button>
            </div>
          ) : payments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t("payments.noPayments", { defaultValue: "Aucun paiement" })}
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {t("payments.noPaymentsDesc", { defaultValue: "Vos transactions Orange Money apparaîtront ici." })}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => {
                const status = STATUS_CONFIG[p.status] || STATUS_CONFIG.PENDING;
                const isBoost = p.metadata?.type === "BOOST";
                const isExpanded = expandedId === p.id;

                return (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                  >
                    {/* Ligne principale */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : p.id)}
                      className="flex w-full items-center justify-between p-4 text-left sm:p-5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{isBoost ? "🚀" : "🚗"}</span>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            {isBoost
                              ? `Boost ${p.metadata?.level || ""}`
                              : p.booking
                                ? `${p.booking.vehicle.brand} ${p.booking.vehicle.model}`
                                : t("payments.unknownVehicle", { defaultValue: "Véhicule inconnu" })}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(p.createdAt)}
                            {p.phone && ` · ${p.phone}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${status.color}`}>
                          {status.icon} {status.label}
                        </span>
                        <p className="text-right font-black text-slate-900 dark:text-slate-100">
                          {formatGNF(p.amount)}
                        </p>
                      </div>
                    </button>

                    {/* Détails expandables */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 px-5 pb-4 pt-3 dark:border-slate-800">
                        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                          <div>
                            <dt className="text-xs font-bold uppercase text-slate-400">ID</dt>
                            <dd className="mt-0.5 font-mono text-xs text-slate-600 dark:text-slate-300">
                              {p.id.slice(0, 8)}…
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-bold uppercase text-slate-400">
                              {t("payments.provider", { defaultValue: "Fournisseur" })}
                            </dt>
                            <dd className="mt-0.5 font-semibold text-slate-700 dark:text-slate-200">
                              {p.provider === "ORANGE_MONEY" ? "Orange Money" : p.provider}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-bold uppercase text-slate-400">
                              {t("payments.phone", { defaultValue: "Téléphone" })}
                            </dt>
                            <dd className="mt-0.5 font-semibold text-slate-700 dark:text-slate-200">{p.phone}</dd>
                          </div>
                          {p.providerTxId && (
                            <div>
                              <dt className="text-xs font-bold uppercase text-slate-400">
                                {t("payments.txId", { defaultValue: "Réf. transaction" })}
                              </dt>
                              <dd className="mt-0.5 font-mono text-xs text-slate-600 dark:text-slate-300">
                                {p.providerTxId}
                              </dd>
                            </div>
                          )}
                          {p.paidAt && (
                            <div>
                              <dt className="text-xs font-bold uppercase text-slate-400">
                                {t("payments.paidAt", { defaultValue: "Payé le" })}
                              </dt>
                              <dd className="mt-0.5 text-slate-700 dark:text-slate-200">{formatDate(p.paidAt)}</dd>
                            </div>
                          )}
                          {p.booking && (
                            <>
                              <div>
                                <dt className="text-xs font-bold uppercase text-slate-400">
                                  {t("payments.bookingDates", { defaultValue: "Dates réservation" })}
                                </dt>
                                <dd className="mt-0.5 text-slate-700 dark:text-slate-200">
                                  {formatDateShort(p.booking.startDate)} → {formatDateShort(p.booking.endDate)}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-xs font-bold uppercase text-slate-400">
                                  {t("payments.bookingStatus", { defaultValue: "Statut réservation" })}
                                </dt>
                                <dd className="mt-0.5 text-slate-700 dark:text-slate-200">
                                  {p.booking.status}
                                </dd>
                              </div>
                            </>
                          )}
                          {p.metadata?.simulated && (
                            <div className="sm:col-span-3">
                              <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                ⚠️ {t("payments.simulated", { defaultValue: "Paiement simulé (mode démo)" })}
                              </span>
                            </div>
                          )}
                        </dl>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => fetchPayments(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              ← {t("pagination.prev", { defaultValue: "Précédent" })}
            </button>
            <span className="px-3 text-sm text-slate-500 dark:text-slate-400">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchPayments(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {t("pagination.next", { defaultValue: "Suivant" })} →
            </button>
          </div>
        )}
      </main>
    </AppShell>
  );
}
