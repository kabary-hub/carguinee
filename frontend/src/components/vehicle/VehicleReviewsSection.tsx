import { useTranslation } from "react-i18next";
import { RatingStars } from "../RatingStars";
import { ReviewForm } from "../ReviewForm";
import type { AuthUser } from "../../types/auth";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  categories: Record<string, number> | null;
  createdAt: string;
  reviewer: { id: string; firstName: string; lastName: string; averageRating: number | null };
};

type Props = {
  reviews: Review[];
  reviewsTotal: number;
  user: AuthUser | null;
  completedBookingId: string | null;
  hasAlreadyReviewed: boolean;
  showReviewForm: boolean;
  setShowReviewForm: (show: boolean) => void;
  setHasAlreadyReviewed: (reviewed: boolean) => void;
};

export function VehicleReviewsSection({
  reviews,
  reviewsTotal,
  user,
  completedBookingId,
  hasAlreadyReviewed,
  showReviewForm,
  setShowReviewForm,
  setHasAlreadyReviewed,
}: Props) {
  const { t } = useTranslation();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black">💬 {t("vehicles.details.reviewsTitle", { count: reviewsTotal })}</h2>
        {user && completedBookingId && !showReviewForm && !hasAlreadyReviewed && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            ⭐ {t("reviews.leaveReview")}
          </button>
        )}
      </div>

      {showReviewForm && completedBookingId && (
        <div className="mt-4">
          <ReviewForm
            bookingId={completedBookingId}
            onSuccess={() => { setShowReviewForm(false); setHasAlreadyReviewed(true); }}
            onCancel={() => setShowReviewForm(false)}
          />
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{t("vehicles.details.noReviews")}</p>
      ) : (
        <div className="mt-4 space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-slate-100 pb-4 last:border-0 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  {review.reviewer.firstName[0]}{review.reviewer.lastName[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {review.reviewer.firstName} {review.reviewer.lastName[0]}.
                  </p>
                  <RatingStars rating={review.rating} size="sm" showValue={false} />
                </div>
                <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
                  {new Date(review.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
              {review.comment && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
