import path from "node:path";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { isAllowedOrigin } from "./config/cors.js";
import { prisma } from "./lib/prisma.js";
import { env } from "./config/env.js";
import { adminRouter } from "./modules/admin/admin.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { bookingRouter } from "./modules/bookings/booking.routes.js";
import { ownerRequestRouter } from "./modules/owner-requests/owner-request.routes.js";
import { vehicleRouter } from "./modules/vehicles/vehicle.routes.js";
import { vehiclePhotoRouter } from "./modules/vehicles/vehicle-photo.routes.js";
import { reviewRouter } from "./modules/reviews/review.routes.js";
import { favoriteRouter } from "./modules/favorites/favorite.routes.js";
import { notificationRouter } from "./modules/notifications/notification.routes.js";
import { chatRouter } from "./modules/chat/chat.routes.js";
import { contractRouter } from "./modules/contracts/contract.routes.js";
import { reportRouter, adminReportRouter } from "./modules/reports/report.routes.js";
import { translateRouter } from "./modules/translate/translate.routes.js";
import { authLimiter, standardLimiter } from "./lib/rate-limiter.js";
import { logger, requestLogger } from "./lib/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { securityHeaders } from "./middleware/securityHeaders.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

const app = express();

const allowedOrigins = new Set([
  env.CORS_ORIGIN,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
]);

app.use(securityHeaders);
app.use(helmet({
  // Les photos /uploads sont servies par l'API (port 3000) mais affichées
  // par le frontend (port 5173) : la ressource doit rester lisible en
  // cross-origin, sinon les navigateurs bloquent les images téléversées.
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin, allowedOrigins)) {
      callback(null, true);
      return;
    }
    callback(new Error("Origine non autorisée par la politique CORS."));
  },
}));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(requestLogger);

// Les photos téléversées (backend/uploads/vehicles) sont servies depuis
// /uploads afin que le frontend puisse les afficher directement.
app.use("/uploads", express.static(path.resolve("uploads")));

app.use("/api/admin", standardLimiter, adminRouter);
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/bookings", standardLimiter, bookingRouter);
app.use("/api/owner-requests", standardLimiter, ownerRequestRouter);
app.use("/api/vehicles", standardLimiter, vehicleRouter);
app.use("/api/vehicles", standardLimiter, vehiclePhotoRouter);
app.use("/api/reviews", standardLimiter, reviewRouter);
app.use("/api/favorites", standardLimiter, favoriteRouter);
app.use("/api/notifications", standardLimiter, notificationRouter);
app.use("/api/messages", standardLimiter, chatRouter);
app.use("/api/contracts", standardLimiter, contractRouter);
app.use("/api/reports", standardLimiter, reportRouter);
app.use("/api/admin/reports", standardLimiter, adminReportRouter);
app.use("/api", standardLimiter, translateRouter);

// ── Swagger UI ──────────────────────────────────────────────────────────────
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "CarGuinée API — Documentation",
}));
app.get("/api/docs.json", (_request, response) => {
  response.setHeader("Content-Type", "application/json");
  response.send(swaggerSpec);
});

app.get("/api/health", async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    response.json({
      status: "ok",
      service: "carguinee-api",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, "Health check database error");

    response.status(503).json({
      status: "error",
      service: "carguinee-api",
      database: "unavailable",
    });
  }
});


app.use((_request, response) => {
  response.status(404).json({
    status: "error",
    message: "Route introuvable",
  });
});

// ── Middleware d'erreur global (doit être APRÈS toutes les routes) ────────
app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "CarGuinée API démarrée");
});
