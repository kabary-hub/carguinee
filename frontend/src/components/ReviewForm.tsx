import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../contexts/ToastContext";
import { apiFetch } from "../lib/api";

/**
 * Formulaire pour laisser un avis sur une réservation terminée
 */

interface ReviewFormProps {
  bookingId: string;
  onSuccess: () => void;
  onCancel: () => void;
  revieweeLabel?: string;
}

export function ReviewForm({ bookingId, onSuccess, onCancel, revieweeLabel }: ReviewFormProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [communication, setCommunication] = useState(5);
  const [ponctualite, setPonctualite] = useState(5);
  const [proprete, setProprete] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) return;

    setSubmitting(true);
    try {
      await apiFetch("/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          bookingId,
          rating,
          comment: comment.trim() || undefined,
          categories: {
            communication,
            ponctualite,
            proprete,
          },
        }),
      });
      showToast("Avis envoyé avec succès !");
      onSuccess();
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : "Erreur lors de l'envoi de l'avis", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-lg font-black">{revieweeLabel ?? t("vehicles.details.owner")} — {t("reviews.leaveReview")}</h3>

      {/* Note globale */}
      <div className="mt-4">
        <label className="text-sm font-semibold">{t("reviews.rating")} *</label>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              onClick={() => setRating(value)}
              className={`text-2xl transition ${
                value <= rating ? "scale-110" : "opacity-40 hover:opacity-70"
              }`}
            >
              {value <= rating ? "⭐" : "☆"}
            </button>
          ))}
        </div>
      </div>

      {/* Catégories */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <CategoryRating label={t("reviews.communication")} value={communication} onChange={setCommunication} />
        <CategoryRating label={t("reviews.punctuality")} value={ponctualite} onChange={setPonctualite} />
        <CategoryRating label={t("reviews.cleanliness")} value={proprete} onChange={setProprete} />
      </div>

      {/* Commentaire */}
      <div className="mt-4">
        <label className="text-sm font-semibold">{t("reviews.commentOptional")}</label>
        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("reviews.commentPlaceholder")}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
        />
      </div>

      {/* Boutons */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting ? t("vehicles.details.sending") : t("reviews.sendReview")}
        </button>
        <button
          onClick={onCancel}
          className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}

/**
 * Mini-composant pour une catégorie de notation
 */
function CategoryRating({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</p>
      <div className="mt-1 flex gap-0.5">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`text-sm ${v <= value ? "" : "opacity-30"}`}
          >
            ⭐
          </button>
        ))}
      </div>
    </div>
  );
}
