import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRoles } from "../auth/auth.middleware.js";
import { prisma } from "../../lib/prisma.js";
import {
  getAdminStats,
  listAllUsers,
  getUserById,
  updateUserRole,
  toggleUserActive,
  listAllBookings,
} from "./admin.service.js";
import { handleRouteError, paginationQuery } from "../../lib/route-helpers.js";

export const adminRouter = Router();

// Toutes les routes admin nécessitent le rôle ADMIN
adminRouter.use(requireAuth, requireRoles("ADMIN"));

// ── Statistiques ─────────────────────────────────────────────────────────────
adminRouter.get("/stats", async (_request, response) => {
  try {
    const stats = await getAdminStats();
    response.json({ status: "ok", data: stats });
  } catch (error) {
    console.error("Admin stats error:", error);
    handleRouteError(error, response, "Statistiques indisponibles.", 500);
  }
});

// ── Utilisateurs ─────────────────────────────────────────────────────────────
adminRouter.get("/users", async (request, response) => {
  try {
    const { page, pageSize } = paginationQuery.parse(request.query);
    const roleFilter = typeof request.query.role === "string" && request.query.role.trim().length > 0
      ? request.query.role.trim()
      : undefined;
    const result = await listAllUsers({ page, pageSize, role: roleFilter });
    response.json({ status: "ok", data: result });
  } catch (error) {
    console.error("Admin list users error:", error);
    handleRouteError(error, response, "Liste des utilisateurs indisponible.", 500);
  }
});

adminRouter.get("/users/:id", async (request, response) => {
  const parsedId = z.string().uuid().safeParse(request.params.id);
  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "Identifiant invalide." });
    return;
  }
  try {
    const user = await getUserById(parsedId.data);
    response.json({ status: "ok", data: user });
  } catch (error) {
    handleRouteError(error, response, "Utilisateur introuvable.", 404);
  }
});

adminRouter.patch("/users/:id/role", async (request, response) => {
  const parsedId = z.string().uuid().safeParse(request.params.id);
  const parsedBody = z.object({ role: z.string() }).safeParse(request.body);
  if (!parsedId.success || !parsedBody.success) {
    response.status(400).json({ status: "error", message: "Données invalides." });
    return;
  }
  try {
    const user = await updateUserRole(parsedId.data, parsedBody.data.role);
    response.json({ status: "ok", data: user });
  } catch (error) {
    handleRouteError(error, response, "Modification impossible.");
  }
});

adminRouter.patch("/users/:id/toggle-active", async (request, response) => {
  const parsedId = z.string().uuid().safeParse(request.params.id);
  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "Identifiant invalide." });
    return;
  }
  try {
    const user = await toggleUserActive(parsedId.data);
    response.json({ status: "ok", data: user });
  } catch (error) {
    handleRouteError(error, response, "Modification impossible.");
  }
});

// ── Réservations globales ────────────────────────────────────────────────────
adminRouter.get("/bookings", async (request, response) => {
  try {
    const { page, pageSize } = paginationQuery.parse(request.query);
    const statusQuery = request.query.status;
    const statusFilter =
      typeof statusQuery === "string" && statusQuery.trim().length > 0
        ? statusQuery.trim()
        : undefined;
    const result = await listAllBookings({ statusFilter, page, pageSize });
    response.json({ status: "ok", data: result });
  } catch (error) {
    console.error("Admin list bookings error:", error);
    handleRouteError(error, response, "Liste des réservations indisponible.", 500);
  }
});

// ── Notifications (admin voit toutes les notifications) ──────────────────────
adminRouter.get("/notifications", async (request, response) => {
  try {
    const { page, pageSize } = paginationQuery.parse(request.query);
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
      }),
      prisma.notification.count(),
    ]);
    response.json({
      status: "ok",
      data: {
        items,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      },
    });
  } catch (error) {
    handleRouteError(error, response, "Notifications indisponibles.", 500);
  }
});

// ── Suppression utilisateur (admin) ──────────────────────────────────────────
adminRouter.delete("/users/:id", async (request, response) => {
  const parsedId = z.string().uuid().safeParse(request.params.id);
  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "Identifiant invalide." });
    return;
  }
  try {
    await prisma.user.delete({ where: { id: parsedId.data } });
    response.json({ status: "ok", message: "Utilisateur supprimé." });
  } catch (error) {
    handleRouteError(error, response, "Suppression impossible.");
  }
});

