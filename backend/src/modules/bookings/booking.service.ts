import { prisma } from "../../lib/prisma.js";
import type { AuthRole } from "../../types/express.js";
import { createNotification } from "../notifications/notification.service.js";
import { rentalTotalAmount } from "./booking.calculations.js";
import type { CreateBookingInput } from "./booking.schemas.js";

// ── Machine à états pour les transitions de statut ───────────────────────────
// Seules les transitions listées ici sont autorisées.
const VALID_TRANSITIONS: Record<string, string[]> = {
  EN_ATTENTE: ["CONFIRMEE", "REJETEE", "ANNULEE"],
  CONFIRMEE:  ["EN_COURS", "ANNULEE"],
  EN_COURS:   ["TERMINEE", "ANNULEE"],
  TERMINEE:   [],
  ANNULEE:    [],
  REJETEE:    [],
};

export function isValidTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

const bookingInclude = {
  vehicle: {
    include: {
      photos: { orderBy: { sortOrder: "asc" as const } },
      owner: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
    },
  },
  customer: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
};

export async function createBooking(customerId: string, input: CreateBookingInput) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: input.vehicleId, publicationStatus: "PUBLIEE", supportsRental: true },
  });
  if (!vehicle || !vehicle.dailyRentalPriceGnf) throw new Error("Ce véhicule n’est pas disponible à la location.");
  if (vehicle.ownerId === customerId) throw new Error("Vous ne pouvez pas réserver votre propre véhicule.");

  const conflict = await prisma.rentalBooking.findFirst({
    where: {
      vehicleId: vehicle.id,
      status: { in: ["EN_ATTENTE", "CONFIRMEE", "EN_COURS"] },
      startDate: { lt: input.endDate },
      endDate: { gt: input.startDate },
    },
  });
  if (conflict) throw new Error("Ce véhicule est déjà demandé ou réservé sur cette période.");

  const booking = await prisma.rentalBooking.create({
    data: {
      vehicleId: vehicle.id,
      customerId,
      startDate: input.startDate,
      endDate: input.endDate,
      dailyRateGnf: vehicle.dailyRentalPriceGnf,
      totalAmountGnf: rentalTotalAmount(input.startDate, input.endDate, vehicle.dailyRentalPriceGnf),
      depositAmountGnf: vehicle.rentalDepositGnf ?? 0,
      depositStatus: vehicle.rentalDepositGnf ? "A_PAYER" : "NON_REQUIS",
      notes: input.notes,
    },
    include: { ...bookingInclude, customer: { select: { firstName: true, lastName: true } } },
  });

  // Notifier le propriétaire du véhicule
  const customerName = `${booking.customer.firstName} ${booking.customer.lastName}`;
  const startStr = booking.startDate.toLocaleDateString("fr-FR");
  const endStr = booking.endDate.toLocaleDateString("fr-FR");
  void createNotification(
    vehicle.ownerId,
    "BOOKING",
    "Nouvelle réservation",
    `${customerName} souhaite réserver ${vehicle.brand} ${vehicle.model} du ${startStr} au ${endStr}.`,
    `/reservations?bookingId=${booking.id}`,
  );

  return booking;
}

export async function listMyBookings(customerId: string) {
  return prisma.rentalBooking.findMany({ where: { customerId }, orderBy: { createdAt: "desc" }, include: bookingInclude });
}

export async function listOwnerBookings(ownerId: string) {
  return prisma.rentalBooking.findMany({ where: { vehicle: { ownerId } }, orderBy: { createdAt: "desc" }, include: bookingInclude });
}

