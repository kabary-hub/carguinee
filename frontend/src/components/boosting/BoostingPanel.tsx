/**
 * BoostingPanel — Panneau de gestion du boosting de véhicules.
 *
 * Affiche les plans disponibles et permet d'activer un boost.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../../lib/api";

interface BoostPlan {
  level: string;
  durationDays: number;
  priceGnf: number;
  label: string;
  features: string[];
}

interface VehicleBoostInfo {
  id: string;
  vehicleId: string;
  level: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface BoostingPanelProps {
  vehicleId: string;
}

export function BoostingPanel({ vehicleId }: BoostingPanelProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  // Plans disponibles
  const { data: plans } = useQuery<BoostPlan[]>({
    queryKey: ["boosting-plans"],
    queryFn: () => apiFetch("/api/boosting/plans"),
  });

  // Boost actif du véhicule
  const { data: boost } = useQuery<VehicleBoostInfo | null>({
    queryKey: ["vehicle-boost", vehicleId],
    queryFn: () => apiFetch(`/api/boosting/vehicle/${vehicleId}`),
  });

  // Activer un boost
  const activateMutation = useMutation({
    mutationFn: (level: string) =>
      apiFetch("/api/boosting/activate", {
        method: "POST",
        body: JSON.stringify({ vehicleId, level }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-boost", vehicleId] });
      setSelectedLevel(null);
    },
  });

  // Annuler un boost
  const cancelMutation = useMutation({
    mutationFn: (boostId: string) =>
      apiFetch(`/api/boosting/cancel/${boostId}`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-boost", vehicleId] });
    },
  });

  const levelColors: Record<string, string> = {
    BASIC: "border-gray-300 bg-gray-50",
    PREMIUM: "border-yellow-400 bg-yellow-50",
    VIP: "border-purple-500 bg-purple-50",
  };

  const levelBadges: Record<string, string> = {
    BASIC: "bg-gray-200 text-gray-700",
    PREMIUM: "bg-yellow-400 text-yellow-900",
    VIP: "bg-purple-600 text-white",
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">
        {t("boosting.title", "Boosting du véhicule")}
      </h3>

      {/* Boost actif */}
      {boost?.isActive && (
        <div className={`rounded-lg p-4 border-2 ${levelColors[boost.level] ?? "border-gray-300"}`}>
          <div className="flex items-center justify-between">
            <div>
              <span className={`text-xs font-bold px-2 py-1 rounded ${levelBadges[boost.level] ?? ""}`}>
                {boost.level}
              </span>
              <p className="text-sm mt-2 text-gray-600">
                {t("boosting.expires", "Expire le")} :{" "}
                {new Date(boost.endDate).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <button
              onClick={() => cancelMutation.mutate(boost.id)}
              className="text-sm text-red-500 hover:text-red-700 underline"
            >
              {t("boosting.cancel", "Annuler")}
            </button>
          </div>
        </div>
      )}

      {/* Plans */}
      {plans && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.level}
              className={`rounded-xl border-2 p-4 transition-all cursor-pointer hover:shadow-lg ${
                selectedLevel === plan.level
                  ? "ring-2 ring-blue-500 " + (levelColors[plan.level] ?? "")
                  : levelColors[plan.level] ?? "border-gray-200"
              } ${boost?.isActive && boost.level === plan.level ? "opacity-50" : ""}`}
              onClick={() => {
                if (!boost?.isActive || boost.level !== plan.level) {
                  setSelectedLevel(plan.level);
                }
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold px-2 py-1 rounded ${levelBadges[plan.level] ?? ""}`}>
                  {plan.label}
                </span>
                {plan.priceGnf === 0 ? (
                  <span className="text-green-600 font-bold">{t("boosting.free", "Gratuit")}</span>
                ) : (
                  <span className="font-bold">{plan.priceGnf.toLocaleString()} GNF</span>
                )}
              </div>

              <ul className="space-y-1 text-sm">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <span className="text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>

              <p className="text-xs text-gray-500 mt-3">
                {plan.durationDays} {t("boosting.days", "jours")}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Bouton activer */}
      {selectedLevel && !boost?.isActive && (
        <button
          onClick={() => activateMutation.mutate(selectedLevel)}
          disabled={activateMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition-colors"
        >
          {activateMutation.isPending
            ? t("common.loading", "Chargement...")
            : t("boosting.activate", "Activer le boost {{level}}", { level: selectedLevel })}
        </button>
      )}
    </div>
  );
}
