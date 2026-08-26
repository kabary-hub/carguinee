/**
 * @swagger
 * /api/reports:
 *   post:
 *     tags: [Reports]
 *     summary: Créer un signalement
 *     security:
 *       - BearerAuth: []
 * /api/admin/reports:
 *   get:
 *     tags: [Admin - Reports]
 *     summary: Lister les signalements (admin)
 *     security:
 *       - BearerAuth: []
 * /api/admin/reports/{id}/resolve:
 *   patch:
 *     tags: [Admin - Reports]
 *     summary: Résoudre un signalement
 *     security:
 *       - BearerAuth: []
 * /api/admin/reports/{id}/ban:
 *   post:
 *     tags: [Admin - Reports]
 *     summary: Bannir l'utilisateur signalé
 *     security:
 *       - BearerAuth: []
 * /api/admin/reports/{id}/suspend:
 *   post:
 *     tags: [Admin - Reports]
 *     summary: Suspendre le véhicule signalé
 *     security:
 *       - BearerAuth: []
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRoles } from "../auth/auth.middleware.js";
import { createReport, listReports, resolveReport, banReportedUser, suspendReportedVehicle } from "./report.service.js";
import { extractUserId, handleRouteError, paginationQuery } from "../../lib/route-helpers.js";

const reportStatusEnum = z.enum(["PENDING", "RESOLVED", "DISMISSED"]);
const reportListQuerySchema = paginationQuery.extend({ status: reportStatusEnum.optional() });

export const reportRouter = Router();

reportRouter.post("/", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  const parsed = z.object({
    targetId: z.string().uuid(),
    targetType: z.enum(["VEHICLE", "USER", "BOOKING"]),
    reason: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).optional(),
  }).safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ status: "error", message: "Données invalides.", details: parsed.error.flatten() });
    return;
  }

  try {
    const report = await createReport(userId, parsed.data.targetId, parsed.data.targetType, parsed.data.reason, parsed.data.description);
    response.status(201).json({ status: "ok", data: report });
  } catch (error) {
    handleRouteError(error, response, "Impossible de créer le signalement.");
  }
});

export const adminReportRouter = Router();

adminReportRouter.get("/", requireAuth, requireRoles("ADMIN"), async (request, response) => {
  const { page, pageSize } = reportListQuerySchema.parse(request.query);
  const status = request.query.status as string | undefined;
  try {
    const result = await listReports({ page, pageSize, status });
    response.json({ status: "ok", data: result });
  } catch (error) {
    handleRouteError(error, response, "Erreur de chargement.", 500);
  }
});

adminReportRouter.patch("/:id/resolve", requireAuth, requireRoles("ADMIN"), async (request, response) => {
  const parsed = z.string().uuid().safeParse(request.params.id);
  if (!parsed.success) { response.status(400).json({ status: "error", message: "ID invalide." }); return; }
  try {
    const adminId = request.auth!.userId;
    await resolveReport(parsed.data, adminId, "RESOLVED");
    response.json({ status: "ok", message: "Signalement résolu." });
  } catch (error) {
    handleRouteError(error, response, "Résolution impossible.");
  }
});

adminReportRouter.post("/:id/ban", requireAuth, requireRoles("ADMIN"), async (request, response) => {
  const parsed = z.string().uuid().safeParse(request.params.id);
  if (!parsed.success) { response.status(400).json({ status: "error", message: "ID invalide." }); return; }
  try {
    const adminId = request.auth!.userId;
    await banReportedUser(parsed.data, adminId);
    response.json({ status: "ok", message: "Utilisateur banni." });
  } catch (error) {
    handleRouteError(error, response, "Bannissement impossible.");
  }
});

adminReportRouter.post("/:id/suspend", requireAuth, requireRoles("ADMIN"), async (request, response) => {
  const parsed = z.string().uuid().safeParse(request.params.id);
  if (!parsed.success) { response.status(400).json({ status: "error", message: "ID invalide." }); return; }
  try {
    const adminId = request.auth!.userId;
    await suspendReportedVehicle(parsed.data, adminId);
    response.json({ status: "ok", message: "Véhicule suspendu." });
  } catch (error) {
    handleRouteError(error, response, "Suspension impossible.");
  }
});
