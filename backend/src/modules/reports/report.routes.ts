import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRoles } from "../auth/auth.middleware.js";
import { createReport, listReports, resolveReport, banReportedUser, suspendReportedVehicle } from "./report.service.js";
import { extractUserId, handleRouteError, paginationQuery } from "../../lib/route-helpers.js";

export const reportRouter = Router();

// ── Créer un signalement (utilisateur connecté) ──────────────────────────────
reportRouter.post("/", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  const parsed = z
    .object({
      targetId: z.string().uuid(),
      targetType: z.enum(["VEHICLE", "USER", "BOOKING"]),
      reason: z.string().trim().min(1).max(200),
      description: z.string().trim().max(2000).optional(),
    })
    .safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      status: "error",
      message: "Données de signalement invalides.",
      details: parsed.error.flatten(),
    });
    return;
  }

  try {
    const report = await createReport(
      userId,
      parsed.data.targetId,
      parsed.data.targetType,
      parsed.data.reason,
      parsed.data.description,
    );
    response.status(201).json({ status: "ok", data: report });
  } catch (error) {
    handleRouteError(error, response, "Impossible de créer le signalement.");
  }
});

// ── Routes admin ──────────────────────────────────────────────────────────────
const adminReportRouter = Router();
adminReportRouter.use(requireAuth, requireRoles("ADMIN"));

// Lister les signalements
adminReportRouter.get("/", async (request, response) => {
  const status = typeof request.query.status === "string" ? request.query.status : undefined;
  const { page, pageSize } = paginationQuery.parse(request.query);

  try {
    const result = await listReports({ status, page, pageSize });
    response.json({ status: "ok", data: result });
  } catch (error) {
    handleRouteError(error, response, "Erreur lors de la récupération des signalements.", 500);
  }
});

// Résoudre un signalement
adminReportRouter.patch("/:id/resolve", async (request, response) => {
  const adminId = extractUserId(request, response);
  if (!adminId) return;

  const parsedId = z.string().uuid().safeParse(request.params.id);
  const parsedBody = z
    .object({ status: z.enum(["RESOLVED", "DISMISSED"]) })
    .safeParse(request.body);

  if (!parsedId.success || !parsedBody.success) {
    response.status(400).json({ status: "error", message: "Données invalides." });
    return;
  }

  try {
    const report = await resolveReport(parsedId.data, adminId, parsedBody.data.status);
    response.json({ status: "ok", data: report });
  } catch (error) {
    handleRouteError(error, response, "Impossible de résoudre le signalement.");
  }
});

// Bannir l'utilisateur signalé
adminReportRouter.patch("/:id/ban-user", async (request, response) => {
  const adminId = extractUserId(request, response);
  if (!adminId) return;

  const parsedId = z.string().uuid().safeParse(request.params.id);

  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "Données invalides." });
    return;
  }

  try {
    const report = await banReportedUser(parsedId.data, adminId);
    response.json({ status: "ok", data: report });
  } catch (error) {
    handleRouteError(error, response, "Impossible de bannir l'utilisateur.");
  }
});

// Suspendre le véhicule signalé
adminReportRouter.patch("/:id/suspend-vehicle", async (request, response) => {
  const adminId = extractUserId(request, response);
  if (!adminId) return;

  const parsedId = z.string().uuid().safeParse(request.params.id);

  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "Données invalides." });
    return;
  }

  try {
    const report = await suspendReportedVehicle(parsedId.data, adminId);
    response.json({ status: "ok", data: report });
  } catch (error) {
    handleRouteError(error, response, "Impossible de suspendre le véhicule.");
  }
});

export { adminReportRouter };
