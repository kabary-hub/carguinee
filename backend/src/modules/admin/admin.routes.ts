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
import { handleRouteError, paginationQuery, extractUserId } from "../../lib/route-helpers.js";
import { logger } from "../../lib/logger.js";

export const adminRouter = Router();

// Toutes les routes admin nécessitent le rôle ADMIN
adminRouter.use(requireAuth, requireRoles("ADMIN"));

// ── Schémas Zod pour la validation stricte des entrées admin ────────────────

/** UUID valide pour les paramètres d'URL */
const uuidParamSchema = z.string().uuid("Identifiant invalide.");

/** Enums stricts pour les rôles et statuts */
const userRoleEnum = z.enum(["CLIENT", "PROPRIETAIRE", "ADMIN"]);
const bookingStatusEnum = z.enum([
  "EN_ATTENTE",
  "CONFIRMEE",
  "EN_COURS",
  "TERMINEE",
  "ANNULEE",
  "REJETEE",
]);

/** Schéma pour la modification de rôle */
const updateRoleSchema = z.object({
  role: userRoleEnum,
});

/** Schéma pour les query params de liste utilisateurs */
const userListQuerySchema = paginationQuery.extend({
  role: userRoleEnum.optional(),
});

/** Schéma pour les query params de liste réservations */
const bookingListQuerySchema = paginationQuery.extend({
  status: bookingStatusEnum.optional(),
});

/** Schéma pour les query params de liste favoris */
const favoriteListQuerySchema = paginationQuery.extend({
  role: z.enum(["CLIENT", "PROPRIETAIRE"]).optional(),
});

/** Schéma pour les query params de liste avis */
const reviewListQuerySchema = paginationQuery.extend({
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

// ── Statistiques ─────────────────────────────────────────────────────────────
adminRouter.get("/stats", async (_request, response) => {
  try {
    const stats = await getAdminStats();
    response.json({ status: "ok", data: stats });
  } catch (error) {
    logger.error({ error }, "Erreur statistiques admin");
    handleRouteError(error, response, "Statistiques indisponibles.", 500);
  }
});

// ── Utilisateurs ─────────────────────────────────────────────────────────────
adminRouter.get("/users", async (request, response) => {
  const parsed = userListQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    response.status(400).json({
      status: "error",
      message: "Paramètres invalides.",
      details: parsed.error.flatten(),
    });
    return;
  }

  try {
    const { page, pageSize, role } = parsed.data;
    const result = await listAllUsers({ page, pageSize, role });
    response.json({ status: "ok", data: result });
  } catch (error) {
    logger.error({ error }, "Erreur liste utilisateurs admin");
    handleRouteError(error, response, "Liste des utilisateurs indisponible.", 500);
  }
});

adminRouter.get("/users/:id", async (request, response) => {
  const parsedId = uuidParamSchema.safeParse(request.params.id);
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
  const parsedId = uuidParamSchema.safeParse(request.params.id);
  const parsedBody = updateRoleSchema.safeParse(request.body);

  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "Identifiant invalide." });
    return;
  }
  if (!parsedBody.success) {
    response.status(400).json({
      status: "error",
      message: "Rôle invalide. Valeurs acceptées : CLIENT, PROPRIETAIRE, ADMIN.",
      details: parsedBody.error.flatten(),
    });
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
  const parsedId = uuidParamSchema.safeParse(request.params.id);
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

// ── Bannir / débannir un utilisateur ─────────────────────────────────────────
const banUserSchema = z.object({
  isBanned: z.boolean(),
  reason: z.string().max(500).optional(),
});

adminRouter.patch("/users/:id/ban", async (request, response) => {
  const parsedId = uuidParamSchema.safeParse(request.params.id);
  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "Identifiant invalide." });
    return;
  }
  const parsedBody = banUserSchema.safeParse(request.body);
  if (!parsedBody.success) {
    response.status(400).json({ status: "error", message: "Données invalides." });
    return;
  }
  try {
    const { isBanned } = parsedBody.data;
    const user = await prisma.user.update({
      where: { id: parsedId.data },
      data: {
        isBanned,
        isActive: isBanned ? false : true,
      },
      select: {
        id: true, phone: true, email: true, firstName: true,
        lastName: true, role: true, isActive: true, isBanned: true,
      },
    });

    // Si bannir, annuler les réservations en attente
    if (isBanned) {
      await prisma.rentalBooking.updateMany({
        where: { customerId: user.id, status: "EN_ATTENTE" },
        data: { status: "ANNULEE" },
      });
    }

    response.json({ status: "ok", data: user });
  } catch (error) {
    handleRouteError(error, response, "Modification impossible.");
  }
});

