/**
 * Point d'entrée réseau de CarGuinée.
 *
 * Responsabilités : effets de bord de démarrage (Sentry, Redis) puis mise en
 * écoute HTTP. La construction de l'application (middlewares + routes) vit dans
 * app.ts et en est importée — ce qui permet de tester l'API sans démarrer le
 * serveur.
 */

import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { initSentry } from "./lib/sentry.js";
import { initRedis } from "./lib/redis.js";

initSentry();
await initRedis();

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "CarGuinée API démarrée");
});
