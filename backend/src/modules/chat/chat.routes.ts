import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRoles } from "../auth/auth.middleware.js";
import {
  getOrCreateConversation,
  sendMessage,
  listConversations,
  getMessages,
  getUnreadMessageCount,
  editMessage,
  deleteMessage,
  adminListConversations,
  adminGetMessages,
} from "./chat.service.js";
import { extractUserId, handleRouteError } from "../../lib/route-helpers.js";

export const chatRouter = Router();

/**
 * @swagger
 * /api/messages/conversations:
 *   get:
 *     tags: [Messages]
 *     summary: Lister les conversations
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des conversations
 */
chatRouter.get("/conversations", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  try {
    const conversations = await listConversations(userId);
    response.json({ status: "ok", data: conversations });
  } catch (error) {
    handleRouteError(error, response, "Erreur lors de la récupération des conversations.", 500);
  }
});

// ── Récupérer les messages d'une conversation ─────────────────────────────────
chatRouter.get("/conversations/:id/messages", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  const parsedId = z.string().uuid().safeParse(request.params.id);
  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "Données invalides." });
    return;
  }

  const page = z.coerce.number().int().positive().default(1).parse(request.query.page);
  const pageSize = z.coerce.number().int().positive().max(100).default(50).parse(request.query.pageSize);

  try {
    const result = await getMessages(parsedId.data, userId, { page, pageSize });
    response.json({ status: "ok", data: result });
  } catch (error) {
    handleRouteError(error, response, "Erreur lors de la récupération des messages.");
  }
});

/**
 * @swagger
 * /api/messages/conversations/{id}/messages:
 *   post:
 *     tags: [Messages]
 *     summary: Envoyer un message
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
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message envoyé
 */
chatRouter.post("/conversations/:id/messages", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  const parsedId = z.string().uuid().safeParse(request.params.id);
  const parsedBody = z.object({ content: z.string().trim().min(1).max(5000) }).safeParse(request.body);

  if (!parsedId.success || !parsedBody.success) {
    response.status(400).json({ status: "error", message: "Données invalides." });
    return;
  }

  try {
    const message = await sendMessage(parsedId.data, userId, parsedBody.data.content);
    response.status(201).json({ status: "ok", data: message });
  } catch (error) {
    handleRouteError(error, response, "Impossible d'envoyer le message.");
  }
});

// ── Créer ou récupérer une conversation ───────────────────────────────────────
chatRouter.post("/conversations", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  const parsed = z
    .object({
      receiverId: z.string().uuid(),
      vehicleId: z.string().uuid().optional(),
    })
    .safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ status: "error", message: "Données invalides." });
    return;
  }

  try {
    const conversation = await getOrCreateConversation(
      userId,
      parsed.data.receiverId,
      parsed.data.vehicleId,
    );
    response.status(201).json({ status: "ok", data: conversation });
  } catch (error) {
    handleRouteError(error, response, "Impossible de créer la conversation.");
  }
});

/**
 * @swagger
 * /api/messages/unread-count:
 *   get:
 *     tags: [Chat]
 *     summary: Nombre de conversations avec messages non lus
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de conversations non lues
 *       401:
 *         description: Non authentifié
 */
chatRouter.get("/unread-count", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  const count = await getUnreadMessageCount(userId);
  response.json({ status: "ok", data: { count } });
});

/**
 * @swagger
 * /api/messages/{messageId}:
 *   patch:
 *     tags: [Chat]
 *     summary: Modifier un message
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
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
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *     responses:
 *       200:
 *         description: Message modifié
 *       403:
 *         description: Non autorisé
 *       404:
 *         description: Message introuvable
 */
chatRouter.patch("/messages/:messageId", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  const parsedId = z.string().uuid().safeParse(request.params.messageId);
  const parsedBody = z.object({ content: z.string().trim().min(1).max(5000) }).safeParse(request.body);

  if (!parsedId.success || !parsedBody.success) {
    response.status(400).json({ status: "error", message: "Données invalides." });
    return;
  }

  try {
    const message = await editMessage(parsedId.data, userId, parsedBody.data.content);
    response.json({ status: "ok", data: message });
  } catch (error) {
    handleRouteError(error, response, "Impossible de modifier le message.");
  }
});

/**
 * @swagger
 * /api/messages/{messageId}:
 *   delete:
 *     tags: [Chat]
 *     summary: Supprimer un message (soft delete)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Message supprimé
 *       403:
 *         description: Non autorisé
 *       404:
 *         description: Message introuvable
 */
chatRouter.delete("/messages/:messageId", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  const userRole = request.auth?.role as "CLIENT" | "PROPRIETAIRE" | "ADMIN" | undefined;
  const parsedId = z.string().uuid().safeParse(request.params.messageId);

  if (!parsedId.success || !userRole) {
    response.status(400).json({ status: "error", message: "Données invalides." });
    return;
  }

  try {
    const message = await deleteMessage(parsedId.data, userId, userRole);
    response.json({ status: "ok", data: message });
  } catch (error) {
    handleRouteError(error, response, "Impossible de supprimer le message.");
  }
});

// ── Admin : toutes les conversations (lecture seule) ──────────────────────────
chatRouter.get("/admin/conversations", requireAuth, requireRoles("ADMIN"), async (request, response) => {
  const page = z.coerce.number().int().positive().default(1).parse(request.query.page);
  const pageSize = z.coerce.number().int().positive().max(100).default(50).parse(request.query.pageSize);

  try {
    const result = await adminListConversations({ page, pageSize });
    response.json({ status: "ok", data: result });
  } catch (error) {
    handleRouteError(error, response, "Erreur lors de la récupération des conversations.", 500);
  }
});

// ── Admin : messages d'une conversation (lecture seule) ───────────────────────
chatRouter.get("/admin/conversations/:id/messages", requireAuth, requireRoles("ADMIN"), async (request, response) => {
  const parsedId = z.string().uuid().safeParse(request.params.id);
  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "Identifiant invalide." });
    return;
  }

  const page = z.coerce.number().int().positive().default(1).parse(request.query.page);
  const pageSize = z.coerce.number().int().positive().max(100).default(50).parse(request.query.pageSize);

  try {
    const result = await adminGetMessages(parsedId.data, { page, pageSize });
    response.json({ status: "ok", data: result });
  } catch (error) {
    handleRouteError(error, response, "Erreur lors de la récupération des messages.");
  }
});
