import { prisma } from "../../lib/prisma.js";

/**
 * Ajoute un véhicule aux favoris de l'utilisateur
 */
export async function addFavorite(userId: string, vehicleId: string) {
  // Vérifier que le véhicule existe et est publié
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, publicationStatus: "PUBLIEE" },
  });

  if (!vehicle) {
    throw new Error("Véhicule introuvable ou non publié.");
  }

  // Vérifier si déjà en favori
  const existing = await prisma.favorite.findFirst({
    where: { userId, vehicleId },
  });

  if (existing) {
    throw new Error("Ce véhicule est déjà dans vos favoris.");
  }

  return prisma.favorite.create({
    data: { userId, vehicleId },
    include: {
      vehicle: {
        select: {
          id: true, brand: true, model: true, year: true,
          dailyRentalPriceGnf: true, commune: true, quartier: true,
          publicationStatus: true,
          photos: { orderBy: { sortOrder: "asc" }, take: 1 },
        },
      },
    },
  });
}

/**
 * Supprime un véhicule des favoris de l'utilisateur
 */
export async function removeFavorite(userId: string, vehicleId: string) {
  const existing = await prisma.favorite.findFirst({
    where: { userId, vehicleId },
  });

  if (!existing) {
    throw new Error("Ce véhicule n'est pas dans vos favoris.");
  }

  await prisma.favorite.delete({
    where: { id: existing.id },
  });

  return { deleted: true, vehicleId };
}

/**
 * Récupère tous les favoris de l'utilisateur
 */
export async function listFavorites(userId: string) {
  return prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      vehicle: {
        include: {
          photos: { orderBy: { sortOrder: "asc" }, take: 4 },
          owner: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  });
}

/**
 * Vérifie si un véhicule est en favori pour un utilisateur
 */
export async function isFavorite(userId: string, vehicleId: string): Promise<boolean> {
  const count = await prisma.favorite.count({
    where: { userId, vehicleId },
  });
  return count > 0;
}
