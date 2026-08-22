/**
 * Annotations Swagger centralisées pour toutes les routes.
 * Chaque route a un JSDoc @swagger complet avec tags, parameters, requestBody, responses.
 */

// ── BOOKINGS ────────────────────────────────────────────────────────────────

export const bookingSwagger = {
  post: {
    tags: ["Bookings"],
    summary: "Créer une réservation",
    security: [{ BearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["vehicleId", "startDate", "endDate"],
            properties: {
              vehicleId: { type: "string", format: "uuid" },
              startDate: { type: "string", format: "date-time" },
              endDate: { type: "string", format: "date-time" },
              withDriver: { type: "boolean", default: false },
            },
          },
        },
      },
    },
    responses: {
      "201": { description: "Réservation créée" },
      "400": { description: "Données invalides" },
      "401": { description: "Non authentifié" },
    },
  },
  getMine: {
    tags: ["Bookings"],
    summary: "Mes réservations",
    security: [{ BearerAuth: [] }],
    responses: {
      "200": { description: "Liste des réservations" },
      "401": { description: "Non authentifié" },
    },
  },
  getOwner: {
    tags: ["Bookings"],
    summary: "Réservations des véhicules du propriétaire",
    security: [{ BearerAuth: [] }],
    responses: {
      "200": { description: "Liste des réservations" },
      "403": { description: "Accès propriétaire requis" },
    },
  },
  patchDeposit: {
    tags: ["Bookings"],
    summary: "Mettre à jour le statut du dépôt",
    security: [{ BearerAuth: [] }],
    parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: { depositStatus: { type: "string", enum: ["NON_REQUIS", "A_PAYER", "DETENU", "RESTITUE", "RETENU_PARTIELLEMENT", "RETENU_TOTAL"] } },
          },
        },
      },
    },
    responses: { "200": { description: "Dépôt mis à jour" } },
  },
  patchStatus: {
    tags: ["Bookings"],
    summary: "Changer le statut d'une réservation",
    security: [{ BearerAuth: [] }],
    parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: { status: { type: "string", enum: ["CONFIRMEE", "ANNULEE", "REJETEE", "EN_COURS", "TERMINEE"] } },
          },
        },
      },
    },
    responses: { "200": { description: "Statut mis à jour" }, "400": { description: "Transition invalide" } },
  },
};

// ── REVIEWS ─────────────────────────────────────────────────────────────────

export const reviewSwagger = {
  post: {
    tags: ["Reviews"],
    summary: "Laisser un avis",
    security: [{ BearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["vehicleId", "rating"],
            properties: {
              vehicleId: { type: "string", format: "uuid" },
              rating: { type: "integer", minimum: 1, maximum: 5 },
              comment: { type: "string", maxLength: 1000 },
            },
          },
        },
      },
    },
    responses: { "201": { description: "Avis créé" }, "400": { description: "Données invalides" } },
  },
  getVehicleReviews: {
    tags: ["Reviews"],
    summary: "Avis d'un véhicule",
    parameters: [{ in: "path", name: "vehicleId", required: true, schema: { type: "string", format: "uuid" } }],
    responses: { "200": { description: "Liste des avis" } },
  },
  getUserReviews: {
    tags: ["Reviews"],
    summary: "Avis d'un utilisateur",
    parameters: [{ in: "path", name: "userId", required: true, schema: { type: "string", format: "uuid" } }],
    responses: { "200": { description: "Liste des avis" } },
  },
};

// ── FAVORITES ───────────────────────────────────────────────────────────────

export const favoriteSwagger = {
  post: {
    tags: ["Favorites"],
    summary: "Ajouter un favori",
    security: [{ BearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: { type: "object", required: ["vehicleId"], properties: { vehicleId: { type: "string", format: "uuid" } } },
        },
      },
    },
    responses: { "201": { description: "Favori ajouté" }, "409": { description: "Déjà en favori" } },
  },
  delete: {
    tags: ["Favorites"],
    summary: "Retirer un favori",
    security: [{ BearerAuth: [] }],
    parameters: [{ in: "path", name: "vehicleId", required: true, schema: { type: "string", format: "uuid" } }],
    responses: { "200": { description: "Favori retiré" } },
  },
  list: {
    tags: ["Favorites"],
    summary: "Mes favoris",
    security: [{ BearerAuth: [] }],
    responses: { "200": { description: "Liste des favoris" } },
  },
  check: {
    tags: ["Favorites"],
    summary: "Vérifier si un véhicule est en favori",
    security: [{ BearerAuth: [] }],
    parameters: [{ in: "path", name: "vehicleId", required: true, schema: { type: "string", format: "uuid" } }],
    responses: { "200": { description: "Statut du favori" } },
  },
};

// ── NOTIFICATIONS ───────────────────────────────────────────────────────────

export const notificationSwagger = {
  list: {
    tags: ["Notifications"],
    summary: "Mes notifications",
    security: [{ BearerAuth: [] }],
    responses: { "200": { description: "Liste des notifications" } },
  },
  unreadCount: {
    tags: ["Notifications"],
    summary: "Nombre de notifications non lues",
    security: [{ BearerAuth: [] }],
    responses: { "200": { description: "Compteur" } },
  },
  markRead: {
    tags: ["Notifications"],
    summary: "Marquer une notification comme lue",
    security: [{ BearerAuth: [] }],
    parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
    responses: { "200": { description: "Notification lue" } },
  },
  markAllRead: {
    tags: ["Notifications"],
    summary: "Tout marquer comme lu",
    security: [{ BearerAuth: [] }],
    responses: { "200": { description: "Toutes les notifications lues" } },
  },
};

// ── CHAT ────────────────────────────────────────────────────────────────────

