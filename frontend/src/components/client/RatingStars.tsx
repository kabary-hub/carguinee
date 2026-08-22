/**
 * Composant d'affichage de notation par étoiles
 * Affiche 5 étoiles (pleines, mi-pleines ou vides) selon la note
 */

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  count?: number;
}

const sizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
};

export function RatingStars({ rating, maxRating = 5, size = "md", showValue = true, count }: RatingStarsProps) {
  const stars = [];

  for (let i = 1; i <= maxRating; i++) {
    if (i <= Math.floor(rating)) {
      stars.push("⭐");
    } else if (i - rating < 1 && i - rating > 0) {
      stars.push("✨"); // Étoile mi-pleine approximée
    } else {
      stars.push("☆");
    }
  }

  return (
    <span className={`inline-flex items-center gap-0.5 ${sizeClasses[size]}`} aria-label={`Note : ${rating} sur ${maxRating}`}>
      {stars.map((star, index) => (
        <span key={index} className={index < rating ? "" : "opacity-40"}>
          {star}
        </span>
      ))}
      {showValue && (
        <span className="ml-1 text-sm font-bold text-slate-700 dark:text-slate-300">
          {rating.toFixed(1)}
        </span>
      )}
      {count !== undefined && (
        <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">
          ({count} avis)
        </span>
      )}
    </span>
  );
}
