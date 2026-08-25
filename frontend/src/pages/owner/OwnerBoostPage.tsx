/**
 * OwnerBoostPage — Page de boosting pour les propriétaires.
 *
 * Permet de :
 * 1. Sélectionner un véhicule parmi ceux du propriétaire
 * 2. Choisir un plan de boost (BASIC gratuit, PREMIUM 50 000 GNF, VIP 150 000 GNF)
 * 3. Activer le boost (gratuit ou via paiement OM)
 * 4. Voir les boosts actifs et expirés
 */

import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "../../components/AppShell";
import { StatusBadge } from "../../components/StatusBadge";
import { useToast } from "../../contexts/ToastContext";
import { apiFetch } from "../../lib/api";
import { formatGnf, formatDate, type ApiResponse, type Vehicle } from "../../lib/domain";

// ── Types ─────────────────────────────────────────────────────────────

type BoostLevel = "BASIC" | "PREMIUM" | "VIP";

interface BoostPlan {
  level: BoostLevel;
  durationDays: number;
  priceGnf: number;
  label: string;
  features: string[];
}

interface VehicleBoostInfo {
  id: string;
  vehicleId: string;
  level: BoostLevel;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

// ── Styles par niveau ─────────────────────────────────────────────────

const LEVEL_STYLES: Record<BoostLevel, { border: string; bg: string; badge: string; glow: string }> = {
  BASIC: {
    border: "border-slate-300 dark:border-slate-600",
    bg: "bg-slate-50 dark:bg-slate-800/60",
    badge: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
    glow: "",
  },
  PREMIUM: {
    border: "border-amber-400 dark:border-amber-500",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
    glow: "shadow-amber-200/50 dark:shadow-amber-500/20",
  },
  VIP: {
    border: "border-violet-500 dark:border-violet-400",
    bg: "bg-violet-50 dark:bg-violet-500/10",
    badge: "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300",
    glow: "shadow-violet-200/50 dark:shadow-violet-500/20",
  },
};

// ── Composant ─────────────────────────────────────────────────────────

export function OwnerBoostPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [plans, setPlans] = useState<BoostPlan[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [boosts, setBoosts] = useState<VehicleBoostInfo[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);

  // ── État modale de paiement ──
  const [payingPlan, setPayingPlan] = useState<BoostPlan | null>(null);
  const [payPhone, setPayPhone] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Confirmation de paiement après redirection ──
  const paymentStatus = searchParams.get("payment");
  useEffect(() => {
    if (paymentStatus === "success") {
      showToast(t("boost.paymentSuccess", { defaultValue: "Paiement confirmé ! Votre boost a été activé." }), "success");
      setSearchParams({}, { replace: true });
    }
  }, [paymentStatus, showToast, setSearchParams, t]);

  // ── Chargement initial ──
  const load = async () => {
    setLoading(true);
    try {
      const [plansRes, vehiclesRes, boostsRes] = await Promise.all([
        apiFetch<ApiResponse<BoostPlan[]>>("/api/boosting/plans"),
        apiFetch<ApiResponse<Vehicle[]>>("/api/vehicles/mine"),
        apiFetch<ApiResponse<VehicleBoostInfo[]>>("/api/boosting/my-boosts"),
      ]);
      setPlans(plansRes.data);
      setVehicles(vehiclesRes.data);
      setBoosts(boostsRes.data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erreur de chargement", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  // ── Boost d'un véhicule ──
  const getVehicleBoost = (vehicleId: string) =>
    boosts.find((b) => b.vehicleId === vehicleId && b.isActive);

  // ── Activation d'un boost (BASIC = gratuit) ──
  const handleActivateFree = async (level: BoostLevel) => {
    if (!selectedVehicleId) {
      showToast("Sélectionnez d'abord un véhicule", "error");
      return;
    }
    setActivating(true);
    try {
      await apiFetch("/api/boosting/activate", {
        method: "POST",
        body: JSON.stringify({ vehicleId: selectedVehicleId, level }),
      });
      showToast(`Boost ${level} activé avec succès !`);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erreur d'activation", "error");
    } finally {
      setActivating(false);
    }
  };

  // ── Ouvrir la modale de paiement pour un plan payant ──
  const openPayModal = (plan: BoostPlan) => {
    if (!selectedVehicleId) {
      showToast("Sélectionnez d'abord un véhicule", "error");
      return;
    }
    setPayingPlan(plan);
    setPayPhone("");
    setPayError("");
  };

  // ── Payer puis activer le boost ──
  const handlePayAndActivate = async () => {
    if (!payingPlan || !selectedVehicleId) return;
    if (!payPhone || payPhone.length < 8) {
      setPayError("Numéro de téléphone invalide");
      return;
    }

    setPayLoading(true);
    setPayError("");

    try {
      // 1. Créer un "fake booking" pour le paiement OU utiliser un endpoint dédié boost
      // Pour l'instant, on crée un paiement direct via l'endpoint payments
      // avec un bookingId factice (le boost n'est pas un booking)
      // TODO : Créer un endpoint POST /api/payments/boost dédié
      
      // En mode simulation (pas de clés OM), le paiement est confirmé directement
      const paymentRes = await apiFetch<{ status: string; data: { pay_token: string; payment_url: string } }>("/api/payments/boost", {
        method: "POST",
        body: JSON.stringify({
          vehicleId: selectedVehicleId,
          level: payingPlan.level,
          amount: payingPlan.priceGnf,
          phone: payPhone,
        }),
      });

      if (paymentRes.status === "ok") {
        // 2. Le paiement est confirmé (mode simulation) ou en attente (mode réel)
        // En mode simulation, on peut activer directement
        // En mode réel, il faudrait vérifier le statut du paiement
        
        // Activer le boost avec le paymentId
        // Le pay_token sert de paymentId en mode simulation
        await apiFetch("/api/boosting/activate", {
          method: "POST",
          body: JSON.stringify({
            vehicleId: selectedVehicleId,
            level: payingPlan.level,
            paymentId: paymentRes.data.pay_token, // En prod, c'est le vrai payment UUID
          }),
        });

        showToast(`Boost ${payingPlan.level} activé avec succès !`);
        setPayingPlan(null);
        await load();
      }
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Erreur de paiement");
    } finally {
      setPayLoading(false);
    }
  };

  // ── Annulation d'un boost ──
  const handleCancel = async (boostId: string) => {
    try {
      await apiFetch(`/api/boosting/cancel/${boostId}`, { method: "POST" });
      showToast("Boost annulé.");
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erreur d'annulation", "error");
    }
  };

  if (loading) {
    return (
      <AppShell>
        <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <div className="flex items-center justify-center py-20">
            <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-emerald-600" />
          </div>
        </main>
      </AppShell>
    );
  }

  const pubVehicles = vehicles.filter((v) => v.publicationStatus === "PUBLIEE");

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {/* Retour */}
        <Link to="/proprietaire" className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
          ← {t("common.back")}
        </Link>

        <h1 className="mt-4 text-2xl font-black sm:text-3xl">
          {t("boost.title", { defaultValue: "Booster mes véhicules" })}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {t("boost.subtitle", { defaultValue: "Mettez en avant vos véhicules pour attirer plus de clients." })}
        </p>

        {/* ── Sélection du véhicule ── */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("boost.selectVehicle", { defaultValue: "Sélectionnez un véhicule" })}
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {pubVehicles.map((v) => {
              const activeBoost = getVehicleBoost(v.id);
              const isSelected = selectedVehicleId === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVehicleId(v.id)}
                  className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-500/15"
                      : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{v.brand} {v.model}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {v.commune} · {v.quartier}
                    </p>
                  </div>
                  {activeBoost && (
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${LEVEL_STYLES[activeBoost.level].badge}`}>
                      {activeBoost.level}
                    </span>
                  )}
                </button>
              );
            })}
            {pubVehicles.length === 0 && (
              <p className="col-span-full text-sm text-slate-500 dark:text-slate-400">
                {t("boost.noVehicles", { defaultValue: "Aucun véhicule publié. Publiez d'abord un véhicule pour pouvoir le booster." })}
              </p>
            )}
          </div>
        </section>

        {/* ── Plans de boost ── */}
        {selectedVehicleId && (
          <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {plans.map((plan) => {
              const styles = LEVEL_STYLES[plan.level];
              const activeBoost = getVehicleBoost(selectedVehicleId);
              const isCurrentLevel = activeBoost?.level === plan.level;

              return (
                <div
                  key={plan.level}
                  className={`relative flex flex-col rounded-2xl border-2 bg-white p-5 shadow-sm transition dark:bg-slate-900 ${styles.border} ${styles.glow} ${plan.level === "VIP" ? "shadow-md" : ""}`}
                >
                  {/* Badge niveau */}
                  <span className={`inline-block w-fit rounded-full px-3 py-1 text-xs font-bold uppercase ${styles.badge}`}>
                    {plan.label}
                  </span>

                  {/* Prix */}
                  <div className="mt-4">
                    {plan.priceGnf === 0 ? (
                      <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        Gratuit
                      </p>
                    ) : (
                      <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
                        {formatGnf(plan.priceGnf)}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {plan.durationDays} jours
                    </p>
                  </div>

                  {/* Fonctionnalités */}
                  <ul className="mt-4 flex-1 space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <span className="mt-0.5 shrink-0 text-emerald-500">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Bouton d'action */}
                  <button
                    type="button"
                    onClick={() => plan.priceGnf === 0 ? void handleActivateFree(plan.level) : openPayModal(plan)}
                    disabled={activating || isCurrentLevel}
                    className={`mt-5 w-full rounded-xl py-3 text-sm font-bold transition disabled:opacity-50 ${
                      plan.level === "VIP"
                        ? "bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
                        : plan.level === "PREMIUM"
                          ? "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-600"
                          : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
                    }`}
                  >
                    {activating
                      ? "..."
                      : isCurrentLevel
                        ? "Actif"
                        : plan.level === "BASIC"
                          ? "Activer"
                          : `Booster ${plan.label}`}
                  </button>
                </div>
              );
            })}
          </section>
        )}

        {/* ── Boosts actifs / historique ── */}
        {boosts.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-black">
              {t("boost.history", { defaultValue: "Historique des boosts" })}
            </h2>
            <div className="mt-4 space-y-3">
              {boosts.map((boost) => {
                const vehicle = vehicles.find((v) => v.id === boost.vehicleId);
                const styles = LEVEL_STYLES[boost.level];
                const endDate = new Date(boost.endDate);
                const isExpired = endDate < new Date();

                return (
                  <article
                    key={boost.id}
                    className={`flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:bg-slate-900 ${isExpired ? "border-slate-200 opacity-60 dark:border-slate-800" : styles.border}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${styles.badge}`}>
                        {boost.level}
                      </span>
                      <div>
                        <p className="font-bold">{vehicle?.brand} {vehicle?.model}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(boost.startDate)} → {formatDate(boost.endDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {boost.isActive ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                          {t("boost.active", { defaultValue: "Actif" })}
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {t("boost.expired", { defaultValue: "Expiré" })}
                        </span>
                      )}
                      {boost.isActive && (
                        <button
                          type="button"
                          onClick={() => void handleCancel(boost.id)}
                          className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300"
                        >
                          {t("common.cancel")}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* ── Modale de paiement pour boost payant ── */}
      {payingPlan && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
              Paiement boost {payingPlan.label}
            </h3>

            <div className="mt-4 rounded-xl bg-orange-50 p-4 dark:bg-orange-500/15">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                Montant à payer
              </p>
              <p className="mt-1 text-2xl font-black text-orange-600 dark:text-orange-400">
                {formatGnf(payingPlan.priceGnf)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {payingPlan.durationDays} jours de boost {payingPlan.level}
              </p>
            </div>

            <label className="mt-4 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Numéro Orange Money
              <input
                type="tel"
                inputMode="numeric"
                value={payPhone}
                onChange={(e) => setPayPhone(e.target.value)}
                placeholder="224XXXXXXXX"
                autoFocus
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3.5 text-base outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
              />
            </label>

            {payError && (
              <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">{payError}</p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setPayingPlan(null)}
                className="flex-1 rounded-xl border border-slate-300 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 active:scale-[0.98] dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void handlePayAndActivate()}
                disabled={payLoading}
                className="flex-1 rounded-xl bg-orange-500 py-3.5 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-50 active:scale-[0.98] dark:bg-orange-600 dark:hover:bg-orange-700"
              >
                {payLoading ? "..." : "Payer et activer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
