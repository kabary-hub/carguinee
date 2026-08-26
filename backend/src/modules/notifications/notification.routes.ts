/**
 * @swagger
 * /api/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Liste des notifications
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: unreadOnly
 *         schema: { type: boolean, default: false }
 *     responses:
 *       200:
 *         description: Liste paginée des notifications
 *
 * /api/notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Nombre de notifications non lues
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de non lues
 *
 * /api/notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Marquer une notification comme lue
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Notification marquée comme lue
 *       400:
 *         description: ID invalide
 *
 * /api/notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Marquer toutes les notifications comme lues
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Toutes les notifications marquées comme lues
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth.middleware.js";
import { listNotifications, markAsRead, markAllAsRead, getUnreadCount } from "./notification.service.js";
import { extractUserId, handleRouteError, paginationQuery } from "../../lib/route-helpers.js";

export const notificationRouter = Router();

// ── Récupérer les notifications de l'utilisateur ─────────────────────────────
notificationRouter.get("/", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  const { page, pageSize } = paginationQuery.parse(request.query);
  const unreadOnly = request.query.unreadOnly === "true";

  try {
    const result = await listNotifications(userId, { page, pageSize, unreadOnly });
    response.json({ status: "ok", data: result });
  } catch (error) {
    handleRouteError(error, response, "Erreur lors de la récupération des notifications.", 500);
  }
});

// ── Compteur de notifications non lues ────────────────────────────────────────
notificationRouter.get("/unread-count", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  const count = await getUnreadCount(userId);
  response.json({ status: "ok", data: { count } });
});

// ── Marquer une notification comme lue ────────────────────────────────────────
notificationRouter.patch("/:id/read", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  const parsedId = z.string().uuid().safeParse(request.params.id);

  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "Données invalides." });
    return;
  }

  try {
    const notification = await markAsRead(userId, parsedId.data);
    response.json({ status: "ok", data: notification });
  } catch (error) {
    handleRouteError(error, response, "Impossible de marquer la notification.");
  }
});

// ── Marquer toutes les notifications comme lues ───────────────────────────────
notificationRouter.patch("/read-all", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  try {
    await markAllAsRead(userId);
    response.json({ status: "ok", data: { updated: true } });
  } catch (error) {
    handleRouteError(error, response, "Erreur lors de la mise à jour.", 500);
  }
});
