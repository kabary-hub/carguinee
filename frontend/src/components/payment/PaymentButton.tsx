/**
 * PaymentButton — Bouton de paiement Orange Money (petit et stylé).
 *
 * Flow :
 * 1. Utilisateur clique → entre son numéro OM
 * 2. Frontend appelle POST /api/payments
 * 3. Redirige vers la page Orange Money
 * 4. Orange Money redirige vers return_url
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getStoredToken } from "../../lib/api";

interface PaymentButtonProps {
  bookingId: string;
  amount: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaymentButton({ bookingId, amount, onSuccess }: PaymentButtonProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Mode simulation si pas de clés API (détection côté frontend)
  const isSimulation = !import.meta.env.VITE_OM_ENABLED;

  const handlePay = async () => {
    if (!phone || phone.length < 8) {
      setError(t("payment.phoneInvalid", "Numéro de téléphone invalide"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getStoredToken()}`,
        },
        body: JSON.stringify({ bookingId, phone }),
      });

      const data = await response.json();

      if (data.status === "ok" && data.data.payment_url) {
        // En mode simulation, le backend retourne directement l'URL de succès
        // En mode réel, on redirige vers la page Orange Money
        window.location.href = data.data.payment_url;
        onSuccess?.();
      } else {
        setError(data.message || t("payment.error", "Erreur de paiement"));
      }
    } catch {
      setError(t("payment.networkError", "Erreur réseau. Veuillez réessayer."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-orange-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 hover:shadow-md active:scale-95 dark:bg-orange-600 dark:hover:bg-orange-700"
      >
        Paiement OM
        <span className="hidden opacity-80 sm:inline">
          {amount.toLocaleString()} GNF
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4">
          <div
            className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:p-8"
            onMouseLeave={() => setError("")}
          >
            {/* En-tête + Montant */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-black text-slate-900 sm:text-xl dark:text-slate-100">
                {t("payment.title", "Paiement Orange Money")}
              </h3>
              <div className="rounded-xl bg-orange-50 px-4 py-2.5 dark:bg-orange-500/15">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                  {t("payment.amount", "Montant à payer")}
                </p>
                <p className="text-xl font-black text-orange-600 sm:text-2xl dark:text-orange-400">
                  {amount.toLocaleString()} GNF
                </p>
              </div>
            </div>

            {/* Séparateur */}
            <div className="my-5 border-t border-slate-200 dark:border-slate-700" />

            {/* Numéro de téléphone */}
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t("payment.phoneNumber", "Numéro Orange Money")}
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="224XXXXXXXX"
                autoFocus
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3.5 text-base outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-orange-500 dark:focus:ring-orange-500/20"
              />
            </label>

            {error && (
              <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">{error}</p>
            )}

            {isSimulation && (
              <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                Mode simulation — le paiement sera confirmé automatiquement
              </div>
            )}
            {!isSimulation && (
              <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                {t("payment.info", "Vous recevrez une notification sur votre téléphone pour confirmer le paiement.")}
              </p>
            )}

            {/* Boutons */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 rounded-xl border border-slate-300 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 active:scale-[0.98] dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {t("common.cancel", "Annuler")}
              </button>
              <button
                onClick={handlePay}
                disabled={loading}
                className="flex-1 rounded-xl bg-orange-500 py-3.5 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-50 disabled:shadow-none active:scale-[0.98] dark:bg-orange-600 dark:hover:bg-orange-700"
              >
                {loading ? t("common.loading", "Chargement...") : t("payment.confirm", "Confirmer")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
