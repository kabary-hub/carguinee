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
}) {
  return {
    id: user.id,
    phone: user.phone,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
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

export async function login(input: LoginInput) {
  const phone = normalizeGuineaPhone(input.phone);

  const user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user || !user.isActive) {
    throw new Error("Identifiants invalides.");
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
