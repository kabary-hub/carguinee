/**
 * Application Express de CarGuinée — construction pure, sans démarrage réseau.
 *
 * Ce module monte tous les middlewares et routes puis EXPORTE `app`, sans jamais
 * appeler `app.listen()` ni déclencher d'effets de bord (Sentry, Redis). Le
 * démarrage vit dans server.ts. Cette séparation rend l'API testable de bout en
 * bout via supertest (`request(app)...`) sans ouvrir de port.
 */

import path from "node:path";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { isAllowedOrigin } from "./config/cors.js";
import { prisma } from "./lib/prisma.js";
import { env } from "./config/env.js";
import { adminRouter } from "./modules/admin/admin.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { rgpdRouter } from "./modules/auth/rgpd.routes.js";
import { reactivationRouter } from "./modules/auth/reactivation.routes.js";
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
import { standardLimiter, chatbotLimiter, writeLimiter } from "./lib/rate-limiter.js";
import { requestLogger } from "./lib/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { securityHeaders, cspReportHandler } from "./middleware/securityHeaders.js";
import { metricsMiddleware } from "./middleware/metrics.js";
import { metricsRouter } from "./modules/metrics/metrics.routes.js";
import { featureFlagsRouter } from "./modules/admin/feature-flags.routes.js";
import { paymentRouter } from "./modules/payments/payment.routes.js";
import { referralRouter } from "./modules/referrals/referral.routes.js";
import { chatbotRouter } from "./modules/chatbot/chatbot.routes.js";
import { boostingRouter } from "./modules/boosting/boosting.routes.js";
import { loyaltyRouter } from "./modules/loyalty/loyalty.routes.js";
import { statsRouter } from "./modules/stats/stats.routes.js";
import { setCsrfCookie, validateCsrf, refreshCsrf } from "./middleware/csrf.js";
import { swaggerSpec } from "./config/swagger.js";
import { apiVersioning } from "./middleware/apiVersioning.js";

const app = express();

const allowedOrigins = new Set([
  env.CORS_ORIGIN,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
]);

app.use(securityHeaders);
app.use(apiVersioning);
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
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(cookieParser());
app.use(setCsrfCookie);
app.use(requestLogger);
app.use(metricsMiddleware);

// Les photos téléversées (backend/uploads/vehicles) sont servies depuis
// /uploads afin que le frontend puisse les afficher directement.
app.use("/uploads", express.static(path.resolve("uploads")));

app.use("/api/admin", standardLimiter, validateCsrf, adminRouter);
app.use("/api/admin/feature-flags", standardLimiter, validateCsrf, featureFlagsRouter);
app.use("/api/payments", standardLimiter, paymentRouter);
app.use("/api/referrals", standardLimiter, referralRouter);
app.use("/api/chatbot", chatbotLimiter, chatbotRouter);
app.use("/api/boosting", writeLimiter, validateCsrf, boostingRouter);
app.use("/api/loyalty", standardLimiter, validateCsrf, loyaltyRouter);
app.use("/api/stats", standardLimiter, validateCsrf, statsRouter);
app.post("/api/auth/csrf-refresh", refreshCsrf);
app.use("/api/auth", standardLimiter, authRouter);
app.use("/api/auth", standardLimiter, reactivationRouter);
app.use("/api/auth", standardLimiter, rgpdRouter);
app.use("/api/bookings", standardLimiter, validateCsrf, bookingRouter);
app.use("/api/owner-requests", standardLimiter, validateCsrf, ownerRequestRouter);
app.use("/api/vehicles", standardLimiter, validateCsrf, vehicleRouter);
app.use("/api/vehicles", standardLimiter, vehiclePhotoRouter);
app.use("/api/reviews", standardLimiter, validateCsrf, reviewRouter);
app.use("/api/favorites", standardLimiter, validateCsrf, favoriteRouter);
app.use("/api/notifications", standardLimiter, validateCsrf, notificationRouter);
app.use("/api/messages", standardLimiter, validateCsrf, chatRouter);
app.use("/api/contracts", standardLimiter, validateCsrf, contractRouter);
app.use("/api/reports", standardLimiter, reportRouter);
app.use("/api/admin/reports", standardLimiter, adminReportRouter);
app.use("/api", standardLimiter, translateRouter);

// ── Swagger UI ──────────────────────────────────────────────────────────────
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "CarGuinée API — Documentation",
}));
app.use("/metrics", metricsRouter);
app.get("/api/docs.json", (_request, response) => {
  response.setHeader("Content-Type", "application/json");
  response.send(swaggerSpec);
});

app.post("/api/csp-report", express.json({ type: "application/csp-report" }), cspReportHandler);
app.post("/api/csp-report", express.json({ type: "application/reports+json" }), cspReportHandler);

app.get("/api/health", async (_request, response) => {
  const startTime = Date.now();
  const checks: Record<string, string> = {};
  let overallStatus = "ok";

  // 1. Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "connected";
  } catch {
    checks.database = "unavailable";
    overallStatus = "degraded";
  }

  // 2. Memory check
  const mem = process.memoryUsage();
  const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(mem.heapTotal / 1024 / 1024);
  checks.memory = `${heapUsedMB}MB / ${heapTotalMB}MB`;

  // 3. Uptime
  const uptimeSeconds = Math.round(process.uptime());
  checks.uptime = `${uptimeSeconds}s`;

  // 4. Node version
  checks.nodeVersion = process.version;

  // 5. Environment
  checks.environment = process.env.NODE_ENV ?? "development";

  const statusCode = overallStatus === "ok" ? 200 : 503;
  response.status(statusCode).json({
    status: overallStatus,
    service: "carguinee-api",
    version: process.env.npm_package_version ?? "1.0.0",
    checks,
    responseTime: `${Date.now() - startTime}ms`,
    timestamp: new Date().toISOString(),
  });
});


app.use((_request, response) => {
  response.status(404).json({
    status: "error",
    message: "Route introuvable",
  });
});

// ── Middleware d'erreur global (doit être APRÈS toutes les routes) ────────
app.use(errorHandler);

export { app };
