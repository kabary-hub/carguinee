import { prisma } from "../../lib/prisma.js";

/**
 * Rôle d'un utilisateur
 */
export type UserRole = "CLIENT" | "PROPRIETAIRE" | "ADMIN";

/**
 * Récupère ou crée une conversation entre deux utilisateurs pour un véhicule donné
 */
export async function getOrCreateConversation(
  senderId: string,
  receiverId: string,
  vehicleId?: string,
) {
  // Vérifier que le destinataire existe
  const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
  if (!receiver) {
    throw new Error("Destinataire introuvable.");
  }

  if (senderId === receiverId) {
    throw new Error("Vous ne pouvez pas vous envoyer un message à vous-même.");
  }

  // Trier les IDs pour garantir l'unicité (participant1 < participant2)
  const [p1, p2] = senderId < receiverId ? [senderId, receiverId] : [receiverId, senderId];

  // Chercher une conversation existante
  const existing = await prisma.conversation.findFirst({
    where: {
      participant1Id: p1,
      participant2Id: p2,
      vehicleId: vehicleId ?? null,
    },
    include: {
      participant1: { select: { id: true, firstName: true, lastName: true } },
      participant2: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (existing) return existing;

  // Créer une nouvelle conversation
  return prisma.conversation.create({
    data: {
      participant1Id: p1,
      participant2Id: p2,
      vehicleId: vehicleId ?? null,
    },
    include: {
      participant1: { select: { id: true, firstName: true, lastName: true } },
      participant2: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

/**
 * Envoie un message dans une conversation
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new Error("Conversation introuvable.");
  }

  // Vérifier que l'expéditeur est un participant
  if (conversation.participant1Id !== senderId && conversation.participant2Id !== senderId) {
    throw new Error("Vous ne faites pas partie de cette conversation.");
  }

  const receiverId =
    conversation.participant1Id === senderId
      ? conversation.participant2Id
      : conversation.participant1Id;

  // Créer le message
  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      receiverId,
      content,
    },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true } },
      receiver: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  // Mettre à jour la conversation avec le dernier message
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      lastMessage: content.length > 100 ? content.substring(0, 100) + "…" : content,
      lastMessageAt: new Date(),
    },
  });

  return message;
}

/**
 * Récupère les conversations de l'utilisateur avec le nombre de messages non lus
 */
export async function listConversations(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ participant1Id: userId }, { participant2Id: userId }],
    },
    orderBy: { lastMessageAt: "desc" },
    include: {
      participant1: { select: { id: true, firstName: true, lastName: true } },
      participant2: { select: { id: true, firstName: true, lastName: true } },
      messages: {
        orderBy: { sentAt: "desc" },
        take: 1,
        include: {
          sender: { select: { id: true, firstName: true } },
        },
      },
    },
  });

  // Compter les messages non lus par conversation
  const conversationsWithUnread = await Promise.all(
    conversations.map(async (conv) => {
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conv.id,
          receiverId: userId,
          isRead: false,
        },
      });
      return { ...conv, unreadCount };
    })
  );

  return conversationsWithUnread;
}

/**
 * Récupère les messages d'une conversation
 */