// ── Liste des utilisateurs bannis + désactivés ───────────────────────────────
const moderationQuerySchema = paginationQuery.extend({
  filter: z.enum(["banned", "deactivated"]).optional(),
});

adminRouter.get("/moderation", async (request, response) => {
  const parsed = moderationQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    response.status(400).json({
      status: "error",
      message: "Paramètres invalides.",
      details: parsed.error.flatten(),
    });
    return;
  }
  try {
    const { page, pageSize, filter } = parsed.data;
    const skip = (page - 1) * pageSize;
    const where: Record<string, unknown> = {};
    if (filter === "banned") {
      where.isBanned = true;
    } else if (filter === "deactivated") {
      where.isActive = false;
      where.isBanned = false;
    } else {
      // Par défaut : bannis + désactivés
      where.OR = [
        { isBanned: true },
        { isActive: false },
      ];
    }
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true, phone: true, email: true, firstName: true,
          lastName: true, role: true, isActive: true, isBanned: true,
          createdAt: true,
          _count: { select: { vehicles: true, rentalBookings: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);
    response.json({
      status: "ok",
      data: {
        items,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      },
    });
  } catch (error) {
    handleRouteError(error, response, "Impossible de charger les données.", 500);
  }
});

// ── Réservations globales ────────────────────────────────────────────────────
adminRouter.get("/bookings", async (request, response) => {
  const parsed = bookingListQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    response.status(400).json({
      status: "error",
      message: "Paramètres invalides.",
      details: parsed.error.flatten(),
    });
    return;
  }

  try {
    const { page, pageSize, status: statusFilter } = parsed.data;
    const result = await listAllBookings({ statusFilter, page, pageSize });
    response.json({ status: "ok", data: result });
  } catch (error) {
    logger.error({ error }, "Erreur liste réservations admin");
    handleRouteError(error, response, "Liste des réservations indisponible.", 500);
  }
});

