/**
 * Routes API — Chatbot FAQ
 *
 * POST   /api/chatbot/session    → Initialiser/récupérer une session
 * POST   /api/chatbot/message    → Envoyer un message, recevoir une réponse
 * GET    /api/chatbot/history    → Historique d'une session
 * POST   /api/chatbot/rate       → Noter une réponse (utile/pas utile)
 * GET    /api/chatbot/categories → Catégories de FAQ
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth, optionalAuth } from "../auth/auth.middleware.js";
import { handleRouteError } from "../../lib/route-helpers.js";
import {
  initChatSession,
  processMessage,
  getChatHistory,
  rateResponse,
  getFaqCategories,
} from "./chatbot.service.js";

export const chatbotRouter = Router();

/**
 * @swagger
 * /api/chatbot/session:
 *   post:
 *     tags: [Chatbot]
 *     summary: Initialiser une session chatbot
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Session créée ou récupérée
 */
chatbotRouter.post("/session", optionalAuth, async (request, response) => {
  try {
    const userId = request.auth?.userId;
    const { sessionId: existingSessionId } = request.body as { sessionId?: string };
    const sessionId = await initChatSession(userId, existingSessionId);
    response.json({ status: "ok", data: { sessionId } });
  } catch (error) {
    handleRouteError(error, response, "Impossible de créer la session.", 500);
  }
});

/**
 * @swagger
 * /api/chatbot/message:
 *   post:
 *     tags: [Chatbot]
 *     summary: Envoyer un message au chatbot
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, message]
 *             properties:
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *               message:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Réponse du chatbot
 *       400:
 *         description: Données invalides
 */
const messageSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(500),
  lang: z.enum(["fr", "en"]).default("fr"),
});

chatbotRouter.post("/message", async (request, response) => {
  const parsed = messageSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({
      status: "error",
      message: "Message invalide.",
      details: parsed.error.flatten(),
    });
    return;
  }

  try {
    const { sessionId, message, lang } = parsed.data;
    const chatResponse = await processMessage(message, sessionId, lang);
    response.json({ status: "ok", data: chatResponse });
  } catch (error) {
    handleRouteError(error, response, "Erreur du chatbot.", 500);
  }
});

// ── GET /api/chatbot/history — Historique ────────────────────────────────
chatbotRouter.get("/history", async (request, response) => {
  const sessionId = request.query.sessionId as string;
  if (!sessionId) {
    response.status(400).json({ status: "error", message: "sessionId requis." });
    return;
  }

  try {
    const messages = await getChatHistory(sessionId);
    response.json({ status: "ok", data: messages });
  } catch (error) {
    handleRouteError(error, response, "Erreur de chargement.", 500);
  }
});

// ── POST /api/chatbot/rate — Noter une réponse ──────────────────────────
const rateSchema = z.object({
  faqEntryId: z.string().uuid(),
  helpful: z.boolean(),
});

chatbotRouter.post("/rate", async (request, response) => {
  const parsed = rateSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ status: "error", message: "Données invalides." });
    return;
  }

  try {
    await rateResponse(parsed.data.faqEntryId, parsed.data.helpful);
    response.json({ status: "ok" });
  } catch (error) {
    handleRouteError(error, response, "Erreur d'enregistrement.", 500);
  }
});

// ── GET /api/chatbot/categories — Catégories FAQ ────────────────────────
chatbotRouter.get("/categories", async (_request, response) => {
  try {
    const categories = await getFaqCategories();
    response.json({ status: "ok", data: categories });
  } catch (error) {
    handleRouteError(error, response, "Erreur de chargement.", 500);
  }
});
