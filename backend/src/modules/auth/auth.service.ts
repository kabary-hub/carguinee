import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { normalizeGuineaPhone } from "./phone.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

export function toPublicUser(user: {
  id: string;
  phone: string;
  email: string | null;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  isBanned?: boolean;
}) {
  return {
    id: user.id,
    phone: user.phone,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    isBanned: user.isBanned ?? false,
  };
}

function createAccessToken(user: {
  id: string;
  phone: string;
  role: string;
}) {
  return jwt.sign(
    {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    },
    env.JWT_SECRET,
    { expiresIn: "24h" },
  );
}

export async function register(input: RegisterInput) {
  const phone = normalizeGuineaPhone(input.phone);
  const email = input.email?.toLowerCase();

  const existingPhone = await prisma.user.findUnique({
    where: { phone },
  });

  if (existingPhone) {
    throw new Error("Ce numéro de téléphone est déjà utilisé.");
  }

  if (email) {
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      throw new Error("Cette adresse email est déjà utilisée.");
    }
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      phone,
      email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: "CLIENT",
    },
  });

  return {
    user: toPublicUser(user),
    accessToken: createAccessToken(user),
  };
}

export class AccountDeactivatedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccountDeactivatedError";
  }
}

export class AccountBannedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccountBannedError";
  }
}

export async function login(input: LoginInput) {
  const phone = normalizeGuineaPhone(input.phone);

  const user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user) {
    throw new Error("Identifiants invalides.");
  }

  if (user.isBanned) {
    throw new AccountBannedError("Votre compte a été suspendu. Veuillez contacter le support.");
  }

  if (!user.isActive) {
    throw new AccountDeactivatedError("Votre compte a été désactivé.");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new Error("Identifiants invalides.");
  }

  return {
    user: toPublicUser(user),
    accessToken: createAccessToken(user),
  };
}