// ── Notifications (admin voit toutes les notifications) ──────────────────────
adminRouter.get("/notifications", async (request, response) => {
  const parsed = paginationQuery.safeParse(request.query);
  if (!parsed.success) {
    response.status(400).json({ status: "error", message: "Paramètres invalides." });
    return;
  }

  try {
    const { page, pageSize } = parsed.data;
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
  const parsedId = uuidParamSchema.safeParse(request.params.id);
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
  const parsedId = uuidParamSchema.safeParse(request.params.id);
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
 *       400:
 *         description: Statut invalide
 *       500:
 *         description: Suppression impossible
 */
const deleteBookingsQuerySchema = z.object({
  status: bookingStatusEnum.optional(),
});

adminRouter.delete("/bookings", async (request, response) => {
  const parsed = deleteBookingsQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    response.status(400).json({
      status: "error",
      message: "Statut invalide. Valeurs acceptées : EN_ATTENTE, CONFIRMEE, EN_COURS, TERMINEE, ANNULEE, REJETEE.",
    });
    return;
  }

  const where = parsed.data.status ? { status: parsed.data.status } : {};

  try {
    const result = await prisma.rentalBooking.deleteMany({ where });
    response.json({
      status: "ok",
      message: `${result.count} réservation(s) supprimée(s).`,
      data: { deleted: result.count },
    });
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
 *       400:
 *         description: Paramètres invalides
 */
adminRouter.get("/favorites", async (request, response) => {
  const parsed = favoriteListQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    response.status(400).json({
      status: "error",
      message: "Paramètres invalides.",
      details: parsed.error.flatten(),
    });
    return;
  }

  try {
    const { page, pageSize, role: roleFilter } = parsed.data;
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
 *       400:
 *         description: Paramètres invalides
 */
adminRouter.get("/reviews", async (request, response) => {
  const parsed = reviewListQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    response.status(400).json({
      status: "error",
      message: "Paramètres invalides.",
      details: parsed.error.flatten(),
    });
    return;
  }

  try {
    const { page, pageSize, rating: ratingFilter } = parsed.data;
    const skip = (page - 1) * pageSize;

    const where = ratingFilter !== undefined
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

// ══════════════════════════════════════════════════════════════════════════════
// ── ROUTES ADMIN : Demandes de réactivation ──────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const reactivationQuerySchema = paginationQuery.extend({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});

adminRouter.get("/reactivation-requests", async (request, response) => {
  const parsed = reactivationQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    response.status(400).json({
      status: "error",
      message: "Paramètres invalides.",
      details: parsed.error.flatten(),
    });
    return;
  }

  try {
    const { page, pageSize, status } = parsed.data;
    const skip = (page - 1) * pageSize;
    const where = status ? { status } : {};

    const [items, total] = await Promise.all([
      prisma.reactivationRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true, phone: true, email: true,
              firstName: true, lastName: true, role: true,
              isActive: true, isBanned: true, createdAt: true,
            },
          },
          reviewedBy: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
      prisma.reactivationRequest.count({ where }),
    ]);

    response.json({
      status: "ok",
      data: {
        items,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      },
    });
  } catch (error) {
    handleRouteError(error, response, "Impossible de charger les demandes.", 500);
  }
});

adminRouter.patch("/reactivation-requests/:id/approve", async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  const parsedId = z.string().uuid().safeParse(request.params.id);
  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "Identifiant invalide." });
    return;
  }

  try {
    const reactivationRequest = await prisma.reactivationRequest.findUnique({
      where: { id: parsedId.data },
    });

    if (!reactivationRequest) {
      response.status(404).json({ status: "error", message: "Demande introuvable." });
      return;
    }
    if (reactivationRequest.status !== "PENDING") {
      response.status(400).json({ status: "error", message: "Cette demande a déjà été traitée." });
      return;
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: reactivationRequest.userId },
        data: { isActive: true },
      }),
      prisma.reactivationRequest.update({
        where: { id: parsedId.data },
        data: { status: "APPROVED", reviewedById: userId, reviewedAt: new Date() },
      }),
    ]);

    // Rétablir les véhicules du propriétaire
    const user = await prisma.user.findUnique({ where: { id: reactivationRequest.userId } });
    if (user && (user.role === "PROPRIETAIRE" || user.role === "ADMIN")) {
      await prisma.vehicle.updateMany({
        where: { ownerId: reactivationRequest.userId, publicationStatus: "ARCHIVEE" },
        data: { publicationStatus: "BROUILLON" },
      });
    }

    logger.info({ requestId: parsedId.data, userId: reactivationRequest.userId, adminId: userId }, "Demande de réactivation acceptée");
    response.json({ status: "ok", message: "Le compte a été réactivé avec succès." });
  } catch (error) {
    handleRouteError(error, response, "Impossible de traiter la demande.", 500);
  }
});

adminRouter.patch("/reactivation-requests/:id/reject", async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  const parsedId = z.string().uuid().safeParse(request.params.id);
  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "Identifiant invalide." });
    return;
  }

  const bodySchema = z.object({ rejectionReason: z.string().max(500).optional() });
  const parsedBody = bodySchema.safeParse(request.body);
  if (!parsedBody.success) {
    response.status(400).json({ status: "error", message: "Données invalides." });
    return;
  }

  try {
    const reactivationRequest = await prisma.reactivationRequest.findUnique({ where: { id: parsedId.data } });
    if (!reactivationRequest) {
      response.status(404).json({ status: "error", message: "Demande introuvable." });
      return;
    }
    if (reactivationRequest.status !== "PENDING") {
      response.status(400).json({ status: "error", message: "Cette demande a déjà été traitée." });
      return;
    }

    await prisma.reactivationRequest.update({
      where: { id: parsedId.data },
      data: { status: "REJECTED", reviewedById: userId, reviewedAt: new Date(), rejectionReason: parsedBody.data.rejectionReason },
    });

    logger.info({ requestId: parsedId.data, userId: reactivationRequest.userId, adminId: userId }, "Demande de réactivation refusée");
    response.json({ status: "ok", message: "La demande a été refusée." });
  } catch (error) {
    handleRouteError(error, response, "Impossible de traiter la demande.", 500);
  }
});
