import { prisma } from "../../lib/prisma.js";
import type { PublicationStatus } from "../../generated/prisma/enums.js";

/**
 * Surface minimale du client Prisma utilisée par ce service, déclarée
 * structurellement pour permettre l'injection d'un faux client dans les tests.
 */
export type StatsPrismaClient = {
  vehicle: {
    count: (args?: {
      where?: { publicationStatus?: PublicationStatus };
    }) => Promise<number>;
    groupBy: (args: {
      by: string[];
      _count?: { _all: boolean };
    }) => Promise<{ publicationStatus: string; _count: { _all: number } }[]>;
  };
  user: {
    count: () => Promise<number>;
    groupBy: (args: {
      by: string[];
      _count?: { _all: boolean };
    }) => Promise<{ role: string; _count: { _all: number } }[]>;
  };
  rentalBooking: {
    groupBy: (args: {
      by: string[];
      _count?: { _all: boolean };
    }) => Promise<{ status: string; _count: { _all: number } }[]>;
  };
};

/**
 * Statistiques du tableau de bord administrateur.
 */
export async function getAdminStats(
  prismaClient: StatsPrismaClient = prisma as unknown as StatsPrismaClient,
) {
  const [totalVehicles, pendingVehicles, totalUsers, vehiclesByStatus, usersByRole, bookingsByStatus] =
    await Promise.all([
      prismaClient.vehicle.count(),
      prismaClient.vehicle.count({
        where: { publicationStatus: "EN_ATTENTE_VALIDATION" },
      }),
      prismaClient.user.count(),
      prismaClient.vehicle.groupBy({
        by: ["publicationStatus"],
        _count: { _all: true },
      }),
      prismaClient.user.groupBy({ by: ["role"], _count: { _all: true } }),
      prismaClient.rentalBooking.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

  // ── Statistiques avancées V2 ──
  const totalBookings = await prisma.rentalBooking.count();
  const confirmedBookings = await prisma.rentalBooking.findMany({
    where: { status: { in: ["CONFIRMEE", "EN_COURS", "TERMINEE"] } },
    select: { totalAmountGnf: true },
  });
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalAmountGnf, 0);

  // Top véhicules les plus réservés
  const topVehicles = await prisma.rentalBooking.groupBy({
    by: ["vehicleId"],
    _count: { _all: true },
    orderBy: { _count: { vehicleId: "desc" } },
    take: 5,
  });

  // Véhicules actifs (publiés)
  const activeVehicles = await prisma.vehicle.count({
    where: { publicationStatus: "PUBLIEE" },
  });

  // Utilisateurs vérifiés
  const verifiedUsers = await prisma.user.count({
    where: { identityVerified: true },
  });

  // Total favoris
  const totalFavorites = await prisma.favorite.count();

  // Total avis
  const totalReviews = await prisma.review.count();

  // Signalements en attente
  const pendingReports = await prisma.report.count({
    where: { status: "PENDING" },
  });

  return {
    totalVehicles,
    pendingVehicles,
    totalUsers,
    vehiclesByStatus: Object.fromEntries(
      vehiclesByStatus.map((row) => [row.publicationStatus, row._count._all]),
    ),
    usersByRole: Object.fromEntries(
      usersByRole.map((row) => [row.role, row._count._all]),
    ),
    bookingsByStatus: Object.fromEntries(
      bookingsByStatus.map((row) => [row.status, row._count._all]),
    ),
    // Statistiques avancées
    totalBookings,
    totalRevenue,
    activeVehicles,
    verifiedUsers,
    totalFavorites,
    totalReviews,
    pendingReports,
    topVehicles,
  };
}

/**
 * Liste de tous les utilisateurs (admin uniquement).
 */
export async function listAllUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      phone: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          vehicles: true,
          rentalBookings: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Détails d'un utilisateur spécifique (admin).
 */
export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          vehicles: true,
          rentalBookings: true,
        },
      },
    },
  });
  if (!user) throw new Error("Utilisateur introuvable.");
  return user;
}

/**
 * Modifier le rôle d'un utilisateur (admin).
 */
export async function updateUserRole(userId: string, newRole: string) {
  if (!["CLIENT", "PROPRIETAIRE", "ADMIN"].includes(newRole)) {
    throw new Error("Rôle invalide.");
  }
  return prisma.user.update({
    where: { id: userId },
    data: { role: newRole as "CLIENT" | "PROPRIETAIRE" | "ADMIN" },
    select: {
      id: true,
      phone: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  });
}

/**
 * Activer / désactiver un utilisateur (admin).
 */
export async function toggleUserActive(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, isActive: true } });
  if (!user) throw new Error("Utilisateur introuvable.");
  return prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
    select: {
      id: true,
      phone: true,
      firstName: true,
      lastName: true,
      isActive: true,
    },
  });
}

/**
 * Liste de toutes les réservations (admin) avec filtre optionnel par statut.
 */
export async function listAllBookings(statusFilter?: string) {
  const validStatuses = ["EN_ATTENTE", "CONFIRMEE", "EN_COURS", "TERMINEE", "ANNULEE", "REJETEE"];
  const where = statusFilter && validStatuses.includes(statusFilter)
    ? { status: statusFilter as "EN_ATTENTE" | "CONFIRMEE" | "EN_COURS" | "TERMINEE" | "ANNULEE" | "REJETEE" }
    : {};
  return prisma.rentalBooking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      vehicle: {
        include: {
          photos: { orderBy: { sortOrder: "asc" } },
          owner: { select: { id: true, firstName: true, lastName: true, phone: true } },
        },
      },
      customer: {
        select: { id: true, firstName: true, lastName: true, phone: true, email: true },
      },
    },
  });
}
