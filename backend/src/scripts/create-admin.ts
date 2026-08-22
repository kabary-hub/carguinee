import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { normalizeGuineaPhone } from "../modules/auth/phone.js";

const readline = createInterface({ input, output });

try {
  const phoneInput = await readline.question("Numero de telephone admin : ");
  const password = await readline.question("Mot de passe admin : ");
  const firstName = await readline.question("Prenom admin : ");
  const lastName = await readline.question("Nom admin : ");

  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error("Le mot de passe doit contenir au moins 8 caracteres, une lettre et un chiffre.");
  }

  const phone = normalizeGuineaPhone(phoneInput);
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { phone },
    update: {
      passwordHash,
      firstName,
      lastName,
      role: "ADMIN",
      isActive: true,
    },
    create: {
      phone,
      passwordHash,
      firstName,
      lastName,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log(`Compte ADMIN pret pour ${admin.phone}.`);
} finally {
  readline.close();
  await prisma.$disconnect();
}
