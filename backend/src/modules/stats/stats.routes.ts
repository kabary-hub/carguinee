import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { prisma } from "../../lib/prisma.js";
import { extractUserId, handleRouteError } from "../../lib/route-helpers.js";
import { cached } from "../../lib/cache.js";

export const statsRouter = Router();

// ── Helpers ────────────────────────────────────────────────────────────────

type Period = "7d" | "30d" | "6m";

function parsePeriod(raw: unknown): Period {
  if (raw === "7d" || raw === "30d" || raw === "6m") return raw;
  return "6m"; // défaut
}

function sinceDate(period: Period): Date {
  const now = Date.now();
  switch (period) {
    case "7d": return new Date(now - 7 * 24 * 60 * 60 * 1000);
    case "30d": return new Date(now - 30 * 24 * 60 * 60 * 1000);
    case "6m": return new Date(now - 180 * 24 * 60 * 60 * 1000);
  }
}



/**
 * @swagger
 * /api/stats:
 *   get:
 *     tags: [Stats]
 *     summary: Statistiques utilisateur (propriétaire/admin)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 6m]
 *           default: 6m
 *         description: Période d'analyse
 *     responses:
 *       200:
 *         description: Statistiques
 *       401:
 *         description: Non authentifié
 */
statsRouter.get("/", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;
  const role = request.auth?.role;
  const period = parsePeriod(request.query.period);
  const since = sinceDate(period);
  const cacheKey = `stats:${userId}:${period}:${request.auth?.role}`;
  const cachedResult = await cached(cacheKey, 30_000, async () => {

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
        // Nombre total de véhicules du propriétaire (pas de filtre period)
        prisma.vehicle.count({ where: { ownerId: userId } }),
        // Véhicules publiés (pas de filtre period)
        prisma.vehicle.count({ where: { ownerId: userId, publicationStatus: "PUBLIEE" } }),
        // Réservations reçues sur la période
        prisma.rentalBooking.findMany({
          where: { vehicle: { ownerId: userId }, createdAt: { gte: since } },
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
        // Revenu total sur la période (réservations confirmées/en cours/terminées)
        prisma.rentalBooking.aggregate({
          where: {
            vehicle: { ownerId: userId },
            status: { in: ["CONFIRMEE", "EN_COURS", "TERMINEE"] },
            createdAt: { gte: since },
          },
          _sum: { totalAmountGnf: true },
          _count: { _all: true },
        }),
        // Réservations par statut sur la période
        prisma.rentalBooking.groupBy({
          by: ["status"],
          where: { vehicle: { ownerId: userId }, createdAt: { gte: since } },
          _count: { _all: true },
        }),
        // Réservations par mois sur la période
        prisma.$queryRaw`
          SELECT
            TO_CHAR(rb."createdAt", 'YYYY-MM') AS month,
            COUNT(*)::int AS count,
            COALESCE(SUM(CASE WHEN rb."status" IN ('CONFIRMEE','EN_COURS','TERMINEE') THEN rb."totalAmountGnf" ELSE 0 END), 0)::int AS revenue
          FROM "RentalBooking" rb
          JOIN "Vehicle" v ON rb."vehicleId" = v."id"
          WHERE v."ownerId" = ${userId}
            AND rb."createdAt" >= ${since}
          GROUP BY TO_CHAR(rb."createdAt", 'YYYY-MM')
          ORDER BY month ASC
        `,
        // Top véhicules les plus réservés sur la période
        prisma.rentalBooking.groupBy({
          by: ["vehicleId"],
          where: { vehicle: { ownerId: userId }, createdAt: { gte: since } },
          _count: { _all: true },
          _sum: { totalAmountGnf: true },
          orderBy: { _count: { vehicleId: "desc" } },
          take: 5,
        }),
        // 5 dernières réservations sur la période
        prisma.rentalBooking.findMany({
          where: { vehicle: { ownerId: userId }, createdAt: { gte: since } },
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

      // Taux d'occupation sur la période
      const now = new Date();
      const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
      const activeBookings = bookingsAsOwner.filter(
        (b) =>
          ["CONFIRMEE", "EN_COURS"].includes(b.status) &&
          new Date(b.startDate) <= now &&
          new Date(b.endDate) >= periodStart,
      );
      const bookedDays = activeBookings.reduce((acc, b) => {
        const start = new Date(Math.max(new Date(b.startDate).getTime(), periodStart.getTime()));
        const end = new Date(Math.min(new Date(b.endDate).getTime(), now.getTime()));
        return acc + Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      }, 0);
      const occupancyRate = Math.min(100, Math.round((bookedDays / periodDays) * 100));

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
          period,
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
        prisma.rentalBooking.count({ where: { customerId: userId, createdAt: { gte: since } } }),
        prisma.rentalBooking.groupBy({
          by: ["status"],
          where: { customerId: userId, createdAt: { gte: since } },
          _count: { _all: true },
        }),
        prisma.rentalBooking.aggregate({
          where: {
            customerId: userId,
            status: { in: ["CONFIRMEE", "EN_COURS", "TERMINEE"] },
            createdAt: { gte: since },
          },
          _sum: { totalAmountGnf: true },
        }),
        prisma.$queryRaw`
          SELECT
            TO_CHAR("createdAt", 'YYYY-MM') AS month,
            COUNT(*)::int AS count
          FROM "RentalBooking"
          WHERE "customerId" = ${userId}
            AND "createdAt" >= ${since}
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
          where: { customerId: userId, createdAt: { gte: since } },
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
          period,
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
    return { status: "error", message: "Erreur lors du calcul des statistiques." } as const;
  }
  });
    response.json(cachedResult);
  });
