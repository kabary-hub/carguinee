import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRoles } from "../auth/auth.middleware.js";
import { createBookingSchema, bookingStatusSchema } from "./booking.schemas.js";
import { createBooking, listMyBookings, listOwnerBookings, updateBookingStatus, markDepositPaid } from "./booking.service.js";
import { extractUserId, handleRouteError } from "../../lib/route-helpers.js";

export const bookingRouter = Router();
const bookingIdSchema = z.string().uuid();

bookingRouter.post("/", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  const parsed = createBookingSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ status: "error", message: "Données de réservation invalides." });
    return;
  }

  try {
    response.status(201).json({ status: "ok", data: await createBooking(userId, parsed.data) });
  } catch (error) {
    handleRouteError(error, response, "Réservation impossible.");
  }
});

bookingRouter.get("/mine", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  response.json({ status: "ok", data: await listMyBookings(userId) });
});

bookingRouter.get("/owner", requireAuth, async (request, response) => {
  const userId = request.auth?.userId;
  const role = request.auth?.role;
  if (!userId || !role || !["PROPRIETAIRE", "ADMIN"].includes(role)) {
    response.status(403).json({ status: "error", message: "Accès propriétaire requis." });
    return;
  }
  response.json({ status: "ok", data: await listOwnerBookings(userId) });
});

bookingRouter.patch("/:id/deposit", requireAuth, async (request, response) => {
  const bookingId = bookingIdSchema.safeParse(request.params.id);
  const userId = extractUserId(request, response);
  if (!bookingId.success || !userId) {
    response.status(400).json({ status: "error", message: "Données invalides." });
    return;
  }

  try {
    response.json({ status: "ok", data: await markDepositPaid(bookingId.data, userId) });
  } catch (error) {
    handleRouteError(error, response, "Opération impossible.");
  }
});

bookingRouter.patch("/:id/status", requireAuth, async (request, response) => {
  const bookingId = bookingIdSchema.safeParse(request.params.id);
  const body = bookingStatusSchema.safeParse(request.body);
  const actor = request.auth;
  if (!bookingId.success || !body.success || !actor) {
    response.status(400).json({ status: "error", message: "Données de mise à jour invalides." });
    return;
  }

  try {
    response.json({ status: "ok", data: await updateBookingStatus(bookingId.data, actor.userId, actor.role, body.data.status) });
  } catch (error) {
    response.status(403).json({ status: "error", message: error instanceof Error ? error.message : "Mise à jour impossible." });
  }
});
