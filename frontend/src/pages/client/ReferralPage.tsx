/**
 * ReferralPage — Tableau de bord de parrainage et points de fidélité.
 *
 * Affiche :
 * - Code de parrainage personnel
 * - Stats (referrals, points)
 * - Historique des transactions
 * - Réductions disponibles
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { apiFetch } from "../../lib/api";

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  pendingReferrals: number;
  totalPointsEarned: number;
  currentBalance: number;
  referralCode: string | null;
  discountAvailable: boolean;
  nextDiscountAt: number;
}

interface LoyaltyTx {
  id: string;
  points: number;
  type: string;
  balance: number;
  createdAt: string;
}

export function ReferralPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  // Stats de parrainage
  const { data: stats } = useQuery<ReferralStats>({
    queryKey: ["referral-stats"],
    queryFn: () => apiFetch("/api/referrals/stats"),
  });

  // Historique
  const { data: history } = useQuery<{ items: LoyaltyTx[]; total: number }>({
    queryKey: ["referral-history"],
    queryFn: () => apiFetch("/api/referrals/history"),
  });

  // Générer un code
  const generateMutation = useMutation({
    mutationFn: () => apiFetch("/api/referrals/generate", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["referral-stats"] }),
  });

  const copyCode = () => {
    if (stats?.referralCode) {
      navigator.clipboard.writeText(stats.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const typeLabels: Record<string, string> = {
    EARN_BOOKING: t("referral.earnBooking", "Réservation"),
    EARN_REFERRAL: t("referral.earnReferral", "Parrainage"),
    SPEND_DISCOUNT: t("referral.spendDiscount", "Réduction appliquée"),
    EARN_REVIEW: t("referral.earnReview", "Avis"),
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">
        {t("referral.title", "Parrainage & Fidélité")}
      </h1>

      {/* Code de parrainage */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-lg font-semibold mb-2">
          {t("referral.yourCode", "Votre code de parrainage")}
        </h2>
        {stats?.referralCode ? (
          <div className="flex items-center gap-3">
            <code className="bg-white/20 rounded-lg px-4 py-2 text-xl font-mono tracking-wider">
              {stats.referralCode}
            </code>
            <button
              onClick={copyCode}
              className="bg-white/20 hover:bg-white/30 rounded-lg px-3 py-2 transition-colors"
            >
              {copied ? "✅" : "📋"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="bg-white/20 hover:bg-white/30 rounded-lg px-4 py-2 transition-colors"
          >
            {generateMutation.isPending
              ? t("common.loading", "...")
              : t("referral.generateCode", "Générer mon code")}
          </button>
        )}
        <p className="text-sm mt-3 opacity-80">
          {t("referral.shareInfo", "Partagez ce code avec vos amis. Chaque inscription = 10 points !")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 border shadow-sm">
          <p className="text-sm text-gray-500">{t("referral.totalReferrals", "Parrainages")}</p>
          <p className="text-3xl font-bold">{stats?.totalReferrals ?? 0}</p>
          <p className="text-xs text-green-600">
            {stats?.activeReferrals ?? 0} {t("referral.active", "actifs")}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border shadow-sm">
          <p className="text-sm text-gray-500">{t("referral.points", "Points")}</p>
          <p className="text-3xl font-bold text-purple-600">
            {stats?.currentBalance ?? 0}
          </p>
          <p className="text-xs text-gray-500">
            {t("referral.pointsEarned", "gagnés")} : {stats?.totalPointsEarned ?? 0}
          </p>
        </div>
      </div>

      {/* Réduction disponible */}
      {stats?.discountAvailable ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-semibold">
            🎉 {t("referral.discountAvailable", "Réduction de 10% disponible !")}
          </p>
          <p className="text-sm text-green-600">
            {t("referral.discountInfo", "Utilisez vos points lors de votre prochaine réservation.")}
          </p>
        </div>
      ) : (
        <div className="bg-gray-50 border rounded-lg p-4">
          <p className="text-gray-600 text-sm">
            {t("referral.nextDiscount", "Prochaine réduction dans")}{" "}
            <strong>{stats?.nextDiscountAt ?? 100}</strong> {t("referral.pointsLower", "points")}
          </p>
        </div>
      )}

      {/* Historique */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          {t("referral.history", "Historique des points")}
        </h2>
        <div className="space-y-2">
          {history?.items?.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between bg-white rounded-lg p-3 border">
              <div>
                <p className="font-medium">{typeLabels[tx.type] ?? tx.type}</p>
                <p className="text-xs text-gray-500">
                  {new Date(tx.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-bold ${tx.points > 0 ? "text-green-600" : "text-red-600"}`}>
                  {tx.points > 0 ? "+" : ""}{tx.points}
                </p>
                <p className="text-xs text-gray-400">
                  {t("referral.balance", "solde")} : {tx.balance}
                </p>
              </div>
            </div>
          ))}
          {(!history?.items || history.items.length === 0) && (
            <p className="text-gray-500 text-center py-4">
              {t("referral.noHistory", "Aucune transaction pour le moment.")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
