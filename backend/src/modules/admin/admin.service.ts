import { prisma } from "../../lib/prisma.js";
import { cached } from "../../lib/cache.js";
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
    count: (args?: {
      where?: { identityVerified?: boolean };
    }) => Promise<number>;
    groupBy: (args: {
      by: string[];
      _count?: { _all: boolean };
    }) => Promise<{ role: string; _count: { _all: number } }[]>;
  };
  rentalBooking: {
    count: () => Promise<number>;
    findMany: (args: {
      where?: { status?: { in: string[] } };
      select?: { totalAmountGnf: boolean };
    }) => Promise<{ totalAmountGnf: number }[]>;
    aggregate: (args: {
      where?: { status?: { in: string[] } };
      _sum?: { totalAmountGnf?: boolean };
    }) => Promise<{ _sum: { totalAmountGnf: number | null } }>;
    groupBy: (args: {
      by: string[];
      _count?: { _all: boolean } | { vehicleId: boolean };
      orderBy?: { _count?: { vehicleId?: string } };
      take?: number;
    }) => Promise<{ status?: string; vehicleId?: string; _count: { _all: number } }[]>;
  };
  favorite: { count: () => Promise<number> };
  review: { count: () => Promise<number> };
  report: { count: (args?: { where?: { status?: string } }) => Promise<number> };
};

/**
 * Statistiques du tableau de bord administrateur.
 */
export async function getAdminStats(
  prismaClient: StatsPrismaClient = prisma as unknown as StatsPrismaClient,
) {
  return cached("admin:stats", 30_000, () => getAdminStatsUncached(prismaClient));
}

async function getAdminStatsUncached(
  prismaClient: StatsPrismaClient,
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
  const totalBookings = await prismaClient.rentalBooking.count();
  const revenueAgg = await prismaClient.rentalBooking.aggregate({
    where: { status: { in: ["CONFIRMEE", "EN_COURS", "TERMINEE"] } },
    _sum: { totalAmountGnf: true },
  });
  const totalRevenue = revenueAgg._sum.totalAmountGnf ?? 0;

  // Top véhicules les plus réservés
  const topVehicles = await prismaClient.rentalBooking.groupBy({
    by: ["vehicleId"],
    _count: { _all: true },
    orderBy: { _count: { vehicleId: "desc" } },
    take: 5,
  });

  // Véhicules actifs (publiés)
  const activeVehicles = await prismaClient.vehicle.count({
    where: { publicationStatus: "PUBLIEE" },
  });

  // Utilisateurs vérifiés
  const verifiedUsers = await prismaClient.user.count({
    where: { identityVerified: true },
  });

  // Total favoris
  const totalFavorites = await prismaClient.favorite.count();

  // Total avis
  const totalReviews = await prismaClient.review.count();

  // Signalements en attente
  const pendingReports = await prismaClient.report.count({
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
 * Liste de tous les utilisateurs (admin uniquement) avec pagination et filtre par rôle.
 */
export async function listAllUsers(options: { page?: number; pageSize?: number; role?: string } = {}) {
  const { page = 1, pageSize = 20, role } = options;
  const skip = (page - 1) * pageSize;
  const where = role && ["CLIENT", "PROPRIETAIRE", "ADMIN"].includes(role)
    ? { role: role as "CLIENT" | "PROPRIETAIRE" | "ADMIN" }
    : {};

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
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
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where }),
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
 * Liste de toutes les réservations (admin) avec filtre par statut et pagination.
 */
export async function listAllBookings(options: { statusFilter?: string; page?: number; pageSize?: number } = {}) {
  const { statusFilter, page = 1, pageSize = 20 } = options;
  const skip = (page - 1) * pageSize;
  const validStatuses = ["EN_ATTENTE", "CONFIRMEE", "EN_COURS", "TERMINEE", "ANNULEE", "REJETEE"];
  const where = statusFilter && validStatuses.includes(statusFilter)
    ? { status: statusFilter as "EN_ATTENTE" | "CONFIRMEE" | "EN_COURS" | "TERMINEE" | "ANNULEE" | "REJETEE" }
    : {};

  const [items, total] = await prisma.$transaction([
    prisma.rentalBooking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        vehicle: {
          include: {
            photos: { orderBy: { sortOrder: "asc" } },
            owner: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
          },
        },
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true },
        },
      },
    }),
    prisma.rentalBooking.count({ where }),
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
