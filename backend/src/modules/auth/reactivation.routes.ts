/**
 * Routes de demande de réactivation de compte.
 *
 * - POST /api/auth/request-reactivation : endpoint PUBLIC (utilisateur déconnecté)
 *   → L'utilisateur soumet sa demande de réactivation depuis la page de connexion
 *
 * - GET /api/admin/reactivation-requests : liste des demandes (admin)
 * - PATCH /api/admin/reactivation-requests/:id/approve : accepter (admin)
 * - PATCH /api/admin/reactivation-requests/:id/reject : refuser (admin)
 */

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRoles } from "./auth.middleware.js";
import { extractUserId, handleRouteError, paginationQuery } from "../../lib/route-helpers.js";
import { normalizeGuineaPhone } from "./phone.js";
import { logger } from "../../lib/logger.js";

export const reactivationRouter = Router();

// ══════════════════════════════════════════════════════════════════════════════
// ── ROUTE PUBLIQUE : Demande de réactivation ──────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const requestReactivationSchema = z.object({
  phone: z.string().min(1, "Numéro de téléphone requis."),
  reason: z.string().max(500, "La raison ne peut pas dépasser 500 caractères.").optional(),
});

/**
 * @swagger
 * /api/auth/request-reactivation:
 *   post:
 *     tags: [Auth]
 *     summary: Demander la réactivation de son compte
 *     description: |
 *       Endpoint public. L'utilisateur déconnecté soumet une demande de réactivation
 *       de son compte désactivé. L'admin sera notifié et pourra accepter ou refuser.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+224123456789"
 *               reason:
 *                 type: string
 *                 description: Raison facultative de la demande
 *     responses:
 *       201:
 *         description: Demande créée avec succès
 *       400:
 *         description: Données invalides
 *       404:
 *         description: Aucun compte trouvé avec ce numéro
 *       409:
 *         description: Demande déjà en cours
 */
reactivationRouter.post("/request-reactivation", async (request, response) => {
  const parsed = requestReactivationSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({
      status: "error",
      message: "Données invalides.",
      details: parsed.error.flatten(),
    });
    return;
  }

  try {
    const phone = normalizeGuineaPhone(parsed.data.phone);

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      // On ne révèle pas si le compte existe ou non (sécurité)
      response.status(201).json({
        status: "ok",
        message: "Si ce numéro est associé à un compte désactivé, votre demande a été enregistrée.",
      });
      return;
    }

    if (user.isActive) {
      response.status(400).json({
        status: "error",
        message: "Ce compte est déjà actif. Vous pouvez vous connecter directement.",
      });
      return;
    }

    if (user.isBanned) {
      response.status(403).json({
        status: "error",
        message: "Ce compte a été suspendu. Veuillez contacter le support pour plus d'informations.",
      });
      return;
    }

    // Vérifier si une demande PENDING existe déjà
    const existingRequest = await prisma.reactivationRequest.findFirst({
      where: { userId: user.id, status: "PENDING" },
    });

    if (existingRequest) {
      response.status(409).json({
        status: "error",
        message: "Une demande de réactivation est déjà en cours de traitement. Veuillez patienter.",
      });
      return;
    }

    // Créer la demande
    const reactivationRequest = await prisma.reactivationRequest.create({
      data: {
        userId: user.id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        reason: parsed.data.reason,
        status: "PENDING",
      },
    });

    logger.info(
      { requestId: reactivationRequest.id, userId: user.id },
      "Demande de réactivation créée",
    );

    response.status(201).json({
      status: "ok",
      message: "Votre demande de réactivation a été enregistrée. Un administrateur l'examinera sous peu.",
    });
  } catch (error) {
    handleRouteError(error, response, "Impossible de créer la demande.", 500);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ── ROUTES ADMIN : Gestion des demandes de réactivation ───────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export const reactivationAdminRouter = Router();
reactivationAdminRouter.use(requireAuth, requireRoles("ADMIN"));

const reactivationQuerySchema = paginationQuery.extend({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});

/**
 * @swagger
 * /api/admin/reactivation-requests:
 *   get:
 *     tags: [Admin]
 *     summary: Liste des demandes de réactivation
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: Filtrer par statut
 *     responses:
 *       200:
 *         description: Liste paginée des demandes
 */
reactivationAdminRouter.get("/reactivation-requests", async (request, response) => {
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
              id: true,
              phone: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              isActive: true,
              isBanned: true,
              createdAt: true,
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

/**
 * @swagger
 * /api/admin/reactivation-requests/{id}/approve:
 *   patch:
 *     tags: [Admin]
 *     summary: Accepter une demande de réactivation
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Compte réactivé
 *       404:
 *         description: Demande introuvable
 */
reactivationAdminRouter.patch("/reactivation-requests/:id/approve", async (request, response) => {
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
      response.status(400).json({
        status: "error",
        message: `Cette demande a déjà été ${reactivationRequest.status === "APPROVED" ? "acceptée" : "refusée"}.`,
      });
      return;
    }

    // Réactiver le compte
    await prisma.$transaction([
      prisma.user.update({
        where: { id: reactivationRequest.userId },
        data: { isActive: true },
      }),
      prisma.reactivationRequest.update({
        where: { id: parsedId.data },
        data: {
          status: "APPROVED",
          reviewedById: userId,
          reviewedAt: new Date(),
        },
      }),
    ]);

    // Rétablir les véhicules du propriétaire (si applicable)
    const user = await prisma.user.findUnique({ where: { id: reactivationRequest.userId } });
    if (user && (user.role === "PROPRIETAIRE" || user.role === "ADMIN")) {
      await prisma.vehicle.updateMany({
        where: {
          ownerId: reactivationRequest.userId,
          publicationStatus: "ARCHIVEE",
        },
        data: { publicationStatus: "BROUILLON" },
      });
    }

    logger.info(
      { requestId: parsedId.data, userId: reactivationRequest.userId, adminId: userId },
      "Demande de réactivation acceptée",
    );

    response.json({
      status: "ok",
      message: "Le compte a été réactivé avec succès.",
    });
  } catch (error) {
    handleRouteError(error, response, "Impossible de traiter la demande.", 500);
  }
});

/**
 * @swagger
 * /api/admin/reactivation-requests/{id}/reject:
 *   patch:
 *     tags: [Admin]
 *     summary: Refuser une demande de réactivation
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Demande refusée
 *       404:
 *         description: Demande introuvable
 */
reactivationAdminRouter.patch("/reactivation-requests/:id/reject", async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  const parsedId = z.string().uuid().safeParse(request.params.id);
  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "Identifiant invalide." });
    return;
  }

  const bodySchema = z.object({
    rejectionReason: z.string().max(500).optional(),
  });
  const parsedBody = bodySchema.safeParse(request.body);
  if (!parsedBody.success) {
    response.status(400).json({ status: "error", message: "Données invalides." });
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
      response.status(400).json({
        status: "error",
        message: `Cette demande a déjà été ${reactivationRequest.status === "APPROVED" ? "acceptée" : "refusée"}.`,
      });
      return;
    }

    await prisma.reactivationRequest.update({
      where: { id: parsedId.data },
      data: {
        status: "REJECTED",
        reviewedById: userId,
        reviewedAt: new Date(),
        rejectionReason: parsedBody.data.rejectionReason,
      },
    });

    logger.info(
      { requestId: parsedId.data, userId: reactivationRequest.userId, adminId: userId },
      "Demande de réactivation refusée",
    );

    response.json({
      status: "ok",
      message: "La demande a été refusée.",
    });
  } catch (error) {
    handleRouteError(error, response, "Impossible de traiter la demande.", 500);
  }
});