export const chatSwagger = {
  getConversations: {
    tags: ["Chat"],
    summary: "Mes conversations",
    security: [{ BearerAuth: [] }],
    responses: { "200": { description: "Liste des conversations" } },
  },
  getMessages: {
    tags: ["Chat"],
    summary: "Messages d'une conversation",
    security: [{ BearerAuth: [] }],
    parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
    responses: { "200": { description: "Liste des messages" } },
  },
  sendMessage: {
    tags: ["Chat"],
    summary: "Envoyer un message",
    security: [{ BearerAuth: [] }],
    parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: { type: "object", required: ["content"], properties: { content: { type: "string", maxLength: 5000 } } },
        },
      },
    },
    responses: { "201": { description: "Message envoyé" } },
  },
  createConversation: {
    tags: ["Chat"],
    summary: "Démarrer une conversation",
    security: [{ BearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["receiverId"],
            properties: {
              receiverId: { type: "string", format: "uuid" },
              vehicleId: { type: "string", format: "uuid" },
              initialMessage: { type: "string" },
            },
          },
        },
      },
    },
    responses: { "201": { description: "Conversation créée" } },
  },
  unreadCount: {
    tags: ["Chat"],
    summary: "Nombre de messages non lus",
    security: [{ BearerAuth: [] }],
    responses: { "200": { description: "Compteur" } },
  },
  editMessage: {
    tags: ["Chat"],
    summary: "Modifier un message",
    security: [{ BearerAuth: [] }],
    parameters: [{ in: "path", name: "messageId", required: true, schema: { type: "string", format: "uuid" } }],
    requestBody: {
      content: { "application/json": { schema: { type: "object", properties: { content: { type: "string" } } } } },
    },
    responses: { "200": { description: "Message modifié" } },
  },
  deleteMessage: {
    tags: ["Chat"],
    summary: "Supprimer un message (soft delete)",
    security: [{ BearerAuth: [] }],
    parameters: [{ in: "path", name: "messageId", required: true, schema: { type: "string", format: "uuid" } }],
    responses: { "200": { description: "Message supprimé" } },
  },
};

// ── CONTRACTS ───────────────────────────────────────────────────────────────

export const contractSwagger = {
  get: {
    tags: ["Contracts"],
    summary: "Voir le contrat d'une réservation",
    security: [{ BearerAuth: [] }],
    parameters: [{ in: "path", name: "bookingId", required: true, schema: { type: "string", format: "uuid" } }],
    responses: { "200": { description: "Contrat" }, "404": { description: "Contrat introuvable" } },
  },
  generate: {
    tags: ["Contracts"],
    summary: "Générer un contrat (propriétaire)",
    security: [{ BearerAuth: [] }],
    parameters: [{ in: "path", name: "bookingId", required: true, schema: { type: "string", format: "uuid" } }],
    responses: { "201": { description: "Contrat généré" } },
  },
  sign: {
    tags: ["Contracts"],
    summary: "Signer un contrat",
    security: [{ BearerAuth: [] }],
    parameters: [{ in: "path", name: "bookingId", required: true, schema: { type: "string", format: "uuid" } }],
    responses: { "200": { description: "Contrat signé" } },
  },
};

// ── REPORTS ─────────────────────────────────────────────────────────────────

export const reportSwagger = {
  create: {
    tags: ["Reports"],
    summary: "Créer un signalement",
    security: [{ BearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["targetId", "targetType", "reason"],
            properties: {
              targetId: { type: "string" },
              targetType: { type: "string", enum: ["VEHICLE", "USER", "BOOKING"] },
              reason: { type: "string" },
              description: { type: "string" },
            },
          },
        },
      },
    },
    responses: { "201": { description: "Signalement créé" } },
  },
  adminList: {
    tags: ["Admin"],
    summary: "Liste des signalements (admin)",
    security: [{ BearerAuth: [] }],
    responses: { "200": { description: "Liste des signalements" } },
  },
  adminResolve: {
    tags: ["Admin"],
    summary: "Résoudre un signalement (admin)",
    security: [{ BearerAuth: [] }],
    parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
    responses: { "200": { description: "Signalement résolu" } },
  },
};

// ── ADMIN ───────────────────────────────────────────────────────────────────

export const adminSwagger = {
  stats: {
    tags: ["Admin"],
    summary: "Statistiques du tableau de bord",
    security: [{ BearerAuth: [] }],
    responses: { "200": { description: "Statistiques" } },
  },
  users: {
    tags: ["Admin"],
    summary: "Liste des utilisateurs",
    security: [{ BearerAuth: [] }],
    responses: { "200": { description: "Liste des utilisateurs" } },
  },
  userById: {
    tags: ["Admin"],
    summary: "Détails d'un utilisateur",
    security: [{ BearerAuth: [] }],
    parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
    responses: { "200": { description: "Utilisateur" }, "404": { description: "Introuvable" } },
  },
  updateRole: {
    tags: ["Admin"],
    summary: "Changer le rôle d'un utilisateur",
    security: [{ BearerAuth: [] }],
    parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
    requestBody: {
      content: { "application/json": { schema: { type: "object", properties: { role: { type: "string", enum: ["CLIENT", "PROPRIETAIRE", "ADMIN"] } } } } },
    },
    responses: { "200": { description: "Rôle mis à jour" } },
  },
  toggleActive: {
    tags: ["Admin"],
    summary: "Activer/Désactiver un utilisateur",
    security: [{ BearerAuth: [] }],
    parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
    responses: { "200": { description: "Statut mis à jour" } },
  },
  bookings: {
    tags: ["Admin"],
    summary: "Toutes les réservations (admin)",
    security: [{ BearerAuth: [] }],
    responses: { "200": { description: "Liste des réservations" } },
  },
};
