/**
 * Script de test — Vérifie que le chatbot répond aux questions.
 *
 * Usage : npx tsx scripts/test-chatbot.ts
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { processMessage, initChatSession } from "../src/modules/chatbot/chatbot.service.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🧪 Test du chatbot FAQ\n");

  // Vérifier les FAQ
  const faqCount = await prisma.faqEntry.count({ where: { isActive: true } });
  console.log(`📦 FAQ en base : ${faqCount}`);

  if (faqCount === 0) {
    console.log("❌ Aucune FAQ trouvée. Lancez d'abord : npx tsx scripts/seed-faq.ts");
    await prisma.$disconnect();
    process.exit(1);
  }

  // Créer une session
  const sessionId = await initChatSession();
  console.log(`🔑 Session : ${sessionId}\n`);

  // Tests de questions
  const tests = [
    { question: "Comment réserver un véhicule ?", expected: "réservation" },
    { question: "Comment payer ?", expected: "Orange Money" },
    { question: "C'est quoi CarGuinée ?", expected: "plateforme" },
    { question: "Comment changer mon mot de passe ?", expected: "profil" },
    { question: "Les véhicules sont-ils vérifiés ?", expected: "vérifiés" },
    { question: "zorglblub123", expected: "désolé" }, // Pas de match
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const response = await processMessage(test.question, sessionId, "fr");
    const lowerMessage = response.message.toLowerCase();
    const match = lowerMessage.includes(test.expected.toLowerCase());

    const status = match ? "✅" : "❌";
    if (match) passed++; else failed++;

    console.log(`${status} Question : "${test.question}"`);
    console.log(`   Réponse : "${response.message.substring(0, 100)}..."`);
    console.log(`   Confiance : ${(response.confidence * 100).toFixed(0)}%`);
    if (response.suggestions?.length) {
      console.log(`   Suggestions : ${response.suggestions.join(", ")}`);
    }
    console.log("");
  }

  console.log(`\n📊 Résultat : ${passed}/${tests.length} tests passés`);

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Erreur :", error);
  process.exit(1);
});
