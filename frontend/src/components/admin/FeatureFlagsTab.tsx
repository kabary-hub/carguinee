/**
 * Feature Flags Management Tab — Admin Dashboard
 *
 * Permet aux admins de :
 * - Voir tous les feature flags
 * - Activer/désactiver un flag
 * - Configurer le rollout progressif (0-100%)
 * - Définir une date d'expiration
 */

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { useToast } from "../../contexts/ToastContext";

type FeatureFlag = {
  key: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number | null;
  expiresAt: string | null;
};

export function FeatureFlagsTab() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const { data: flags = [], isLoading } = useQuery({
    queryKey: ["admin", "feature-flags"],
    queryFn: () =>
      apiFetch<{ status: string; data: FeatureFlag[] }>(
        "/api/admin/feature-flags",
      ).then((res) => res.data),
  });

  const toggleFlag = useCallback(
    async (key: string, enabled: boolean) => {
      try {
        await apiFetch(`/api/admin/feature-flags/${key}`, {
          method: "PATCH",
          body: JSON.stringify({ enabled }),
        });
        queryClient.invalidateQueries({ queryKey: ["admin", "feature-flags"] });
        showToast(
          enabled
            ? `Flag "${key}" activé`
            : `Flag "${key}" désactivé`,
        );
      } catch {
        showToast("Erreur lors de la mise à jour.", "error");
      }
    },
    [queryClient, showToast],
  );

  const updateRollout = useCallback(
    async (key: string, percentage: number) => {
      try {
        await apiFetch(`/api/admin/feature-flags/${key}`, {
          method: "PATCH",
          body: JSON.stringify({ rolloutPercentage: percentage }),
        });
        queryClient.invalidateQueries({ queryKey: ["admin", "feature-flags"] });
        showToast(`Rollout mis à jour : ${percentage}%`);
        setEditingKey(null);
      } catch {
        showToast("Erreur lors de la mise à jour.", "error");
      }
    },
    [queryClient, showToast],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-emerald-600" />
      </div>
    );
  }

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
          🚩 Feature Flags
        </h2>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {flags.length} flags
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {flags.map((flag) => (
          <div
            key={flag.key}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <code className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {flag.key}
                  </code>
                  {flag.enabled ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                      ON
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      OFF
                    </span>
                  )}
                  {flag.rolloutPercentage !== null &&
                    flag.rolloutPercentage < 100 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                        🎯 {flag.rolloutPercentage}%
                      </span>
                    )}
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {flag.description}
                </p>
                {flag.expiresAt && (
                  <p className="mt-1 text-xs text-amber-600">
                    ⏰ Expire le {new Date(flag.expiresAt).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Toggle */}
                <button
                  onClick={() => toggleFlag(flag.key, !flag.enabled)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    flag.enabled
                      ? "bg-emerald-600"
                      : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      flag.enabled ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>

                {/* Edit rollout */}
                <button
                  onClick={() =>
                    setEditingKey(editingKey === flag.key ? null : flag.key)
                  }
                  className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  🎯
                </button>
              </div>
            </div>

            {/* Rollout editor */}
            {editingKey === flag.key && (
              <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                <label className="text-xs font-semibold text-slate-500">
                  Rollout : {flag.rolloutPercentage ?? 100}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={flag.rolloutPercentage ?? 100}
                  onChange={(e) =>
                    updateRollout(flag.key, Number(e.target.value))
                  }
                  className="mt-1 w-full"
                />
                <div className="mt-1 flex justify-between text-xs text-slate-400">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
