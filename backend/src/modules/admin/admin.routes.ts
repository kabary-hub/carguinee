import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRoles } from "../auth/auth.middleware.js";
import { prisma } from "../../lib/prisma.js";
import {
  getAdminStats,
  listAllUsers,
  getUserById,
  updateUserRole,
  toggleUserActive,
  listAllBookings,
} from "./admin.service.js";
import { handleRouteError, paginationQuery } from "../../lib/route-helpers.js";

export const adminRouter = Router();

// Toutes les routes admin nécessitent le rôle ADMIN
adminRouter.use(requireAuth, requireRoles("ADMIN"));

// ── Statistiques ─────────────────────────────────────────────────────────────
adminRouter.get("/stats", async (_request, response) => {
  try {
    const stats = await getAdminStats();
    response.json({ status: "ok", data: stats });
  } catch (error) {
    console.error("Admin stats error:", error);
    handleRouteError(error, response, "Statistiques indisponibles.", 500);
  }
});

// ── Utilisateurs ─────────────────────────────────────────────────────────────
adminRouter.get("/users", async (_request, response) => {
  try {
    const users = await listAllUsers();
    response.json({ status: "ok", data: users });
  } catch (error) {
    console.error("Admin list users error:", error);
    handleRouteError(error, response, "Liste des utilisateurs indisponible.", 500);
  }
});

adminRouter.get("/users/:id", async (request, response) => {
  const parsedId = z.string().uuid().safeParse(request.params.id);
  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "Identifiant invalide." });
    return;
  }
  try {
    const user = await getUserById(parsedId.data);
    response.json({ status: "ok", data: user });
  } catch (error) {
    handleRouteError(error, response, "Utilisateur introuvable.", 404);
  }
});

adminRouter.patch("/users/:id/role", async (request, response) => {
  const parsedId = z.string().uuid().safeParse(request.params.id);
  const parsedBody = z.object({ role: z.string() }).safeParse(request.body);
  if (!parsedId.success || !parsedBody.success) {
    response.status(400).json({ status: "error", message: "Données invalides." });
    return;
  }
  try {
    const user = await updateUserRole(parsedId.data, parsedBody.data.role);
    response.json({ status: "ok", data: user });
  } catch (error) {
    handleRouteError(error, response, "Modification impossible.");
  }
});

adminRouter.patch("/users/:id/toggle-active", async (request, response) => {
  const parsedId = z.string().uuid().safeParse(request.params.id);
  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "Identifiant invalide." });
    return;
  }
  try {
    const user = await toggleUserActive(parsedId.data);
    response.json({ status: "ok", data: user });
  } catch (error) {
    handleRouteError(error, response, "Modification impossible.");
  }
});

// ── Réservations globales ────────────────────────────────────────────────────
adminRouter.get("/bookings", async (request, response) => {
  const statusQuery = request.query.status;
  const statusFilter =
    typeof statusQuery === "string" && statusQuery.trim().length > 0
      ? statusQuery.trim()
      : undefined;
  try {
    const bookings = await listAllBookings(statusFilter);
    response.json({ status: "ok", data: bookings });
  } catch (error) {
    console.error("Admin list bookings error:", error);
    handleRouteError(error, response, "Liste des réservations indisponible.", 500);
  }
});

// ── Notifications (admin voit toutes les notifications) ──────────────────────
adminRouter.get("/notifications", async (request, response) => {
  try {
    const { page, pageSize } = paginationQuery.parse(request.query);
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
      }),
      prisma.notification.count(),
    ]);
    response.json({
      status: "ok",
      data: {
        items,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      },
    });
  } catch (error) {
    handleRouteError(error, response, "Notifications indisponibles.", 500);
  }
});

// ── Suppression utilisateur (admin) ──────────────────────────────────────────
adminRouter.delete("/users/:id", async (request, response) => {
  const parsedId = z.string().uuid().safeParse(request.params.id);
  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "Identifiant invalide." });
    return;
  }
  try {
    await prisma.user.delete({ where: { id: parsedId.data } });
    response.json({ status: "ok", message: "Utilisateur supprimé." });
  } catch (error) {
    handleRouteError(error, response, "Suppression impossible.");
  }
});

// ── Suppression réservation (admin) ──────────────────────────────────────────
adminRouter.delete("/bookings/:id", async (request, response) => {
  const parsedId = z.string().uuid().safeParse(request.params.id);
  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "Identifiant invalide." });
    return;
  }
  try {
    await prisma.rentalBooking.delete({ where: { id: parsedId.data } });
    response.json({ status: "ok", message: "Réservation supprimée." });
  } catch (error) {
    handleRouteError(error, response, "Suppression impossible.");
  }
});
