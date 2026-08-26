/**
 * Routes RGPD (Règlement Général sur la Protection des Données)
 * Adaptées au contexte guinéen.
 *
 * - Désactivation de compte (pas de suppression définitive immédiate)
 * - Réactivation de compte
 * - Export des données personnelles (format JSON)
 */

import { Router } from "express";
import { requireAuth } from "./auth.middleware.js";
import { prisma } from "../../lib/prisma.js";
import { dechiffrerSiNecessaire } from "../../lib/encryption.js";
import { extractUserId, handleRouteError } from "../../lib/route-helpers.js";
import { logger } from "../../lib/logger.js";

export const rgpdRouter = Router();

// ── Toutes les routes RGPD nécessitent une authentification ────────────────
rgpdRouter.use(requireAuth);

/**
 * @swagger
 * /api/auth/deactivate:
 *   post:
 *     tags: [RGPD]
 *     summary: Désactiver son compte
 *     description: |
 *       Désactive le compte utilisateur (pas de suppression définitive).
 *       L'utilisateur peut réactiver son compte ultérieurement.
 *       Les données sont conservées conformément à la politique de confidentialité.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Raison facultative de la désactivation
 *     responses:
 *       200:
 *         description: Compte désactivé avec succès
 *       401:
 *         description: Non authentifié
 */
rgpdRouter.post("/deactivate", async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      response.status(404).json({ status: "error", message: "Utilisateur introuvable." });
      return;
    }

    if (!user.isActive) {
      response.status(400).json({ status: "error", message: "Votre compte est déjà désactivé." });
      return;
    }

    // Désactivation du compte (soft delete)
    // On garde toutes les données mais on désactive l'accès
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // Annuler les réservations en attente de ce client
    await prisma.rentalBooking.updateMany({
      where: {
        customerId: userId,
        status: "EN_ATTENTE",
      },
      data: { status: "ANNULEE" },
    });

    // Archiver les véhicules de ce propriétaire (si applicable)
    if (user.role === "PROPRIETAIRE" || user.role === "ADMIN") {
      await prisma.vehicle.updateMany({
        where: {
          ownerId: userId,
          publicationStatus: "PUBLIEE",
        },
        data: { publicationStatus: "ARCHIVEE" },
      });
    }

    logger.info({ userId }, "Compte désactivé par l'utilisateur (RGPD)");

    response.json({
      status: "ok",
      message: "Votre compte a été désactivé. Vous pouvez le réactiver à tout moment en vous reconnectant.",
    });
  } catch (error) {
    handleRouteError(error, response, "Impossible de désactiver le compte.", 500);
  }
});

/**
 * @swagger
 * /api/auth/reactivate:
 *   post:
 *     tags: [RGPD]
 *     summary: Réactiver son compte
 *     description: Réactive un compte précédemment désactivé.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Compte réactivé avec succès
 *       400:
 *         description: Le compte n'est pas désactivé
 *       401:
 *         description: Non authentifié
 */
rgpdRouter.post("/reactivate", async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      response.status(404).json({ status: "error", message: "Utilisateur introuvable." });
      return;
    }

    if (user.isActive) {
      response.status(400).json({ status: "error", message: "Votre compte est déjà actif." });
      return;
    }

    // Réactivation du compte
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    // Rétablir les véhicules du propriétaire (si applicable)
    if (user.role === "PROPRIETAIRE" || user.role === "ADMIN") {
      await prisma.vehicle.updateMany({
        where: {
          ownerId: userId,
          publicationStatus: "ARCHIVEE",
        },
        data: { publicationStatus: "BROUILLON" },
      });
    }

    logger.info({ userId }, "Compte réactivé par l'utilisateur (RGPD)");

    response.json({
      status: "ok",
      message: "Votre compte a été réactivé avec succès.",
    });
  } catch (error) {
    handleRouteError(error, response, "Impossible de réactiver le compte.", 500);
  }
});

/**
 * @swagger
 * /api/auth/export-data:
 *   get:
 *     tags: [RGPD]
 *     summary: Exporter ses données personnelles
 *     description: |
 *       Génère un fichier JSON contenant toutes les données personnelles
 *       de l'utilisateur, conformément au droit à la portabilité (RGPD Art. 20).
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Données exportées au format JSON
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exportDate:
 *                   type: string
 *                 userData:
 *                   type: object
 *                 vehicles:
 *                   type: array
 *                 bookings:
 *                   type: array
 *                 reviews:
 *                   type: array
 *                 favorites:
 *                   type: array
 *                 messages:
 *                   type: array
 *       401:
 *         description: Non authentifié
 */
