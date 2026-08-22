import pino from "pino";
import type { Request, Response, NextFunction } from "express";

/**
 * Logger structuré pour le backend CarGuinée.
 * - En développement : format lisible avec pino-pretty
 * - En production : JSON structuré pour ELK/Datadog
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});

/**
 * Middleware Express qui ajoute un correlation ID unique à chaque requête
 * et loggue la méthode, l'URL, le status et la durée.
 */
export function requestLogger(request: Request, response: Response, next: NextFunction) {
  const startTime = Date.now();
  const correlationId = crypto.randomUUID();
  const requestId = request.headers["x-request-id"] as string | undefined;
  const id = requestId ?? correlationId;

  // Attacher le correlation ID au request pour les routes en aval
  request.headers["x-request-id"] = id;

  response.setHeader("X-Request-Id", id);

  response.on("finish", () => {
    const duration = Date.now() - startTime;
    const logData = {
      requestId: id,
      method: request.method,
      url: request.originalUrl,
      status: response.statusCode,
      duration: `${duration}ms`,
      ip: request.ip,
    };

    if (response.statusCode >= 500) {
      logger.error(logData, "Request failed");
    } else if (response.statusCode >= 400) {
      logger.warn(logData, "Request error");
    } else {
      logger.info(logData, "Request completed");
    }
  });

  next();
}
