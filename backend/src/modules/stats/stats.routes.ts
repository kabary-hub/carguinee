import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { prisma } from "../../lib/prisma.js";
import { extractUserId, handleRouteError } from "../../lib/route-helpers.js";

export const statsRouter = Router();

/**
 * GET /api/stats
 * Retourne les statistiques de l'utilisateur connecté :
 * - Client : nombre de réservations, dépensées, favoris, points fidélité
 * - Propriétaire : revenus, réservations reçues, véhicules publiés, taux d'occupation
 */
statsRouter.get("/", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;
  const role = request.auth?.role;

  try {
    if (role === "PROPRIETAIRE" || role === "ADMIN") {
      const [
        totalVehicles,
        publishedVehicles,
        bookingsAsOwner,
        revenueAgg,
        bookingsByStatus,
        monthlyBookings,
        topVehicles,
        recentBookings,
      ] = await Promise.all([
        // Nombre total de véhicules du propriétaire
        prisma.vehicle.count({ where: { ownerId: userId } }),
        // Véhicules publiés
        prisma.vehicle.count({ where: { ownerId: userId, publicationStatus: "PUBLIEE" } }),
        // Réservations reçues sur les véhicules du propriétaire
        prisma.rentalBooking.findMany({
          where: { vehicle: { ownerId: userId } },
          select: {
            id: true,
            status: true,
            totalAmountGnf: true,
            startDate: true,
            endDate: true,
            createdAt: true,
            vehicle: { select: { brand: true, model: true, id: true } },
            customer: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        // Revenu total (réservations confirmées/en cours/terminées)
        prisma.rentalBooking.aggregate({
          where: {
            vehicle: { ownerId: userId },
            status: { in: ["CONFIRMEE", "EN_COURS", "TERMINEE"] },
          },
          _sum: { totalAmountGnf: true },
          _count: { _all: true },
        }),
        // Réservations par statut
        prisma.rentalBooking.groupBy({
          by: ["status"],
          where: { vehicle: { ownerId: userId } },
          _count: { _all: true },
        }),
        // Réservations par mois (6 derniers mois)
        prisma.$queryRaw`
          SELECT
            TO_CHAR("createdAt", 'YYYY-MM') AS month,
            COUNT(*)::int AS count,
            COALESCE(SUM(CASE WHEN "status" IN ('CONFIRMEE','EN_COURS','TERMINEE') THEN "totalAmountGnf" ELSE 0 END), 0)::int AS revenue
          FROM "RentalBooking" rb
          JOIN "Vehicle" v ON rb."vehicleId" = v."id"
          WHERE v."ownerId" = ${userId}
            AND rb."createdAt" >= NOW() - INTERVAL '6 months'
          GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
          ORDER BY month ASC
        `,
        // Top véhicules les plus réservés
        prisma.rentalBooking.groupBy({
          by: ["vehicleId"],
          where: { vehicle: { ownerId: userId } },
          _count: { _all: true },
          _sum: { totalAmountGnf: true },
          orderBy: { _count: { vehicleId: "desc" } },
          take: 5,
        }),
        // 5 dernières réservations
        prisma.rentalBooking.findMany({
          where: { vehicle: { ownerId: userId } },
          select: {
            id: true,
            status: true,
            totalAmountGnf: true,
            createdAt: true,
            vehicle: { select: { brand: true, model: true } },
            customer: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);

      const totalBookings = bookingsAsOwner.length;
      const totalRevenue = revenueAgg._sum.totalAmountGnf ?? 0;
      const confirmedCount = revenueAgg._count._all;

      // Taux d'occupation (jours réservés / jours totaux sur 30 jours)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const activeBookings = bookingsAsOwner.filter(
        (b) =>
          ["CONFIRMEE", "EN_COURS"].includes(b.status) &&
          new Date(b.startDate) <= now &&
          new Date(b.endDate) >= thirtyDaysAgo,
      );
      const bookedDays = activeBookings.reduce((acc, b) => {
        const start = new Date(Math.max(new Date(b.startDate).getTime(), thirtyDaysAgo.getTime()));
        const end = new Date(Math.min(new Date(b.endDate).getTime(), now.getTime()));
        return acc + Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      }, 0);
      const occupancyRate = Math.min(100, Math.round((bookedDays / 30) * 100));

      // Enrichir topVehicles avec les noms
      const vehicleIds = topVehicles.map((v) => v.vehicleId);
      const vehicles = await prisma.vehicle.findMany({
        where: { id: { in: vehicleIds } },
        select: { id: true, brand: true, model: true },
      });
      const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));

      response.json({
        status: "ok",
        data: {
          role: "PROPRIETAIRE",
          summary: {
            totalVehicles,
            publishedVehicles,
            totalBookings,
            totalRevenue,
            occupancyRate,
            confirmedBookings: confirmedCount,
          },
          bookingsByStatus: Object.fromEntries(
            bookingsByStatus.map((r) => [r.status, r._count._all]),
          ),
          monthlyData: monthlyBookings,
          topVehicles: topVehicles.map((v) => ({
            ...v,
            vehicle: vehicleMap.get(v.vehicleId) ?? null,
          })),
          recentBookings,
        },
      });
    } else {
      // ── Stats CLIENT ──
      const [
        totalBookings,
        bookingsByStatus,
        totalSpent,
        monthlyBookings,
        favoriteCount,
        loyaltyPoints,
        recentBookings,
      ] = await Promise.all([
        prisma.rentalBooking.count({ where: { customerId: userId } }),
        prisma.rentalBooking.groupBy({
          by: ["status"],
          where: { customerId: userId },
          _count: { _all: true },
        }),
        prisma.rentalBooking.aggregate({
          where: {
            customerId: userId,
            status: { in: ["CONFIRMEE", "EN_COURS", "TERMINEE"] },
          },
          _sum: { totalAmountGnf: true },
        }),
        prisma.$queryRaw`
          SELECT
            TO_CHAR("createdAt", 'YYYY-MM') AS month,
            COUNT(*)::int AS count
          FROM "RentalBooking"
          WHERE "customerId" = ${userId}
            AND "createdAt" >= NOW() - INTERVAL '6 months'
          GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
          ORDER BY month ASC
        `,
        prisma.favorite.count({ where: { userId } }),
        prisma.loyaltyTransaction.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: { balance: true },
        }),
        prisma.rentalBooking.findMany({
          where: { customerId: userId },
          select: {
            id: true,
            status: true,
            totalAmountGnf: true,
            createdAt: true,
            startDate: true,
            endDate: true,
            vehicle: { select: { brand: true, model: true, commune: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);

      response.json({
        status: "ok",
        data: {
          role: "CLIENT",
          summary: {
            totalBookings,
            totalSpent: totalSpent._sum.totalAmountGnf ?? 0,
            favoriteCount,
            loyaltyPoints: loyaltyPoints?.balance ?? 0,
          },
          bookingsByStatus: Object.fromEntries(
            bookingsByStatus.map((r) => [r.status, r._count._all]),
          ),
          monthlyData: monthlyBookings,
          recentBookings,
        },
      });
    }
  } catch (error) {
    handleRouteError(error, response, "Erreur lors du calcul des statistiques.");
  }
});
