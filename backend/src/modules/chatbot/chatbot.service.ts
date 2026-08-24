/**
 * Service Chatbot FAQ — Assistance automatique.
 *
 * Recherche floue dans la base de FAQ avec scoring par mots-clés.
 * Ne nécessite aucune IA externe : matching par texte.
 */

import { prisma } from "../../lib/prisma.js";
import { logger } from "../../lib/logger.js";
import { randomUUID } from "crypto";

// ── Types ────────────────────────────────────────────────────────────────

export interface ChatResponse {
  message: string;
  faqEntryId?: string;
  category?: string;
  confidence: number; // 0-1
  suggestions?: string[]; // Questions similaires
}

// ── Service ──────────────────────────────────────────────────────────────

/**
 * Initialise une session de chat (ou retourne une existante).
 */
export async function initChatSession(
  userId?: string,
  existingSessionId?: string,
): Promise<string> {
  if (existingSessionId) {
    const existing = await prisma.chatSession.findUnique({
      where: { sessionId: existingSessionId },
    });
    if (existing && existing.status === "ACTIVE") {
      return existingSessionId;
    }
  }

  const sessionId = randomUUID();
  await prisma.chatSession.create({
    data: {
      sessionId,
      userId: userId ?? undefined,
      status: "ACTIVE",
    },
  });

  return sessionId;
}

/**
 * Traite un message utilisateur et retourne la meilleure réponse FAQ.
 */
export async function processMessage(
  userMessage: string,
  sessionId: string,
  lang: "fr" | "en" = "fr",
): Promise<ChatResponse> {
  // Sauvegarder le message utilisateur
  const session = await prisma.chatSession.findUnique({
    where: { sessionId },
  });

  if (!session) {
    throw new Error("Session introuvable");
  }

  await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: "user",
      content: userMessage,
    },
  });

  // Normaliser le message
  const normalized = normalizeText(userMessage);

  // Chercher dans les FAQs actives
  const faqs = await prisma.faqEntry.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  // Scoring
  let bestMatch: { entry: (typeof faqs)[0]; score: number } | null = null;
  const scored = faqs.map((faq) => {
    const score = scoreMatch(normalized, faq, lang);
    return { entry: faq, score };
  }).filter((s) => s.score > 0.1);

  scored.sort((a, b) => b.score - a.score);

  if (scored.length > 0 && scored[0].score >= 0.3) {
    bestMatch = scored[0];

    // Incrémenter les vues
    await prisma.faqEntry.update({
      where: { id: bestMatch.entry.id },
      data: { views: { increment: 1 } },
    });

    // Suggestions : les 3 prochaines questions
    const suggestions = scored.slice(1, 4).map((s) =>
      lang === "fr" ? s.entry.questionFr : s.entry.questionEn,
    );

    const response: ChatResponse = {
      message: lang === "fr" ? bestMatch.entry.answerFr : bestMatch.entry.answerEn,
      faqEntryId: bestMatch.entry.id,
      category: bestMatch.entry.category,
      confidence: bestMatch.score,
      suggestions,
    };

    // Sauvegarder la réponse
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "assistant",
        content: response.message,
        faqEntryId: bestMatch.entry.id,
      },
    });

    return response;
  }

  // Pas de match — réponse par défaut
  const fallbackMessage =
    lang === "fr"
      ? "Je suis désolé, je n'ai pas trouvé de réponse à votre question. Vous pouvez contacter notre support ou consulter la FAQ complète."
      : "I'm sorry, I couldn't find an answer to your question. You can contact our support or browse the full FAQ.";

  await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: "assistant",
      content: fallbackMessage,
    },
  });

  return {
    message: fallbackMessage,
    confidence: 0,
    suggestions: faqs
      .filter((f) => f.isActive)
      .slice(0, 3)
      .map((f) => (lang === "fr" ? f.questionFr : f.questionEn)),
  };
}

/**
 * Récupère l'historique d'une session de chat.
 */
export async function getChatHistory(sessionId: string): Promise<
  Array<{ role: string; content: string; createdAt: Date }>
> {
  const session = await prisma.chatSession.findUnique({
    where: { sessionId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: { role: true, content: true, createdAt: true },
      },
    },
  });

  return session?.messages ?? [];
}

/**
 * Marque un retour "utile/pas utile" sur une réponse.
 */
export async function rateResponse(
  faqEntryId: string,
  helpful: boolean,
): Promise<void> {
  await prisma.faqEntry.update({
    where: { id: faqEntryId },
    data: helpful ? { helpful: { increment: 1 } } : { notHelpful: { increment: 1 } },
  });
}

/**
 * Liste toutes les catégories de FAQ.
 */
export async function getFaqCategories(): Promise<
  Array<{ category: string; count: number }>
> {
  const categories = await prisma.faqEntry.groupBy({
    by: ["category"],
    where: { isActive: true },
    _count: { category: true },
    orderBy: { category: "asc" },
  });

  return categories.map((c) => ({
    category: c.category,
    count: c._count.category,
  }));
}

// ── Helpers ──────────────────────────────────────────────────────────────

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprimer les accents
    .replace(/[^\w\s]/g, " ")        // Ponctuation → espace
    .replace(/\s+/g, " ")            // Espaces multiples → 1
    .trim();
}

function scoreMatch(
  query: string,
  faq: { questionFr: string; questionEn: string; keywords: string[]; category: string },
  lang: "fr" | "en",
): number {
  const question = normalizeText(lang === "fr" ? faq.questionFr : faq.questionEn);
  const keywords = faq.keywords.map(normalizeText);
  const queryWords = query.split(" ");

  let score = 0;

  // Exact match (question contains the query)
  if (question.includes(query)) {
    score += 0.8;
  }

  // Word-by-word matching
  const matchingWords = queryWords.filter(
    (w) => w.length > 2 && question.includes(w),
  );
  score += (matchingWords.length / queryWords.length) * 0.5;

  // Keywords matching
  const keywordMatches = keywords.filter((k) =>
    queryWords.some((qw) => qw.length > 2 && k.includes(qw)),
  );
  score += (keywordMatches.length / Math.max(keywords.length, 1)) * 0.3;

  // Bonus: exact question match
  const cleanQuestion = question.replace(/[?！。.]/g, "").trim();
  const cleanQuery = query.replace(/[?！。.]/g, "").trim();
  if (cleanQuestion === cleanQuery) {
    score += 0.5;
  }

  return Math.min(score, 1);
}