rgpdRouter.get("/export-data", async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      response.status(404).json({ status: "error", message: "Utilisateur introuvable." });
      return;
    }

    // Récupérer toutes les données liées à l'utilisateur
    const [
      vehicles,
      rentalBookingsAsCustomer,
      rentalBookingsAsOwner,
      reviewsGiven,
      reviewsReceived,
      favorites,
      sentMessages,
      receivedMessages,
      notifications,
      ownerRequests,
    ] = await Promise.all([
      // Véhicules du propriétaire
      prisma.vehicle.findMany({
        where: { ownerId: userId },
        include: {
          photos: { select: { url: true, sortOrder: true } },
        },
      }),
      // Réservations en tant que client
      prisma.rentalBooking.findMany({
        where: { customerId: userId },
        include: {
          vehicle: { select: { brand: true, model: true, commune: true } },
        },
      }),
      // Réservations reçues en tant que propriétaire
      prisma.rentalBooking.findMany({
        where: { vehicle: { ownerId: userId } },
        include: {
          customer: { select: { firstName: true, lastName: true, phone: true } },
          vehicle: { select: { brand: true, model: true } },
        },
      }),
      // Avis donnés
      prisma.review.findMany({
        where: { reviewerId: userId },
        include: {
          vehicle: { select: { brand: true, model: true } },
        },
      }),
      // Avis reçus
      prisma.review.findMany({
        where: { revieweeId: userId },
      }),
      // Favoris
      prisma.favorite.findMany({
        where: { userId },
        include: {
          vehicle: { select: { brand: true, model: true, commune: true } },
        },
      }),
      // Messages envoyés
      prisma.message.findMany({
        where: { senderId: userId },
        select: { content: true, sentAt: true, isRead: true },
      }),
      // Messages reçus
      prisma.message.findMany({
        where: { receiverId: userId },
        select: { content: true, sentAt: true, isRead: true },
      }),
      // Notifications
      prisma.notification.findMany({
        where: { userId },
        select: { type: true, title: true, message: true, isRead: true, createdAt: true },
      }),
      // Demandes propriétaire
      prisma.ownerRequest.findMany({
        where: { userId },
        select: { status: true, motivation: true, createdAt: true },
      }),
    ]);

    // Construire l'export (données déchiffrées si nécessaire)
    const exportData = {
      // Métadonnées de l'export
      exportDate: new Date().toISOString(),
      platform: "CarGuinée",
      format: "JSON - Export RGPD (droit à la portabilité)",

      // Données personnelles de base
      userData: {
        id: user.id,
        nom: user.lastName,
        prenom: user.firstName,
        telephone: dechiffrerSiNecessaire(user.phone),
        email: user.email ? dechiffrerSiNecessaire(user.email) : null,
        role: user.role,
        compteActif: user.isActive,
        telephoneVerifie: user.isPhoneVerified,
        identiteVerifiee: user.identityVerified,
        dateCreation: user.createdAt,
        derniereMiseAJour: user.updatedAt,
      },

      // Véhicules publiés
      vehicules: vehicles.map((v) => ({
        id: v.id,
        marque: v.brand,
        modele: v.model,
        type: v.type,
        annee: v.year,
        commune: v.commune,
        quartier: v.quartier,
        tarifJournalier: v.dailyRentalPriceGnf,
        prixVente: v.salePriceGnf,
        statut: v.publicationStatus,
        dateCreation: v.createdAt,
        nombrePhotos: v.photos.length,
      })),

      // Réservations en tant que client
      reservationsClient: rentalBookingsAsCustomer.map((b) => ({
        id: b.id,
        vehicule: `${b.vehicle.brand} ${b.vehicle.model}`,
        debut: b.startDate,
        fin: b.endDate,
        montantTotal: b.totalAmountGnf,
        statut: b.status,
        dateCreation: b.createdAt,
      })),

      // Réservations reçues en tant que propriétaire
      reservationsProprietaire: rentalBookingsAsOwner.map((b) => ({
        id: b.id,
        client: `${b.customer.firstName} ${b.customer.lastName}`,
        vehicule: `${b.vehicle.brand} ${b.vehicle.model}`,
        debut: b.startDate,
        fin: b.endDate,
        montantTotal: b.totalAmountGnf,
        statut: b.status,
        dateCreation: b.createdAt,
      })),

      // Avis donnés
      avisDonnes: reviewsGiven.map((r) => ({
        note: r.rating,
        commentaire: r.comment,
        vehicule: r.vehicle ? `${r.vehicle.brand} ${r.vehicle.model}` : null,
        date: r.createdAt,
      })),

      // Avis reçus
      avisRecus: reviewsReceived.map((r) => ({
        note: r.rating,
        commentaire: r.comment,
        date: r.createdAt,
      })),

      // Favoris
      favoris: favorites.map((f) => ({
        vehicule: `${f.vehicle.brand} ${f.vehicle.model}`,
        commune: f.vehicle.commune,
        dateAjout: f.createdAt,
      })),

      // Messages (expédiés et reçus, déchiffrés)
      messages: {
        envoyes: sentMessages.map((m) => ({
          contenu: dechiffrerSiNecessaire(m.content),
          date: m.sentAt,
          lu: m.isRead,
        })),
        recus: receivedMessages.map((m) => ({
          contenu: dechiffrerSiNecessaire(m.content),
          date: m.sentAt,
          lu: m.isRead,
        })),
      },

      // Notifications
      notifications: notifications.map((n) => ({
        type: n.type,
        titre: n.title,
        message: n.message,
        lue: n.isRead,
        date: n.createdAt,
      })),

      // Demandes propriétaire
      demandesProprietaire: ownerRequests.map((r) => ({
        statut: r.status,
        motivation: r.motivation,
        date: r.createdAt,
      })),
    };

    // Envoyer le fichier JSON en téléchargement
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="carguinee-export-${user.lastName}-${user.firstName}.json"`,
    );
    response.json(exportData);
  } catch (error) {
    handleRouteError(error, response, "Impossible d'exporter les données.", 500);
  }
});
