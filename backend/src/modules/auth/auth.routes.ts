import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "./auth.middleware.js";
import { login, register } from "./auth.service.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";
import { extractUserId, handleRouteError } from "../../lib/route-helpers.js";
import { strictLimiter } from "../../lib/rate-limiter.js";
import { logger } from "../../lib/logger.js";

export const authRouter = Router();

authRouter.post("/register", async (request, response) => {
  const parsed = registerSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      status: "error",
      message: "Données d'inscription invalides.",
      details: parsed.error.flatten(),
    });
    return;
  }

  try {
    const result = await register(parsed.data);
    response.status(201).json({ status: "ok", data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Inscription impossible.";
    const statusCode = message.includes("déjà utilisée") ? 409 : 400;
    response.status(statusCode).json({ status: "error", message });
  }
});

authRouter.post("/login", async (request, response) => {
  const parsed = loginSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      status: "error",
      message: "Données de connexion invalides.",
      details: parsed.error.flatten(),
    });
    return;
  }

  try {
    const result = await login(parsed.data);
    response.json({ status: "ok", data: result });
  } catch (error) {
    response.status(401).json({ status: "error", message: "Identifiants invalides." });
  }
});

authRouter.get("/me", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.isActive) {
    response.status(404).json({ status: "error", message: "Utilisateur introuvable." });
    return;
  }

  response.json({
    status: "ok",
    data: {
      id: user.id,
      phone: user.phone,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
    },
  });
});

// ── Modification du profil ──────────────────────────────────────────────────
const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  email: z.string().trim().email().nullable().optional(),
  phone: z.string().trim().min(1).optional(),
});

// ── Modification du mot de passe (utilisateur connecté) ───────────────────
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

authRouter.post("/change-password", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  const parsed = changePasswordSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ status: "error", message: "Données invalides." });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      response.status(404).json({ status: "error", message: "Utilisateur introuvable." });
      return;
    }
    const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!valid) {
      response.status(401).json({ status: "error", message: "Mot de passe actuel incorrect." });
      return;
    }
    const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
    response.json({ status: "ok", message: "Mot de passe modifié avec succès." });
  } catch (error) {
    handleRouteError(error, response, "Erreur.", 500);
  }
});

// ── Réinitialisation du mot de passe (envoi code par SMS ou email) ──────────
const forgotPasswordSchema = z.object({ phone: z.string().min(1), method: z.enum(["sms", "email"]).optional() });

authRouter.post("/forgot-password", strictLimiter, async (request, response) => {
  const parsed = forgotPasswordSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ status: "error", message: "Données invalides." });
    return;
  }
  try {
    const user = await prisma.user.findUnique({ where: { phone: parsed.data.phone } });
    if (!user) {
      response.json({ status: "ok", message: "Si ce numéro existe, un code a été envoyé." });
      return;
    }
    const code = crypto.randomInt(100000, 999999).toString();
    const method = parsed.data.method ?? "sms";
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Invalider les anciens codes non utilisés pour ce téléphone
    await prisma.passwordReset.updateMany({
      where: { phone: user.phone, used: false },
      data: { used: true },
    });

    // Créer le nouveau code en DB
    await prisma.passwordReset.create({
      data: { phone: user.phone, code, expiresAt },
    });

    if (method === "email" && user.email) {
      logger.info({ userId: user.id, method: "email" }, "Password reset code sent");
      response.json({ status: "ok", message: "Code envoyé par email." });
    } else {
      logger.info({ userId: user.id, method: "sms" }, "Password reset code sent");
      response.json({ status: "ok", message: "Code envoyé par SMS." });
    }
  } catch (error) {
    handleRouteError(error, response, "Erreur.", 500);
  }
});

// ── Vérifier le code de réinitialisation ─────────────────────────────────────
const verifyResetCodeSchema = z.object({ phone: z.string().min(1), code: z.string().length(6) });

authRouter.post("/verify-reset-code", async (request, response) => {
  const parsed = verifyResetCodeSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ status: "error", message: "Données invalides." });
    return;
  }
  const entry = await prisma.passwordReset.findFirst({
    where: { phone: parsed.data.phone, code: parsed.data.code, used: false },
    orderBy: { createdAt: "desc" },
  });
  if (!entry || entry.expiresAt < new Date()) {
    response.status(400).json({ status: "error", message: "Code invalide ou expiré." });
    return;
  }
  if (entry.attempts >= entry.maxAttempts) {
    response.status(400).json({ status: "error", message: "Trop de tentatives. Demandez un nouveau code." });
    return;
  }
  // Incrémenter les tentatives
  await prisma.passwordReset.update({ where: { id: entry.id }, data: { attempts: { increment: 1 } } });
  response.json({ status: "ok", message: "Code vérifié." });
});

// ── Réinitialiser le mot de passe avec le code ───────────────────────────────
const resetPasswordSchema = z.object({ phone: z.string().min(1), code: z.string().length(6), newPassword: z.string().min(8) });

authRouter.post("/reset-password", async (request, response) => {
  const parsed = resetPasswordSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ status: "error", message: "Données invalides." });
    return;
  }
  const entry = await prisma.passwordReset.findFirst({
    where: { phone: parsed.data.phone, code: parsed.data.code, used: false },
    orderBy: { createdAt: "desc" },
  });
  if (!entry || entry.expiresAt < new Date()) {
    response.status(400).json({ status: "error", message: "Code invalide ou expiré." });
    return;
  }
  try {
    const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await prisma.user.update({ where: { phone: parsed.data.phone }, data: { passwordHash: newHash } });
    // Marquer le code comme utilisé
    await prisma.passwordReset.update({ where: { id: entry.id }, data: { used: true } });
    response.json({ status: "ok", message: "Mot de passe réinitialisé avec succès." });
  } catch (error) {
    handleRouteError(error, response, "Erreur.", 500);
  }
});

authRouter.patch("/me", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  const parsed = updateProfileSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({
      status: "error",
      message: "Données invalides.",
      details: parsed.error.flatten(),
    });
    return;
  }

  try {
    const data = parsed.data;

    if (data.phone) {
      const existingUser = await prisma.user.findFirst({
        where: { phone: data.phone, id: { not: userId } },
      });
      if (existingUser) {
        response.status(409).json({ status: "error", message: "Ce numéro de téléphone est déjà utilisé." });
        return;
      }
    }

    if (data.email) {
      const existingEmail = await prisma.user.findFirst({
        where: { email: data.email, id: { not: userId } },
      });
      if (existingEmail) {
        response.status(409).json({ status: "error", message: "Cette adresse email est déjà utilisée." });
        return;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone && { phone: data.phone }),
      },
      select: {
        id: true,
        phone: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    response.json({ status: "ok", data: updatedUser });
  } catch (error) {
    handleRouteError(error, response, "Modification impossible.");
  }
});
