/**
 * @swagger
 * /api/owner-requests:
 *   post:
 *     tags: [Owner Requests]
 *     summary: Demander le rôle propriétaire
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Demande créée
 * /api/owner-requests/me:
 *   get:
 *     tags: [Owner Requests]
 *     summary: Mes demandes de propriétaire
 *     security:
 *       - BearerAuth: []
 * /api/owner-requests/{id}/cancel:
 *   patch:
 *     tags: [Owner Requests]
 *     summary: Annuler une demande
 *     security:
 *       - BearerAuth: []
 * /api/owner-requests/pending:
 *   get:
 *     tags: [Owner Requests]
 *     summary: Demandes en attente (admin)
 *     security:
 *       - BearerAuth: []
 * /api/owner-requests/{id}/approve:
 *   patch:
 *     tags: [Owner Requests]
 *     summary: Approuver une demande (admin)
 *     security:
 *       - BearerAuth: []
 * /api/owner-requests/{id}/reject:
 *   patch:
 *     tags: [Owner Requests]
 *     summary: Rejeter une demande (admin)
 *     security:
 *       - BearerAuth: []
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRoles } from "../auth/auth.middleware.js";
import { ownerRequestSchema } from "../auth/auth.schemas.js";
import {
  approveOwnerRequest,
  cancelOwnerRequest,
  createOwnerRequest,
  listMyOwnerRequests,
  listPendingOwnerRequests,
  rejectOwnerRequest,
} from "./owner-request.service.js";
import { extractUserId, handleRouteError } from "../../lib/route-helpers.js";

export const ownerRequestRouter = Router();
const requestIdSchema = z.string().uuid();

ownerRequestRouter.post("/", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  const parsed = ownerRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ status: "error", message: "Données invalides.", details: parsed.error.flatten() });
    return;
  }

  try {
    const ownerRequest = await createOwnerRequest(userId, parsed.data);
    response.status(201).json({ status: "ok", data: ownerRequest });
  } catch (error) {
    handleRouteError(error, response, "Demande impossible.");
  }
});

ownerRequestRouter.get("/me", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;
  const ownerRequests = await listMyOwnerRequests(userId);
  response.json({ status: "ok", data: ownerRequests });
});

ownerRequestRouter.patch("/:id/cancel", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;
  const parsed = requestIdSchema.safeParse(request.params.id);
  if (!parsed.success) { response.status(400).json({ status: "error", message: "ID invalide." }); return; }
  try {
    await cancelOwnerRequest(userId, parsed.data);
    response.json({ status: "ok", message: "Demande annulée." });
  } catch (error) {
    handleRouteError(error, response, "Annulation impossible.");
  }
});

ownerRequestRouter.get("/pending", requireAuth, requireRoles("ADMIN"), async (_request, response) => {
  try {
    const requests = await listPendingOwnerRequests();
    response.json({ status: "ok", data: requests });
  } catch (error) {
    handleRouteError(error, response, "Erreur de chargement.", 500);
  }
});

ownerRequestRouter.patch("/:id/approve", requireAuth, requireRoles("ADMIN"), async (request, response) => {
  const parsed = requestIdSchema.safeParse(request.params.id);
  if (!parsed.success) { response.status(400).json({ status: "error", message: "ID invalide." }); return; }
  try {
    const adminId = request.auth!.userId;
    await approveOwnerRequest(parsed.data, adminId);
    response.json({ status: "ok", message: "Demande approuvée." });
  } catch (error) {
    handleRouteError(error, response, "Approbation impossible.");
  }
});

ownerRequestRouter.patch("/:id/reject", requireAuth, requireRoles("ADMIN"), async (request, response) => {
  const parsed = requestIdSchema.safeParse(request.params.id);
  if (!parsed.success) { response.status(400).json({ status: "error", message: "ID invalide." }); return; }
  try {
    const adminId = request.auth!.userId;
    const reason = (request.body as any)?.reason;
    await rejectOwnerRequest(parsed.data, adminId, reason);
    response.json({ status: "ok", message: "Demande rejetée." });
  } catch (error) {
    handleRouteError(error, response, "Rejet impossible.");
  }
});
