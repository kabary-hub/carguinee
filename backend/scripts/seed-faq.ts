/**
 * Script de seed — FAQ entries pour le chatbot.
 *
 * Usage : npx tsx scripts/seed-faq.ts
 *
 * Insère les questions/réponses fréquentes en FR et EN.
 * Les existing entries sont mises à jour (upsert par questionFr unique).
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const FAQ_ENTRIES = [
  // ── GÉNÉRAL ─────────────────────────────────────────────────────────────
  {
    category: "GENERAL",
    sortOrder: 1,
    questionFr: "C'est quoi CarGuinée ?",
    questionEn: "What is CarGuinée?",
    answerFr: "CarGuinée est une plateforme de location avec chauffeur et de vente de véhicules à Conakry, Guinée. Vous pouvez louer un véhicule pour un jour ou plusieurs jours, ou acheter un véhicule d'occasion vérifié.",
    answerEn: "CarGuinée is a chauffeur-driven rental and vehicle sales platform in Conakry, Guinea. You can rent a vehicle for one or more days, or buy a verified used vehicle.",
    keywords: ["carguinee", "c'est quoi", "definition", "application", "plateforme", "service", "what", "definition"],
  },
  {
    category: "GENERAL",
    sortOrder: 2,
    questionFr: "Comment créer un compte ?",
    questionEn: "How to create an account?",
    answerFr: "Pour créer un compte, cliquez sur 'Inscription' en haut à droite. Vous avez besoin d'un numéro de téléphone guinéen (224...) et d'un mot de passe d'au moins 8 caractères. L'inscription est gratuite.",
    answerEn: "To create an account, click 'Sign Up' in the top right. You need a Guinean phone number (224...) and a password of at least 8 characters. Registration is free.",
    keywords: ["inscription", "compte", "creer", "register", "account", "signup", "créer"],
  },
  {
    category: "GENERAL",
    sortOrder: 3,
    questionFr: "Comment se connecter ?",
    questionEn: "How to log in?",
    answerFr: "Allez sur la page de connexion, entrez votre numéro de téléphone et votre mot de passe. Si vous avez oublié votre mot de passe, utilisez le lien 'Mot de passe oublié'.",
    answerEn: "Go to the login page, enter your phone number and password. If you forgot your password, use the 'Forgot password' link.",
    keywords: ["connexion", "login", "connecter", "se connecter", "mot de passe"],
  },

  // ── RÉSERVATION ──────────────────────────────────────────────────────────
  {
    category: "BOOKING",
    sortOrder: 10,
    questionFr: "Comment réserver un véhicule ?",
    questionEn: "How to book a vehicle?",
    answerFr: "1. Parcourez le catalogue de véhicules\n2. Cliquez sur un véhicule qui vous intéresse\n3. Sélectionnez les dates de début et de fin\n4. Cliquez sur 'Demander une réservation'\n5. Le propriétaire doit confirmer votre demande\n6. Une fois confirmée, procédez au paiement",
    answerEn: "1. Browse the vehicle catalog\n2. Click on a vehicle you like\n3. Select start and end dates\n4. Click 'Request booking'\n5. The owner must confirm your request\n6. Once confirmed, proceed to payment",
    keywords: ["reserver", "reservation", "booking", "louer", "location", "comment"],
  },
  {
    category: "BOOKING",
    sortOrder: 11,
    questionFr: "Combien de temps pour qu'un propriétaire confirme ?",
    questionEn: "How long does it take for an owner to confirm?",
    answerFr: "En général, les propriétaires répondent dans les 24 heures. Si votre réservation n'est pas confirmée sous 48 heures, elle est automatiquement annulée.",
    answerEn: "Usually, owners respond within 24 hours. If your booking is not confirmed within 48 hours, it is automatically cancelled.",
    keywords: ["temps", "confirmer", "delai", "attente", "owner", "confirm", "time"],
  },
  {
    category: "BOOKING",
    sortOrder: 12,
    questionFr: "Comment annuler une réservation ?",
    questionEn: "How to cancel a booking?",
    answerFr: "Allez dans 'Mes réservations', trouvez la réservation concernée et cliquez sur 'Annuler'. Si le paiement a déjà été effectué, le remboursement sera traité dans les 7 jours ouvrés.",
    answerEn: "Go to 'My Bookings', find the booking and click 'Cancel'. If payment was already made, the refund will be processed within 7 business days.",
    keywords: ["annuler", "cancel", "reservation", "booking", "remboursement"],
  },

  // ── PAIEMENT ─────────────────────────────────────────────────────────────
  {
    category: "PAYMENT",
    sortOrder: 20,
    questionFr: "Comment payer avec Orange Money ?",
    questionEn: "How to pay with Orange Money?",
    answerFr: "Après la confirmation de votre réservation, un bouton 'Paiement OM' apparaît. Cliquez dessus, entrez votre numéro Orange Money, et confirmez. Vous recevrez une notification sur votre téléphone pour valider le paiement.",
    answerEn: "After your booking is confirmed, a 'OM Payment' button appears. Click it, enter your Orange Money number, and confirm. You'll receive a notification on your phone to validate the payment.",
    keywords: ["orange money", "om", "payer", "paiement", "payment", "pay"],
  },
  {
    category: "PAYMENT",
    sortOrder: 21,
    questionFr: "Les paiements sont-ils sécurisés ?",
    questionEn: "Are payments secure?",
    answerFr: "Oui, nous utilisons l'API officielle d'Orange Money pour traiter les paiements. Aucune donnée bancaire n'est stockée sur notre plateforme. Vos transactions sont protégées par le chiffrement.",
    answerEn: "Yes, we use the official Orange Money API to process payments. No banking data is stored on our platform. Your transactions are protected by encryption.",
    keywords: ["securise", "secure", "paiement", "payment", "bancaire", "donnee"],
  },
  {
    category: "PAYMENT",
    sortOrder: 22,
    questionFr: "Comment fonctionne la caution ?",
    questionEn: "How does the deposit work?",
    answerFr: "La caution est un montant de sécurité demandé par le propriétaire. Elle est prélevée en même temps que le loyer et restituée après le retour du véhicule en bon état. Le montant est indiqué sur la fiche du véhicule.",
    answerEn: "The deposit is a security amount requested by the owner. It is charged along with the rental fee and returned after the vehicle is returned in good condition. The amount is shown on the vehicle listing.",
    keywords: ["caution", "deposit", "securite", "security", "remboursement"],
  },

  // ── COMPTE ───────────────────────────────────────────────────────────────
  {
    category: "ACCOUNT",
    sortOrder: 30,
    questionFr: "Comment modifier mon profil ?",
    questionEn: "How to edit my profile?",
    answerFr: "Allez dans 'Mon profil' depuis le menu. Vous pouvez modifier votre nom, email, et photo. Votre numéro de téléphone ne peut pas être modifié.",
    answerEn: "Go to 'My Profile' from the menu. You can edit your name, email, and photo. Your phone number cannot be changed.",
    keywords: ["profil", "modifier", "edit", "profile", "compte"],
  },
  {
    category: "ACCOUNT",
    sortOrder: 31,
    questionFr: "Comment changer mon mot de passe ?",
    questionEn: "How to change my password?",
    answerFr: "Allez dans 'Mon profil', puis 'Changer le mot de passe'. Entrez votre mot de passe actuel puis le nouveau. Le mot de passe doit faire au moins 8 caractères.",
    answerEn: "Go to 'My Profile', then 'Change Password'. Enter your current password then the new one. The password must be at least 8 characters.",
    keywords: ["mot de passe", "password", "changer", "change", "changement"],
  },
  {
    category: "ACCOUNT",
    sortOrder: 32,
    questionFr: "Comment devenir propriétaire ?",
    questionEn: "How to become an owner?",
    answerFr: "Demandez le statut de propriétaire depuis votre profil. Un administrateur examinera votre demande. Une fois approuvé, vous pourrez publier des véhicules à la location ou à la vente.",
    answerEn: "Request owner status from your profile. An administrator will review your request. Once approved, you can publish vehicles for rent or sale.",
    keywords: ["proprietaire", "owner", "devenir", "become", "statut", "status"],
  },

  // ── VÉHICULE ─────────────────────────────────────────────────────────────
  {
    category: "VEHICLE",
    sortOrder: 40,
    questionFr: "Les véhicules sont-ils vérifiés ?",
    questionEn: "Are vehicles verified?",
    answerFr: "Oui, tous les véhicules publiés sont vérifiés par notre équipe avant mise en ligne. Nous vérifions les documents, l'état du véhicule et l'identité du propriétaire.",
    answerEn: "Yes, all published vehicles are verified by our team before being listed. We check documents, vehicle condition, and owner identity.",
    keywords: ["verifie", "verified", "securise", "safe", "confiance", "trust"],
  },
  {
    category: "VEHICLE",
    sortOrder: 41,
    questionFr: "Comment ajouter un véhicule ?",
    questionEn: "How to add a vehicle?",
    answerFr: "Vous devez d'abord avoir le statut de propriétaire. Ensuite, allez dans 'Tableau de bord propriétaire' et cliquez sur 'Ajouter un véhicule'. Remplissez le formulaire avec les informations du véhicule, ajoutez des photos, et soumettez pour validation.",
    answerEn: "You must first have owner status. Then go to 'Owner Dashboard' and click 'Add Vehicle'. Fill in the vehicle information form, add photos, and submit for validation.",
    keywords: ["ajouter", "vehicule", "add", "vehicle", "publier", "publish"],
  },
  {
    category: "VEHICLE",
    sortOrder: 42,
    questionFr: "Combien de photos puis-je ajouter ?",
    questionEn: "How many photos can I add?",
    answerFr: "Vous pouvez ajouter jusqu'à 8 photos par véhicule. Les formats acceptés sont JPEG, PNG et WebP. Chaque photo ne doit pas dépasser 2 Mo.",
    answerEn: "You can add up to 8 photos per vehicle. Accepted formats are JPEG, PNG, and WebP. Each photo must not exceed 2 MB.",
    keywords: ["photo", "photos", "ajouter", "images", "picture", "max"],
  },

  // ── AVIS ─────────────────────────────────────────────────────────────────
  {
    category: "REVIEW",
    sortOrder: 50,
    questionFr: "Comment laisser un avis ?",
    questionEn: "How to leave a review?",
    answerFr: "Après une réservation terminée, vous pouvez laisser un avis sur le véhicule et le propriétaire. Allez dans 'Mes réservations', trouvez la réservation terminée, et cliquez sur 'Laisser un avis'.",
    answerEn: "After a completed reservation, you can leave a review on the vehicle and owner. Go to 'My Bookings', find the completed reservation, and click 'Leave a review'.",
    keywords: ["avis", "review", "note", "rating", "laisser", "leave"],
  },
];

async function main() {
  console.log("🔄 Seed des FAQ entries...\n");

  let created = 0;
  let updated = 0;

  for (const entry of FAQ_ENTRIES) {
    const existing = await prisma.faqEntry.findFirst({
      where: { questionFr: entry.questionFr },
    });

    if (existing) {
      await prisma.faqEntry.update({
        where: { id: existing.id },
        data: entry,
      });
      updated++;
    } else {
      await prisma.faqEntry.create({ data: entry });
      created++;
    }
  }

  console.log(`✅ FAQ seed terminé : ${created} créées, ${updated} mises à jour`);
  console.log(`📊 Total : ${FAQ_ENTRIES.length} FAQ entries`);

  const total = await prisma.faqEntry.count();
  console.log(`📦 Total en base : ${total} entries`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("❌ Erreur :", error);
  process.exit(1);
});
