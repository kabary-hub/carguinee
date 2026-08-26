/**
 * @swagger
 * /api/contracts/{bookingId}:
 *   get:
 *     tags: [Contracts]
 *     summary: Récupérer un contrat
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Contrat trouvé
 *       404:
 *         description: Contrat introuvable
 *
 * /api/contracts/{bookingId}/generate:
 *   post:
 *     tags: [Contracts]
 *     summary: Générer un contrat PDF
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Contrat généré
 *
 * /api/contracts/{bookingId}/sign:
 *   post:
 *     tags: [Contracts]
 *     summary: Signer électroniquement un contrat
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [customer, owner]
 *     responses:
 *       200:
 *         description: Contrat signé
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth.middleware.js";
import { generateContract, getContract, signContract } from "./contract.service.js";
import { extractUserId, handleRouteError } from "../../lib/route-helpers.js";

export const contractRouter = Router();

// ── Récupérer le contrat d'une réservation ────────────────────────────────────
contractRouter.get("/:bookingId", requireAuth, async (request, response) => {
  const parsedId = z.string().uuid().safeParse(request.params.bookingId);

  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "Identifiant invalide." });
    return;
  }

  try {
    const contract = await getContract(parsedId.data);
    response.json({ status: "ok", data: contract });
  } catch (error) {
    handleRouteError(error, response, "Contrat introuvable.", 404);
  }
});

// ── Générer un contrat PDF ────────────────────────────────────────────────────
contractRouter.post("/:bookingId/generate", requireAuth, async (request, response) => {
  const parsedId = z.string().uuid().safeParse(request.params.bookingId);

  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "Identifiant invalide." });
    return;
  }

  try {
    const contract = await generateContract(parsedId.data);
    response.status(201).json({ status: "ok", data: contract });
  } catch (error) {
    handleRouteError(error, response, "Impossible de générer le contrat.");
  }
});

// ── Signer électroniquement le contrat ────────────────────────────────────────
contractRouter.post("/:bookingId/sign", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  const parsedId = z.string().uuid().safeParse(request.params.bookingId);
  const parsedBody = z
    .object({ role: z.enum(["customer", "owner"]) })
    .safeParse(request.body);

  if (!parsedId.success || !parsedBody.success) {
    response.status(400).json({ status: "error", message: "Données invalides." });
    return;
  }

  try {
    const contract = await signContract(parsedId.data, userId, parsedBody.data.role);
    response.json({ status: "ok", data: contract });
  } catch (error) {
    handleRouteError(error, response, "Impossible de signer le contrat.");
  }
});