export async function getMessages(
  conversationId: string,
  userId: string,
  options?: { page?: number; pageSize?: number },
) {
  // Vérifier l'accès
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new Error("Conversation introuvable.");
  }

  if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
    throw new Error("Accès non autorisé à cette conversation.");
  }

  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 50;
  const skip = (page - 1) * pageSize;

  const [items, total, unreadCount] = await prisma.$transaction([
    prisma.message.findMany({
      where: { conversationId, deletedAt: null },
      skip,
      take: pageSize,
      orderBy: { sentAt: "desc" },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
        receiver: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.message.count({ where: { conversationId, deletedAt: null } }),
    prisma.message.count({ where: { conversationId, receiverId: userId, isRead: false } }),
  ]);

  // Marquer les messages reçus comme lus
  await prisma.message.updateMany({
    where: { conversationId, receiverId: userId, isRead: false },
    data: { isRead: true },
  });

  return {
    items: items.reverse(), // Afficher les plus anciens en premier
    unreadCount,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Compte les messages non lus pour un utilisateur
 */
export async function getUnreadMessageCount(userId: string): Promise<number> {
  const rows = await prisma.message.groupBy({
    by: ["conversationId"],
    where: { receiverId: userId, isRead: false },
  });
  return rows.length;
}

// ── Modifier un message ─────────────────────────────────────────────────────

/**
 * Modifie le contenu d'un message. Seul l'expéditeur peut modifier son message.
 */
export async function editMessage(
  messageId: string,
  userId: string,
  newContent: string,
) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) throw new Error("Message introuvable.");
  if (message.senderId !== userId) {
    throw new Error("Vous ne pouvez modifier que vos propres messages.");
  }
  if (message.deletedAt) {
    throw new Error("Impossible de modifier un message supprimé.");
  }

  return prisma.message.update({
    where: { id: messageId },
    data: { content: newContent, editedAt: new Date() },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true } },
      receiver: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

// ── Supprimer un message (soft delete) ───────────────────────────────────────

/**
 * Supprime un message (soft delete). Seul l'expéditeur ou un admin peut supprimer.
 * Le contenu est remplacé par un placeholder.
 */
export async function deleteMessage(
  messageId: string,
  userId: string,
  userRole: UserRole,
) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) throw new Error("Message introuvable.");

  const isSender = message.senderId === userId;
  const isAdmin = userRole === "ADMIN";
  if (!isSender && !isAdmin) {
    throw new Error("Vous ne pouvez supprimer que vos propres messages.");
  }
  if (message.deletedAt) {
    throw new Error("Ce message est déjà supprimé.");
  }

  // Si c'est un admin qui supprime → masquer le contenu (suppression définitive)
  // Si c'est l'expéditeur → soft delete (le contenu est préservé pour l'admin)
  if (isAdmin) {
    return prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date(), content: "[Message supprimé par l'administration]" },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
        receiver: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  return prisma.message.update({
    where: { id: messageId },
    data: { deletedAt: new Date() },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true } },
      receiver: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

// ── Admin : lister toutes les conversations ──────────────────────────────────

/**
 * Admin : récupère toutes les conversations avec le dernier message.
 * L'admin peut voir les conversations dont il ne fait pas partie.
 */
export async function adminListConversations(options?: {
  page?: number;
  pageSize?: number;
}) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 50;
  const skip = (page - 1) * pageSize;

  const [items, total] = await prisma.$transaction([
    prisma.conversation.findMany({
      skip,
      take: pageSize,
      orderBy: { lastMessageAt: "desc" },
      include: {
        participant1: { select: { id: true, firstName: true, lastName: true } },
        participant2: { select: { id: true, firstName: true, lastName: true } },
        messages: {
          orderBy: { sentAt: "desc" },
          take: 1,
          include: {
            sender: { select: { id: true, firstName: true } },
          },
        },
        _count: { select: { messages: true } },
      },
    }),
    prisma.conversation.count(),
  ]);

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// ── Admin : récupérer les messages d'une conversation ────────────────────────

/**
 * Admin : récupère les messages d'une conversation spécifique.
 * Lecture seule — pas de marquage automatique comme lu.
 */
export async function adminGetMessages(
  conversationId: string,
  options?: { page?: number; pageSize?: number },
) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });
  if (!conversation) throw new Error("Conversation introuvable.");

  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 50;
  const skip = (page - 1) * pageSize;

  const [items, total] = await prisma.$transaction([
    prisma.message.findMany({
      where: { conversationId },
      skip,
      take: pageSize,
      orderBy: { sentAt: "desc" },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
        receiver: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.message.count({ where: { conversationId } }),
  ]);

  return {
    items: items.reverse(),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
