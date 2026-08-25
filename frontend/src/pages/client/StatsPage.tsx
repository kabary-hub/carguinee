/**
 * StatsPage — Statistiques avec graphiques réels.
 * Client : réservations, dépenses, favoris, fidélité
 * Propriétaire : revenus, occupation, véhicules, top véhicules
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "../../components/AppShell";
import { useAuth } from "../../contexts/AuthContext";
import { SkeletonBar, SkeletonCard, SkeletonCardBlock, SkeletonListRow } from "../../components/ui";
import { apiFetch } from "../../lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

// ── Types ───────────────────────────────────────────────────────────────────

interface OwnerStats {
  role: "PROPRIETAIRE";
  summary: {
    totalVehicles: number;
    publishedVehicles: number;
    totalBookings: number;
    totalRevenue: number;
    occupancyRate: number;
    confirmedBookings: number;
  };
  bookingsByStatus: Record<string, number>;
  monthlyData: { month: string; count: number; revenue: number }[];
  topVehicles: {
    vehicleId: string;
    _count: { _all: number };
    _sum: { totalAmountGnf: number | null };
    vehicle: { brand: string; model: string } | null;
  }[];
  recentBookings: {
    id: string;
    status: string;
    totalAmountGnf: number;
    createdAt: string;
    vehicle: { brand: string; model: string };
    customer: { firstName: string; lastName: string };
  }[];
}

interface ClientStats {
  role: "CLIENT";
  summary: {
    totalBookings: number;
    totalSpent: number;
    favoriteCount: number;
    loyaltyPoints: number;
  };
  bookingsByStatus: Record<string, number>;
  monthlyData: { month: string; count: number }[];
  recentBookings: {
    id: string;
    status: string;
    totalAmountGnf: number;
    createdAt: string;
    vehicle: { brand: string; model: string; commune: string };
  }[];
}

type Stats = OwnerStats | ClientStats;

// ── Palette ─────────────────────────────────────────────────────────────────

const COLORS = {
  CONFIRMEE: "#10b981",
  EN_COURS: "#3b82f6",
  TERMINEE: "#6366f1",
  EN_ATTENTE: "#f59e0b",
  REJETEE: "#ef4444",
  ANNULEE: "#94a3b8",
};

const PIE_COLORS = ["#10b981", "#3b82f6", "#6366f1", "#f59e0b", "#ef4444", "#94a3b8"];

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatGNF(amount: number) {
  return new Intl.NumberFormat("fr-GN").format(amount) + " GNF";
}

function formatMonth(m: string) {
  const [year, month] = m.split("-");
  const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  return `${months[parseInt(month, 10) - 1]} ${year.slice(2)}`;
}

// ── Export CSV ──────────────────────────────────────────────────────────────

function exportCSV(stats: Stats) {
  const lines: string[] = [];
  const isOwner = stats.role === "PROPRIETAIRE";

  if (isOwner) {
    const s = stats.summary;
    lines.push("Propriétaire - Statistiques");
    lines.push("");
    lines.push("Métrique,Valeur");
    lines.push(`Véhicules publiés,${s.publishedVehicles}`);
    lines.push(`Véhicules total,${s.totalVehicles}`);
    lines.push(`Réservations,${s.totalBookings}`);
    lines.push(`Réservations confirmées,${s.confirmedBookings}`);
    lines.push(`Revenu total,${s.totalRevenue}`);
    lines.push(`Taux d'occupation,${s.occupancyRate}%`);
    lines.push("");
    lines.push("Statut,Nombre");
    for (const [status, count] of Object.entries(stats.bookingsByStatus)) {
      lines.push(`${STATUS_LABELS[status] || status},${count}`);
    }
    lines.push("");
    lines.push("Mois,Réservations,Revenu");
    for (const m of stats.monthlyData) {
      lines.push(`${m.month},${m.count},${(m as { revenue: number }).revenue}`);
    }
  } else {
    const s = stats.summary;
    lines.push("Client - Statistiques");
    lines.push("");
    lines.push("Métrique,Valeur");
    lines.push(`Réservations,${s.totalBookings}`);
    lines.push(`Dépensé,${s.totalSpent}`);
    lines.push(`Favoris,${s.favoriteCount}`);
    lines.push(`Points fidélité,${s.loyaltyPoints}`);
    lines.push("");
    lines.push("Statut,Nombre");
    for (const [status, count] of Object.entries(stats.bookingsByStatus)) {
      lines.push(`${STATUS_LABELS[status] || status},${count}`);
    }
    lines.push("");
    lines.push("Mois,Réservations");
    for (const m of stats.monthlyData) {
      lines.push(`${m.month},${m.count}`);
    }
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `carguinee-stats-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const STATUS_LABELS: Record<string, string> = {
  CONFIRMEE: "Confirmée",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  EN_ATTENTE: "En attente",
  REJETEE: "Rejetée",
  ANNULEE: "Annulée",
};

// ── Composant ───────────────────────────────────────────────────────────────

type Period = "7d" | "30d" | "6m";

const PERIOD_OPTIONS: { value: Period; labelKey: string; defaultLabel: string }[] = [
  { value: "7d", labelKey: "stats.period7d", defaultLabel: "7 jours" },
  { value: "30d", labelKey: "stats.period30d", defaultLabel: "30 jours" },
  { value: "6m", labelKey: "stats.period6m", defaultLabel: "6 mois" },
];

export function StatsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("6m");

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const json = await apiFetch<{ status: string; data: Stats; message?: string }>(`/api/stats?period=${period}`);
        if (json.status === "ok") setStats(json.data);
        else setError(json.message || "Erreur de chargement");
      } catch {
        setError("Impossible de charger les statistiques.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [period]);

  if (loading) {
    return (
      <AppShell>
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          {/* Titre skeleton */}
          <SkeletonBar width="200px" height={32} rounded="lg" className="mb-2" />
          <SkeletonBar width="350px" height={14} className="mb-6" />

          {/* Filtres skeleton */}
          <div className="mb-6 flex gap-2">
            <SkeletonBar width={80} height={32} rounded="full" />
            <SkeletonBar width={80} height={32} rounded="full" />
            <SkeletonBar width={80} height={32} rounded="full" />
          </div>

          {/* Cartes résumé skeleton */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <SkeletonBar width={28} height={28} rounded="lg" className="mb-2" />
                <SkeletonBar width="60%" height={10} className="mb-2" />
                <SkeletonBar width="50%" height={22} />
              </div>
            ))}
          </div>

          {/* Graphiques skeleton */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SkeletonCardBlock />
            <SkeletonCardBlock />
          </div>

          {/* Liste skeleton */}
          <div className="mt-8 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonListRow key={i} />
            ))}
          </div>
        </main>
      </AppShell>
    );
  }

  if (error || !stats) {
    return (
      <AppShell>
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <h1 className="text-2xl font-black sm:text-3xl">
            {t("stats.title", { defaultValue: "Statistiques" })}
          </h1>
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-500/10">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </main>
      </AppShell>
    );
  }

  const isOwner = stats.role === "PROPRIETAIRE";

  // Préparer les données pour les graphiques
  const monthlyBarData = stats.monthlyData.map((d) => ({
    ...d,
    label: formatMonth(d.month),
    revenue: isOwner ? (d as { revenue: number }).revenue : undefined,
  }));

  const pieData = Object.entries(stats.bookingsByStatus).map(([status, count]) => ({
    name: STATUS_LABELS[status] || status,
    value: count,
    color: COLORS[status as keyof typeof COLORS] || "#94a3b8",
  }));

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-black sm:text-3xl">
          📊 {t("stats.title", { defaultValue: "Statistiques" })}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {isOwner
            ? t("stats.ownerSubtitle", { defaultValue: "Analyse de vos revenus, véhicules et réservations." })
            : t("stats.clientSubtitle", { defaultValue: "Suivi de vos réservations, dépenses et fidélité." })}
        </p>

        {/* ── Filtres + Export ── */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
                period === opt.value
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              {t(opt.labelKey, { defaultValue: opt.defaultLabel })}
            </button>
          ))}
          <button
            onClick={() => exportCSV(stats)}
            className="ml-auto rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            📥 {t("stats.exportCsv", { defaultValue: "Export CSV" })}
          </button>
        </div>

        {/* ── Cartes résumé ── */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {isOwner ? (
            <>
              <StatCard
                icon="🚗"
                label={t("stats.publishedVehicles", { defaultValue: "Véhicules publiés" })}
                value={stats.summary.publishedVehicles}
                sub={`${stats.summary.totalVehicles} ${t("stats.total", { defaultValue: "au total" })}`}
                to="/proprietaire"
              />
              <StatCard
                icon="📋"
                label={t("stats.totalBookings", { defaultValue: "Réservations" })}
                value={stats.summary.totalBookings}
                sub={`${stats.summary.confirmedBookings} ${t("stats.confirmed", { defaultValue: "confirmées" })}`}
                to="/reservations"
              />
              <StatCard
                icon="💰"
                label={t("stats.revenue", { defaultValue: "Revenus" })}
                value={formatGNF(stats.summary.totalRevenue)}
                to="/paiements"
              />
              <StatCard
                icon="📈"
                label={t("stats.occupancy", { defaultValue: "Taux d'occupation" })}
                value={`${stats.summary.occupancyRate}%`}
                sub={t("stats.last30Days", { defaultValue: "30 derniers jours" })}
              />
            </>
          ) : (
            <>
              <StatCard
                icon="📋"
                label={t("stats.totalBookings", { defaultValue: "Réservations" })}
                value={stats.summary.totalBookings}
                to="/reservations"
              />
              <StatCard
                icon="💰"
                label={t("stats.totalSpent", { defaultValue: "Dépensé" })}
                value={formatGNF(stats.summary.totalSpent)}
                to="/paiements"
              />
              <StatCard
                icon="❤️"
                label={t("stats.favorites", { defaultValue: "Favoris" })}
                value={stats.summary.favoriteCount}
                to="/favoris"
              />
              <StatCard
                icon="⭐"
                label={t("stats.loyaltyPoints", { defaultValue: "Points fidélité" })}
                value={stats.summary.loyaltyPoints}
                to="/fidelite"
              />
            </>
          )}
        </div>

        {/* ── Graphiques ── */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Graphique barres : réservations par mois */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 font-bold text-slate-900 dark:text-slate-100">
              {t("stats.monthlyBookings", { defaultValue: "Réservations par mois" })}
            </h3>
            {monthlyBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "none",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name={t("stats.bookings", { defaultValue: "Réservations" })}
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message={t("stats.noData", { defaultValue: "Pas encore de données." })} />
            )}
          </div>

          {/* Graphique camembert : répartition par statut */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 font-bold text-slate-900 dark:text-slate-100">
              {t("stats.statusDistribution", { defaultValue: "Répartition par statut" })}
            </h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message={t("stats.noData", { defaultValue: "Pas encore de données." })} />
            )}
          </div>

          {/* Graphique lignes : évolution revenus (propriétaire) ou réservations (client) */}
          {isOwner && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
              <h3 className="mb-4 font-bold text-slate-900 dark:text-slate-100">
                {t("stats.revenueEvolution", { defaultValue: "Évolution des revenus" })}
              </h3>
              {monthlyBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={monthlyBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number) => formatGNF(value)}
                      contentStyle={{
                        borderRadius: 12,
                        border: "none",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name={t("stats.revenue", { defaultValue: "Revenus" })}
                      stroke="#6366f1"
                      strokeWidth={3}
                      dot={{ r: 5, fill: "#6366f1" }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message={t("stats.noData", { defaultValue: "Pas encore de données." })} />
              )}
            </div>
          )}
        </div>

        {/* ── Top véhicules (propriétaire) ── */}
        {isOwner && stats.topVehicles.length > 0 && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 font-bold text-slate-900 dark:text-slate-100">
              🏆 {t("stats.topVehicles", { defaultValue: "Véhicules les plus réservés" })}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <th className="pb-2 pr-4">#</th>
                    <th className="pb-2 pr-4">{t("stats.vehicle", { defaultValue: "Véhicule" })}</th>
                    <th className="pb-2 pr-4">{t("stats.bookingsCount", { defaultValue: "Réservations" })}</th>
                    <th className="pb-2">{t("stats.totalRevenue", { defaultValue: "Revenu total" })}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topVehicles.map((v, i) => (
                    <Link to={`/vehicules/${v.vehicleId}`} key={v.vehicleId} className="contents">
                    <tr className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                      <td className="py-3 pr-4 font-bold text-emerald-600 dark:text-emerald-400">{i + 1}</td>
                      <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-slate-100">
                        {v.vehicle?.brand} {v.vehicle?.model}
                      </td>
                      <td className="py-3 pr-4">{v._count._all}</td>
                      <td className="py-3 font-medium text-emerald-700 dark:text-emerald-300">
                        {formatGNF(v._sum.totalAmountGnf ?? 0)}
                      </td>
                    </tr>
                    </Link>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Dernières réservations ── */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 font-bold text-slate-900 dark:text-slate-100">
            📅 {t("stats.recentBookings", { defaultValue: "Dernières réservations" })}
          </h3>
          {stats.recentBookings.length > 0 ? (
            <div className="space-y-3">
              {stats.recentBookings.map((b) => (
                <Link
                  to="/reservations"
                  key={b.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-4 transition hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {b.vehicle.brand} {b.vehicle.model}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isOwner ? `${(b as OwnerStats["recentBookings"][0]).customer.firstName} ${(b as OwnerStats["recentBookings"][0]).customer.lastName}` : ""}
                      {!isOwner && (b as ClientStats["recentBookings"][0]).vehicle.commune}
                      {" · "}
                      {new Date(b.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                        b.status === "CONFIRMEE"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : b.status === "EN_COURS"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            : b.status === "TERMINEE"
                              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {STATUS_LABELS[b.status] || b.status}
                    </span>
                    <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                      {formatGNF(b.totalAmountGnf)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-slate-500 dark:text-slate-400">
              {t("stats.noBookings", { defaultValue: "Aucune réservation pour le moment." })}
            </p>
          )}
        </div>
      </main>
    </AppShell>
  );
}

// ── Sous-composants ─────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  to,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  to?: string;
}) {
  const cls = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:p-5";
  if (to) {
    return (
      <Link to={to} className={cls}>
        <div className="text-2xl">{icon}</div>
        <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100 sm:text-2xl">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
      </Link>
    );
  }
  return (
    <div className={cls}>
      <div className="text-2xl">{icon}</div>
      <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100 sm:text-2xl">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[250px] items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
      <p className="text-sm text-slate-400 dark:text-slate-500">{message}</p>
    </div>
  );
}
