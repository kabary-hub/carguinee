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
    response.status(400).json({
      status: "error",
      message: "Données de demande invalides.",
      details: parsed.error.flatten(),
    });
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

  const parsedId = requestIdSchema.safeParse(request.params.id);

  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "Identifiant de demande invalide." });
    return;
  }

  try {
    const ownerRequest = await cancelOwnerRequest(userId, parsedId.data);
    response.json({ status: "ok", data: ownerRequest });
  } catch (error) {
    handleRouteError(error, response, "Annulation impossible.", 404);
  }
});

ownerRequestRouter.get(
  "/admin/pending",
  requireAuth,
  requireRoles("ADMIN"),
  async (_request, response) => {
    const ownerRequests = await listPendingOwnerRequests();
    response.json({ status: "ok", data: ownerRequests });
  },
);

ownerRequestRouter.patch(
  "/admin/:id/approve",
  requireAuth,
  requireRoles("ADMIN"),
  async (request, response) => {
    const adminId = extractUserId(request, response);
    if (!adminId) return;

    const parsedId = requestIdSchema.safeParse(request.params.id);

    if (!parsedId.success) {
      response.status(400).json({ status: "error", message: "Identifiant invalide." });
      return;
    }

    try {
      const ownerRequest = await approveOwnerRequest(parsedId.data, adminId);
      response.json({ status: "ok", data: ownerRequest });
    } catch (error) {
      handleRouteError(error, response, "Approbation impossible.", 404);
    }
  },
);

ownerRequestRouter.patch(
  "/admin/:id/reject",
  requireAuth,
  requireRoles("ADMIN"),
  async (request, response) => {
    const adminId = extractUserId(request, response);
    if (!adminId) return;

    const parsedId = requestIdSchema.safeParse(request.params.id);
    const reason = z
      .object({ rejectionReason: z.string().trim().min(1).max(1000) })
      .safeParse(request.body);

    if (!parsedId.success) {
      response.status(400).json({
        status: "error",
        message: "Identifiant invalide.",
      });
      return;
    }

    if (!reason.success) {
      response.status(400).json({
        status: "error",
        message: "Le motif du rejet est obligatoire.",
      });
      return;
    }

    try {
      const ownerRequest = await rejectOwnerRequest(
        parsedId.data,
        adminId,
        reason.data.rejectionReason,
      );

      response.json({
        status: "ok",
        data: ownerRequest,
      });
    } catch (error) {
      handleRouteError(error, response, "Rejet impossible.", 404);
    }
  },
);