// ── Suppression réservation unique (admin) ──────────────────────────────────
adminRouter.delete("/bookings/:id", async (request, response) => {
  const parsedId = z.string().uuid().safeParse(request.params.id);
  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "Identifiant invalide." });
    return;
  }
  try {
    await prisma.rentalBooking.delete({ where: { id: parsedId.data } });
    response.json({ status: "ok", message: "Réservation supprimée." });
  } catch (error) {
    handleRouteError(error, response, "Suppression impossible.");
  }
});

/**
 * @swagger
 * /api/admin/bookings:
 *   delete:
 *     tags: [Admin]
 *     summary: Supprimer des réservations par statut
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [EN_ATTENTE, CONFIRMEE, EN_COURS, TERMINEE, ANNULEE, REJETEE]
 *         description: Si omis, supprime toutes les réservations
 *     responses:
 *       200:
 *         description: Nombre de réservations supprimées
 *       500:
 *         description: Suppression impossible
 */
adminRouter.delete("/bookings", async (request, response) => {
  try {
    const statusQuery = request.query.status;
    const statusFilter =
      typeof statusQuery === "string" && statusQuery.trim().length > 0
        ? statusQuery.trim()
        : undefined;
    const validStatuses = ["EN_ATTENTE", "CONFIRMEE", "EN_COURS", "TERMINEE", "ANNULEE", "REJETEE"];
    const where = statusFilter && validStatuses.includes(statusFilter)
      ? { status: statusFilter as "EN_ATTENTE" | "CONFIRMEE" | "EN_COURS" | "TERMINEE" | "ANNULEE" | "REJETEE" }
      : {};
    const result = await prisma.rentalBooking.deleteMany({ where });
    response.json({ status: "ok", message: `${result.count} réservation(s) supprimée(s).`, data: { deleted: result.count } });
  } catch (error) {
    handleRouteError(error, response, "Suppression impossible.", 500);
  }
});

/**
 * @swagger
 * /api/admin/favorites:
 *   get:
 *     tags: [Admin]
 *     summary: Tous les favoris (vue globale admin)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [CLIENT, PROPRIETAIRE]
 *         description: Filtrer par rôle de l'utilisateur
 *     responses:
 *       200:
 *         description: Liste paginée des favoris
 */
adminRouter.get("/favorites", async (request, response) => {
  try {
    const { page, pageSize } = paginationQuery.parse(request.query);
    const roleFilter = typeof request.query.role === "string" ? request.query.role : undefined;
    const skip = (page - 1) * pageSize;

    const where = roleFilter
      ? { user: { role: roleFilter as "CLIENT" | "PROPRIETAIRE" } }
      : {};

    const [items, total] = await Promise.all([
      prisma.favorite.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true },
          },
          vehicle: {
            include: {
              photos: { orderBy: { sortOrder: "asc" }, take: 1 },
              owner: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
      }),
      prisma.favorite.count({ where }),
    ]);

    response.json({
      status: "ok",
      data: {
        items,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      },
    });
  } catch (error) {
    handleRouteError(error, response, "Favoris indisponibles.", 500);
  }
});

/**
 * @swagger
 * /api/admin/reviews:
 *   get:
 *     tags: [Admin]
 *     summary: Tous les avis (vue globale admin)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filtrer par note
 *     responses:
 *       200:
 *         description: Liste paginée des avis
 */
adminRouter.get("/reviews", async (request, response) => {
  try {
    const { page, pageSize } = paginationQuery.parse(request.query);
    const ratingFilter = typeof request.query.rating === "string" ? Number(request.query.rating) : undefined;
    const skip = (page - 1) * pageSize;

    const where = ratingFilter && ratingFilter >= 1 && ratingFilter <= 5
      ? { rating: ratingFilter }
      : {};

    const [items, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          reviewer: {
            select: { id: true, firstName: true, lastName: true, phone: true, email: true },
          },
          reviewee: {
            select: { id: true, firstName: true, lastName: true },
          },
          vehicle: {
            select: { id: true, brand: true, model: true, photos: { orderBy: { sortOrder: "asc" }, take: 1 } },
          },
          booking: {
            select: { id: true, startDate: true, endDate: true },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    response.json({
      status: "ok",
      data: {
        items,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      },
    });
  } catch (error) {
    handleRouteError(error, response, "Avis indisponibles.", 500);
  }
});
