/**
 * Service Chatbot FAQ — Assistance automatique.
 *
 * 1. Réponses directes (hardcoded) pour salutations et patterns courants
 * 2. Recherche floue dans la base de FAQ avec scoring par mots-clés
 * 3. Fallback en bonne langue si aucun match
 */

import { prisma } from "../../lib/prisma.js";
import { randomUUID } from "crypto";

// ── Types ────────────────────────────────────────────────────────────────

export interface ChatResponse {
  message: string;
  faqEntryId?: string;
  category?: string;
  confidence: number; // 0-1
  suggestions?: string[]; // Questions similaires
}

// ── Réponses directes (hardcoded) ────────────────────────────────────────

interface DirectReply {
  patterns: RegExp[];
  response: { fr: string; en: string };
  suggestions?: { fr: string[]; en: string[] };
}

const DIRECT_REPLIES: DirectReply[] = [
  // Salutations (toujours en premier)
  {
    patterns: [/(bonjour|salut|hello|coucou|hey|bonsoir|good morning|good evening)/i],
    response: {
      fr: "Bonjour ! 👋 Je suis l'assistant CarGuinée. Comment puis-je vous aider aujourd'hui ?",
      en: "Hello! 👋 I'm the CarGuinée assistant. How can I help you today?",
    },
    suggestions: {
      fr: ["Comment réserver un véhicule ?", "Comment payer ?", "Comment créer un compte ?"],
      en: ["How to book a vehicle?", "How to pay?", "How to create an account?"],
    },
  },
  // Merci
  {
    patterns: [/(merci|thanks|thank you|remercie|super merci)/i],
    response: {
      fr: "Avec plaisir ! 😊 N'hésitez pas si vous avez d'autres questions.",
      en: "You're welcome! 😊 Feel free to ask if you have more questions.",
    },
  },
  // Au revoir
  {
    patterns: [/(au revoir|bye|à bientôt|goodbye|see you|ciao)/i],
    response: {
      fr: "Au revoir ! 👋 Passez une bonne journée et à bientôt sur CarGuinée !",
      en: "Goodbye! 👋 Have a great day and see you soon on CarGuinée!",
    },
  },
  // Annulation (AVANT réserver car "annuler reservation" contient "reserv")
  {
    patterns: [/(annul|cancel|rembour|refund)/i],
    response: {
      fr: "Pour annuler une réservation :\n\n1️⃣ Allez dans « Mes réservations »\n2️⃣ Sélectionnez la réservation concernée\n3️⃣ Cliquez sur « Annuler »\n\n⚠️ L'annulation est possible avant le début de la location. Le remboursement dépend de la politique d'annulation du propriétaire.",
      en: "To cancel a booking:\n\n1️⃣ Go to \"My Bookings\"\n2️⃣ Select the booking\n3️⃣ Click \"Cancel\"\n\n⚠️ Cancellation is possible before the rental starts. Refund depends on the owner's cancellation policy.",
    },
  },
  // Tarifs / Prix (AVANT réserver car "combien coute" ne doit pas matcher "reserv")
  {
    patterns: [/(prix|tarif|price|rate|cout|co[uû]t|combien|cher)/i],
    response: {
      fr: "Les tarifs de location sont fixés par chaque propriétaire et affichés sur la fiche du véhicule. 💰\n\nVous pouvez filtrer le catalogue par prix pour trouver un véhicule dans votre budget.",
      en: "Rental rates are set by each owner and displayed on the vehicle listing. 💰\n\nYou can filter the catalog by price to find a vehicle within your budget.",
    },
  },
  // Payer
  {
    patterns: [/(paye|paiement|orange money|payer|regler|transaction)/i],
    response: {
      fr: "Le paiement se fait via **Orange Money** :\n\n1️⃣ Après confirmation de votre réservation, allez dans « Mes réservations »\n2️⃣ Cliquez sur « Paiement OM »\n3️⃣ Entrez votre numéro Orange Money\n4️⃣ Validez sur votre téléphone\n\nLe paiement est sécurisé et instantané. ✅",
      en: "Payment is made via **Orange Money**:\n\n1️⃣ After your booking is confirmed, go to \"My Bookings\"\n2️⃣ Click \"OM Payment\"\n3️⃣ Enter your Orange Money number\n4️⃣ Confirm on your phone\n\nPayment is secure and instant. ✅",
    },
    suggestions: {
      fr: ["Comment réserver ?", "Comment obtenir un reçu ?"],
      en: ["How to book?", "How to get a receipt?"],
    },
  },
  // Créer un compte
  {
    patterns: [/(inscri|compte|register|account|sign\s*up|créer.*compte)/i],
    response: {
      fr: "Pour créer un compte CarGuinée :\n\n1️⃣ Cliquez sur « Inscription »\n2️⃣ Entrez votre numéro de téléphone guinéen\n3️⃣ Créez un mot de passe\n4️⃣ Remplissez votre profil\n\nVous pouvez ensuite réserver des véhicules ou devenir propriétaire ! 🚗",
      en: "To create a CarGuinée account:\n\n1️⃣ Click \"Register\"\n2️⃣ Enter your Guinean phone number\n3️⃣ Create a password\n4️⃣ Fill in your profile\n\nYou can then book vehicles or become an owner! 🚗",
    },
  },
  // Devenir propriétaire
  {
    patterns: [/(propri[eé]taire|owner|devenir.*propri|louer.*voiture.*coté|mettre.*en\s*location)/i],
    response: {
      fr: "Pour devenir propriétaire sur CarGuinée :\n\n1️⃣ Créez un compte client\n2️⃣ Allez dans votre profil et cliquez « Devenir propriétaire »\n3️⃣ Remplissez le formulaire de demande\n4️⃣ Un administrateur examinera votre demande\n\nUne fois approuvé, vous pourrez publier et gérer vos véhicules ! 🚘",
      en: "To become an owner on CarGuinée:\n\n1️⃣ Create a client account\n2️⃣ Go to your profile and click \"Become an owner\"\n3️⃣ Fill in the application form\n4️⃣ An admin will review your request\n\nOnce approved, you can publish and manage your vehicles! 🚘",
    },
  },
  // Réserver (après annulation/tarifs pour éviter les faux positifs)
  {
    patterns: [/(r[eé]serv|book|location|louer|prendre\s+un\s+vehicule)/i],
    response: {
      fr: "Pour réserver un véhicule :\n\n1️⃣ Parcourez le catalogue (section Véhicules)\n2️⃣ Sélectionnez le véhicule qui vous convient\n3️⃣ Choisissez vos dates de location\n4️⃣ Envoyez votre demande de réservation\n5️⃣ Le propriétaire confirmtera votre réservation\n\nAprès confirmation, vous pourrez payer via Orange Money. 💰",
      en: "To book a vehicle:\n\n1️⃣ Browse the catalog (Vehicles section)\n2️⃣ Select the vehicle you like\n3️⃣ Choose your rental dates\n4️⃣ Send your booking request\n5️⃣ The owner will confirm your booking\n\nAfter confirmation, you can pay via Orange Money. 💰",
    },
    suggestions: {
      fr: ["Comment payer avec Orange Money ?", "Quels sont les tarifs ?", "Comment annuler ?"],
      en: ["How to pay with Orange Money?", "What are the rates?", "How to cancel?"],
    },
  },
  // Contact / Support
  {
    patterns: [/(contact|support|aide|help|assistance|joindre|telephone|email|contacter)/i],
    response: {
      fr: "Vous pouvez nous contacter de plusieurs façons :\n\n💬 Utilisez ce chatbot pour les questions fréquentes\n📧 Envoyez un email au support\n📱 Appelez-nous pendant les heures ouvrées\n\nComment puis-je vous aider ?",
      en: "You can contact us in several ways:\n\n💬 Use this chatbot for FAQ\n📧 Send an email to support\n📱 Call us during business hours\n\nHow can I help you?",
    },
  },
];

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
 * Traite un message utilisateur et retourne la meilleure réponse.
 * 1. Vérifie les réponses directes (hardcoded)
 * 2. Cherche dans les FAQs
 * 3. Fallback en bonne langue
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

  // ── 1. Réponses directes (hardcoded) ──
  const normalized = normalizeText(userMessage);
  const directMatch = DIRECT_REPLIES.find((dr) =>
    dr.patterns.some((p) => p.test(userMessage)),
  );

  if (directMatch) {
    // Délai artificiel de 2 secondes pour un effet naturel
    await delay(2000);

    const response: ChatResponse = {
      message: directMatch.response[lang],
      confidence: 1,
      suggestions: directMatch.suggestions?.[lang],
      category: "DIRECT",
    };

    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "assistant",
        content: response.message,
      },
    });

    return response;
  }

  // ── 2. Recherche dans les FAQs ──
  const faqs = await prisma.faqEntry.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const scored = faqs.map((faq) => {
    const score = scoreMatch(normalized, faq, lang);
    return { entry: faq, score };
  }).filter((s) => s.score > 0.1);

  scored.sort((a, b) => b.score - a.score);

  if (scored.length > 0 && scored[0].score >= 0.3) {
    const bestMatch = scored[0];

    // Délai artificiel
    await delay(2000);

    // Incrémenter les vues
    await prisma.faqEntry.update({
      where: { id: bestMatch.entry.id },
      data: { views: { increment: 1 } },
    });

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

  // ── 3. Fallback ──
  await delay(2000);

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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
