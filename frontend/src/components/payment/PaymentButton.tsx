/**
 * PaymentButton — Bouton de paiement Orange Money.
 *
 * Flow :
 * 1. Utilisateur clique → entre son numéro OM
 * 2. Frontend appelle POST /api/payments
 * 3. Redirige vers la page Orange Money
 * 4. Orange Money redirige vers return_url
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";

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
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ bookingId, phone }),
      });

      const data = await response.json();

      if (data.status === "ok" && data.data.payment_url) {
        // Rediriger vers la page de paiement Orange Money
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
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <span className="text-xl">💰</span>
        {t("payment.payWithOrangeMoney", "Payer avec Orange Money")}
        <span className="ml-2 text-sm opacity-80">
          {amount.toLocaleString()} GNF
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold mb-4">
              {t("payment.title", "Paiement Orange Money")}
            </h3>

            <div className="bg-orange-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600">
                {t("payment.amount", "Montant à payer")}
              </p>
              <p className="text-2xl font-bold text-orange-600">
                {amount.toLocaleString()} GNF
              </p>
            </div>

            <label className="block text-sm font-medium mb-1">
              {t("payment.phoneNumber", "Numéro Orange Money")}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="224XXXXXXXX"
              className="w-full border rounded-lg px-3 py-2 mb-2"
            />

            {error && (
              <p className="text-red-500 text-sm mb-2">{error}</p>
            )}

            <p className="text-xs text-gray-500 mb-4">
              {t("payment.info", "Vous recevrez une notification sur votre téléphone pour confirmer le paiement.")}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 border rounded-lg py-2 hover:bg-gray-50"
              >
                {t("common.cancel", "Annuler")}
              </button>
              <button
                onClick={handlePay}
                disabled={loading}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-2 disabled:opacity-50"
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
