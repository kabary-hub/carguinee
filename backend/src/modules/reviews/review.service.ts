import { prisma } from "../../lib/prisma.js";
import type { AuthRole } from "../../types/express.js";
import type { CreateReviewInput } from "./review.schemas.js";

// ── Inclusions communes pour les relations d'un avis ───────────────────────────
const reviewInclude = {
  reviewer: {
    select: { id: true, firstName: true, lastName: true, averageRating: true },
  },
  reviewee: {
    select: { id: true, firstName: true, lastName: true },
  },
  vehicle: {
    select: { id: true, brand: true, model: true },
  },
};

/**
 * Crée un avis sur une réservation terminée.
 * Règles :
 *  1. La réservation doit être au statut TERMINEE.
 *  2. Seul le client ou le propriétaire peut laisser un avis.
 *  3. Un avis par personne par réservation.
 */
export async function createReview(
  reviewerId: string,
  input: CreateReviewInput,
) {
  // 1. Récupérer la réservation
  const booking = await prisma.rentalBooking.findUnique({
    where: { id: input.bookingId },
    include: {
      vehicle: { select: { id: true, ownerId: true } },
      customer: { select: { id: true } },
    },
  });

  if (!booking) {
    throw new Error("Réservation introuvable.");
  }

  if (booking.status !== "TERMINEE") {
    throw new Error("Vous ne pouvez laisser un avis que sur une réservation terminée.");
  }

  // 2. Vérifier que l'utilisateur est impliqué dans la réservation
  const isCustomer = booking.customerId === reviewerId;
  const isOwner = booking.vehicle.ownerId === reviewerId;

  if (!isCustomer && !isOwner) {
    throw new Error("Vous ne pouvez laisser un avis que pour une réservation à laquelle vous avez participé.");
  }

  // 3. Déterminer le reviewee (la personne évaluée)
  const revieweeId = isCustomer ? booking.vehicle.ownerId : booking.customerId;

  // 4. Créer l'avis atomiquement (vérifie l'unicité via la contrainte DB)
  let review;
  try {
    review = await prisma.review.create({
      data: {
        bookingId: input.bookingId,
        reviewerId,
        revieweeId,
        vehicleId: booking.vehicleId,
        rating: input.rating,
        comment: input.comment,
        categories: input.categories ?? undefined,
      },
      include: reviewInclude,
    });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      throw new Error("Vous avez déjà laissé un avis pour cette réservation.");
    }
    throw error;
  }

  // 6. Recalculer la note moyenne du reviewee
  await recalculateAverageRating(revieweeId);

  return review;
}

/**
 * Récupère les avis d'un véhicule
 */
export async function getReviewsByVehicle(vehicleId: string, page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize;

  const [items, total] = await prisma.$transaction([
    prisma.review.findMany({
      where: { vehicleId },
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: reviewInclude,
    }),
    prisma.review.count({ where: { vehicleId } }),
  ]);

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Récupère les avis reçus par un utilisateur
 */
export async function getReviewsByUser(userId: string, page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize;

  const [items, total] = await prisma.$transaction([
    prisma.review.findMany({
      where: { revieweeId: userId },
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: reviewInclude,
    }),
    prisma.review.count({ where: { revieweeId: userId } }),
  ]);

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Recalcule la note moyenne d'un utilisateur
 */
async function recalculateAverageRating(userId: string) {
  const result = await prisma.review.aggregate({
    where: { revieweeId: userId },
    _avg: { rating: true },
  });

  const avgRating = result._avg.rating ?? null;

  await prisma.user.update({
    where: { id: userId },
    data: { averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null },
  });
}
