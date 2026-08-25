import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "./auth.middleware.js";
import { login, register, AccountDeactivatedError, AccountBannedError } from "./auth.service.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";
import { extractUserId, handleRouteError } from "../../lib/route-helpers.js";
import { strictLimiter, authLimiter } from "../../lib/rate-limiter.js";
import { logger } from "../../lib/logger.js";
import { sendPasswordResetEmail } from "../../lib/email.js";
import { env } from "../../config/env.js";

export const authRouter = Router();

/**
 * Place le JWT dans un cookie httpOnly (inaccessible au JavaScript côté client).
 * Le même token est aussi retourné dans le body pour la rétrocompatibilité.
 */
function setAuthCookie(response: any, token: string) {
  response.cookie("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000, // 24h
  });
}

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Inscription d'un nouvel utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, password, firstName, lastName]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+224123456789"
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "Password1"
 *               firstName:
 *                 type: string
 *                 example: "Mamadou"
 *               lastName:
 *                 type: string
 *                 example: "Diallo"
 *     responses:
 *       201:
 *         description: Inscription réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *       400:
 *         description: Données invalides
 *       409:
 *         description: Téléphone ou email déjà utilisé
 */
authRouter.post("/register", authLimiter, async (request, response) => {
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
    setAuthCookie(response, result.accessToken);
    response.status(201).json({ status: "ok", data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Inscription impossible.";
    const statusCode = message.includes("déjà utilisée") ? 409 : 400;
    response.status(statusCode).json({ status: "error", message });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Connexion utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, password]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+224123456789"
 *               password:
 *                 type: string
 *                 example: "Password1"
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Identifiants invalides
 */
authRouter.post("/login", authLimiter, async (request, response) => {
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
    setAuthCookie(response, result.accessToken);
    response.json({ status: "ok", data: result });
  } catch (error) {
    if (error instanceof AccountDeactivatedError) {
      response.status(403).json({
        status: "error",
        code: "ACCOUNT_DEACTIVATED",
        message: error.message,
      });
      return;
    }
    if (error instanceof AccountBannedError) {
      response.status(403).json({
        status: "error",
        code: "ACCOUNT_BANNED",
        message: error.message,
      });
      return;
    }
    const message = error instanceof Error ? error.message : "Identifiants invalides.";
    response.status(401).json({ status: "error", message });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Profil utilisateur connecté
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Utilisateur introuvable
 */
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
      isBanned: user.isBanned,
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

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Changer son mot de passe
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Mot de passe modifié
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Mot de passe actuel incorrect
 */
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

// ── Réinitialisation du mot de passe (envoi code par email) ──────────────
const forgotPasswordSchema = z.object({ phone: z.string().min(1), method: z.enum(["sms", "email"]).default("email") });

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Demander un code de réinitialisation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+224123456789"
 *               method:
 *                 type: string
 *                 enum: [sms, email]
 *                 default: email
 *     responses:
 *       200:
 *         description: Code envoyé
 *       400:
 *         description: Données invalides
 */
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
    const method = parsed.data.method ?? "email";
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
      const emailSent = await sendPasswordResetEmail(user.email, code);
      if (emailSent) {
        logger.info({ userId: user.id, method: "email" }, "Password reset code sent");
        response.json({ status: "ok", message: "Code envoyé par email." });
      } else {
        logger.error({ userId: user.id }, "Failed to send reset email");
        response.status(500).json({ status: "error", message: "Impossible d'envoyer l'email. Réessayez." });
      }
    } else {
      logger.info({ userId: user.id, method: "sms" }, "Password reset code logged (SMS not configured)");
      response.json({ status: "ok", message: "Code généré. (SMS non configuré — en dev, vérifiez les logs du serveur)" });
    }
  } catch (error) {
    handleRouteError(error, response, "Erreur.", 500);
  }
});

// ── Vérifier le code de réinitialisation ─────────────────────────────────────
const verifyResetCodeSchema = z.object({ phone: z.string().min(1), code: z.string().length(6) });

/**
 * @swagger
 * /api/auth/verify-reset-code:
 *   post:
 *     tags: [Auth]
 *     summary: Vérifier le code de réinitialisation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, code]
 *             properties:
 *               phone:
 *                 type: string
 *               code:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *     responses:
 *       200:
 *         description: Code vérifié
 *       400:
 *         description: Code invalide ou expiré
 */
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

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Réinitialiser le mot de passe avec le code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, code, newPassword]
 *             properties:
 *               phone:
 *                 type: string
 *               code:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé
 *       400:
 *         description: Code invalide ou expiré
 */
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

/**
 * @swagger
 * /api/auth/me:
 *   patch:
 *     tags: [Auth]
 *     summary: Modifier son profil
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profil mis à jour
 *       400:
 *         description: Données invalides
 *       409:
 *         description: Téléphone ou email déjà utilisé
 */
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

// ── Logout ───────────────────────────────────────────────────────────────
authRouter.post("/logout", (_request, response) => {
  response.clearCookie("auth_token", { path: "/" });
  response.json({ status: "ok", message: "Déconnexion réussie." });
});
