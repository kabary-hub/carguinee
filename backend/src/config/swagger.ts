import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "CarGuinée API",
      version: "2.0.0",
      description:
        "API backend pour CarGuinée — plateforme de location et vente de véhicules en Guinée.\n\n" +
        "## Authentification\n" +
        "La plupart des routes nécessitent un token JWT dans le header `Authorization: Bearer <token>`.\n\n" +
        "## Codes de réponse\n" +
        "- `200` : Succès\n" +
        "- `201` : Créé\n" +
        "- `400` : Données invalides\n" +
        "- `401` : Non authentifié\n" +
        "- `403` : Accès interdit\n" +
        "- `404` : Ressource introuvable\n" +
        "- `409` : Conflit (doublon)\n" +
        "- `500` : Erreur serveur",
      contact: {
        name: "CarGuinée",
        url: "https://github.com/kabary-hub/carguinee",
      },
    },
    servers: [
      { url: "http://localhost:3000", description: "Développement" },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Token JWT obtenu via /api/auth/login",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            status: { type: "string", example: "error" },
            message: { type: "string" },
          },
        },
        Success: {
          type: "object",
          properties: {
            status: { type: "string", example: "ok" },
            data: { type: "object" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            phone: { type: "string" },
            email: { type: "string", nullable: true },
            firstName: { type: "string" },
            lastName: { type: "string" },
            role: { type: "string", enum: ["CLIENT", "PROPRIETAIRE", "ADMIN"] },
            isActive: { type: "boolean" },
          },
        },
        Vehicle: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            brand: { type: "string" },
            model: { type: "string" },
            year: { type: "integer", nullable: true },
            type: { type: "string", enum: ["CITADINE", "BERLINE", "SUV", "QUATRE_QUATRE", "UTILITAIRE", "MINIBUS", "CAMION", "MOTO", "AUTRE"] },
            commune: { type: "string", enum: ["KALOUM", "DIXINN", "MATAM", "RATOMA", "MATOTO"] },
            quartier: { type: "string" },
            publicationStatus: { type: "string", enum: ["BROUILLON", "EN_ATTENTE_VALIDATION", "PUBLIEE", "REJETEE", "ARCHIVEE"] },
            supportsRental: { type: "boolean" },
            supportsSale: { type: "boolean" },
            dailyRentalPriceGnf: { type: "integer", nullable: true },
            salePriceGnf: { type: "integer", nullable: true },
            photos: { type: "array", items: { $ref: "#/components/schemas/VehiclePhoto" } },
          },
        },
        VehiclePhoto: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            url: { type: "string" },
            sortOrder: { type: "integer" },
          },
        },
        Booking: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            vehicleId: { type: "string", format: "uuid" },
            customerId: { type: "string", format: "uuid" },
            status: { type: "string", enum: ["EN_ATTENTE", "CONFIRMEE", "EN_COURS", "TERMINEE", "ANNULEE", "REJETEE"] },
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
            totalAmountGnf: { type: "integer" },
          },
        },
        Notification: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            type: { type: "string" },
            title: { type: "string" },
            message: { type: "string" },
            isRead: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ["./src/modules/**/*.ts", "./src/server.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