export async function updateBookingStatus(
  bookingId: string,
  actorId: string,
  actorRole: AuthRole,
  status: "CONFIRMEE" | "REJETEE" | "ANNULEE" | "EN_COURS" | "TERMINEE",
) {
  const booking = await prisma.rentalBooking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      customerId: true,
      status: true,
      depositStatus: true,
      depositAmountGnf: true,
      vehicle: { select: { ownerId: true, brand: true, model: true } },
    },
  });
  if (!booking) throw new Error("Réservation introuvable.");
  const isOwner = booking.vehicle.ownerId === actorId;
  const isCustomerCancellation =
    booking.customerId === actorId &&
    status === "ANNULEE" &&
    ["EN_ATTENTE", "CONFIRMEE"].includes(booking.status);
  if (actorRole !== "ADMIN" && !isOwner && !isCustomerCancellation) throw new Error("Vous ne pouvez pas modifier cette réservation.");
  if (!isValidTransition(booking.status, status)) {
    throw new Error(
      `Transition invalide : ${booking.status} → ${status}.`,
    );
  }
  // Vérifier que le dépôt est payé avant confirmation
  if (status === "CONFIRMEE" && booking.depositStatus === "A_PAYER") {
    throw new Error(
      `Le dépôt de ${booking.depositAmountGnf.toLocaleString("fr-FR")} GNF doit être payé avant la confirmation.`,
    );
  }
  const updated = await prisma.rentalBooking.update({ where: { id: bookingId }, data: { status }, include: bookingInclude });

  // Notifier les parties concernées
  const vehicleLabel = `${booking.vehicle.brand} ${booking.vehicle.model}`;
  if (status === "CONFIRMEE") {
    void createNotification(
      booking.customerId, "BOOKING", "Réservation confirmée",
      `Votre réservation du ${vehicleLabel} a été confirmée par le propriétaire.`,
      `/reservations?bookingId=${bookingId}`,
    );
  } else if (status === "REJETEE") {
    void createNotification(
      booking.customerId, "BOOKING", "Réservation refusée",
      `Votre réservation du ${vehicleLabel} a été refusée par le propriétaire.`,
      `/reservations?bookingId=${bookingId}`,
    );
  } else if (status === "EN_COURS") {
    void createNotification(
      booking.customerId, "BOOKING", "Location commencée",
      `La location du ${vehicleLabel} a débuté. Bon voyage !`,
      `/reservations?bookingId=${bookingId}`,
    );
  } else if (status === "TERMINEE") {
    void createNotification(
      booking.customerId, "BOOKING", "Location terminée",
      `La location du ${vehicleLabel} est terminée. N'oublie pas de laisser un avis !`,
      `/reservations?bookingId=${bookingId}`,
    );
  } else if (status === "ANNULEE") {
    const cancelledByOwner = isOwner || actorRole === "ADMIN";
    void createNotification(
      cancelledByOwner ? booking.customerId : booking.vehicle.ownerId,
      "BOOKING",
      "Réservation annulée",
      `La réservation du ${vehicleLabel} a été annulée.`,
      `/reservations?bookingId=${bookingId}`,
    );
  }

  return updated;
}

export async function markDepositPaid(bookingId: string, customerId: string) {
  const booking = await prisma.rentalBooking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      customerId: true,
      status: true,
      depositStatus: true,
      depositAmountGnf: true,
      vehicle: { select: { ownerId: true, brand: true, model: true } },
    },
  });
  if (!booking) throw new Error("Réservation introuvable.");
  if (booking.customerId !== customerId) throw new Error("Vous ne pouvez modifier que vos propres réservations.");
  if (booking.status !== "EN_ATTENTE") throw new Error("Le dépôt ne peut être marqué payé que pour une réservation en attente.");
  if (booking.depositStatus !== "A_PAYER") throw new Error("Aucun dépôt à payer pour cette réservation.");

  const updated = await prisma.rentalBooking.update({
    where: { id: bookingId },
    data: { depositStatus: "DETENU" },
    include: bookingInclude,
  });

  // Notifier le propriétaire
  void createNotification(
    booking.vehicle.ownerId,
    "BOOKING",
    "Dépôt reçu",
    `Le client a marqué le dépôt de ${booking.depositAmountGnf.toLocaleString("fr-FR")} GNF comme payé pour ${booking.vehicle.brand} ${booking.vehicle.model}.`,
    `/reservations?bookingId=${bookingId}`,
  );

  return updated;
}
