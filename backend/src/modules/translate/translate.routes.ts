/**
 * @swagger
 * /api/translate-message:
 *   post:
 *     tags: [Translate]
 *     summary: Traduire un texte
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text, targetLang]
 *             properties:
 *               text:
 *                 type: string
 *                 maxLength: 5000
 *               targetLang:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 5
 *                 example: "fr"
 *               sourceLang:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 5
 *                 default: "auto"
 *     responses:
 *       200:
 *         description: Texte traduit
 *       400:
 *         description: Données invalides
 *       502:
 *         description: Erreur du service de traduction
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth.middleware.js";
import { translateText } from "./translate.service.js";
import { extractUserId } from "../../lib/route-helpers.js";
import { logger } from "../../lib/logger.js";

export const translateRouter = Router();

const translateBodySchema = z.object({
  text: z.string().trim().min(1).max(5000),
  targetLang: z.string().min(2).max(5),
  sourceLang: z.string().min(2).max(5).default("auto"),
});

// ── Endpoint POST /api/translate-message ─────────────────────────────────────
translateRouter.post("/translate-message", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  const parsed = translateBodySchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({
      status: "error",
      message: "Données invalides.",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const result = await translateText(
      parsed.data.text,
      parsed.data.targetLang,
      parsed.data.sourceLang,
    );

    response.json({
      status: "ok",
      data: {
        translatedText: result.translatedText,
        detectedSourceLang: result.detectedSourceLang,
        targetLang: result.targetLang,
        fromCache: result.fromCache,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur de traduction.";
    logger.error({ error }, "[translate] Erreur de traduction");
    response.status(502).json({ status: "error", message });
  }
});
