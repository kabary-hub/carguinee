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
