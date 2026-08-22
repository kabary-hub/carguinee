/**
 * Script de migration : met à jour les comptes démo vers les nouveaux
 * identifiants demandés.
 *
 * Usage :  npx tsx prisma/update-accounts.ts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL manquante.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const NEW_PASSWORD_HASH = await bcrypt.hash("12345678", 12);

// Anciens numéros → nouveaux numéros
const migrations = [
  { oldPhone: "+224600000010", newPhone: "+224620980117", firstName: "Admin", lastName: "Guinée", email: "admin@carguinee.local", role: "ADMIN" as const },
  { oldPhone: "+224600000011", newPhone: "+224620980118", firstName: "Mamadou", lastName: "Camara", email: "proprietaire@carguinee.local", role: "PROPRIETAIRE" as const },
];

// Compte client à créer s'il n'existe pas
const CLIENT = { phone: "+224620980119", firstName: "Ibrahima", lastName: "Diallo", email: "client@carguinee.local", role: "CLIENT" as const };

async function main() {
  for (const m of migrations) {
    const user = await prisma.user.findUnique({ where: { phone: m.oldPhone } });
    if (!user) {
      // L'ancien compte n'existe pas → créer directement le nouveau
      const exists = await prisma.user.findUnique({ where: { phone: m.newPhone } });
      if (exists) {
        console.log(`⚠  ${m.newPhone} existe déjà, mise à jour du profil.`);
        await prisma.user.update({
          where: { phone: m.newPhone },
          data: { firstName: m.firstName, lastName: m.lastName, email: m.email, role: m.role, passwordHash: NEW_PASSWORD_HASH, isActive: true, isPhoneVerified: true },
        });
      } else {
        console.log(`Création de ${m.firstName} ${m.lastName} (${m.newPhone})…`);
        await prisma.user.create({
          data: { phone: m.newPhone, firstName: m.firstName, lastName: m.lastName, email: m.email, role: m.role, passwordHash: NEW_PASSWORD_HASH, isPhoneVerified: true },
        });
      }
    } else {
      // L'ancien compte existe → mettre à jour son numéro et profil
      if (m.oldPhone !== m.newPhone) {
        // Vérifier que le nouveau numéro n'est pas déjà pris
        const conflict = await prisma.user.findUnique({ where: { phone: m.newPhone } });
        if (conflict && conflict.id !== user.id) {
          console.log(`⚠  Conflit : ${m.newPhone} est déjà utilisé par un autre compte. Suppression du doublon…`);
          // Transférer les véhicules et réservations avant suppression
          await prisma.vehicle.updateMany({ where: { ownerId: conflict.id }, data: { ownerId: user.id } });
          await prisma.rentalBooking.updateMany({ where: { customerId: conflict.id }, data: { customerId: user.id } });
          await prisma.user.delete({ where: { id: conflict.id } });
        }
        // Mettre à jour le numéro (via delete + recreate car phone est unique)
        await prisma.user.update({
          where: { id: user.id },
          data: {
            phone: m.newPhone,
            firstName: m.firstName,
            lastName: m.lastName,
            email: m.email,
            role: m.role,
            passwordHash: NEW_PASSWORD_HASH,
            isActive: true,
            isPhoneVerified: true,
          },
        });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            firstName: m.firstName,
            lastName: m.lastName,
            email: m.email,
            passwordHash: NEW_PASSWORD_HASH,
            isActive: true,
            isPhoneVerified: true,
          },
        });
      }
      console.log(`✅  ${m.role} : ${m.oldPhone} → ${m.newPhone} (${m.firstName} ${m.lastName})`);
    }
  }

  // ── Client ──
  const existingClient = await prisma.user.findUnique({ where: { phone: CLIENT.phone } });
  if (!existingClient) {
    console.log(`Création du client ${CLIENT.firstName} ${CLIENT.lastName} (${CLIENT.phone})…`);
    await prisma.user.create({
      data: { phone: CLIENT.phone, firstName: CLIENT.firstName, lastName: CLIENT.lastName, email: CLIENT.email, role: CLIENT.role, passwordHash: NEW_PASSWORD_HASH, isPhoneVerified: true },
    });
    console.log(`✅  Client créé : ${CLIENT.phone}`);
  } else {
    await prisma.user.update({
      where: { phone: CLIENT.phone },
      data: { firstName: CLIENT.firstName, lastName: CLIENT.lastName, email: CLIENT.email, role: CLIENT.role, passwordHash: NEW_PASSWORD_HASH, isActive: true, isPhoneVerified: true },
    });
    console.log(`✅  Client mis à jour : ${CLIENT.phone}`);
  }

  console.log("\n───────────────────────────────────────");
  console.log("Comptes mis à jour :");
  console.log("  Admin        : 620980117 / 12345678");
  console.log("  Propriétaire : 620980118 / 12345678");
  console.log("  Client       : 620980119 / 12345678");
}

main()
  .catch((error) => {
    console.error("Erreur :", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
