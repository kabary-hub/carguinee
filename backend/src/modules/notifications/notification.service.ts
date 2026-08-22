import { prisma } from "../../lib/prisma.js";

/**
 * Crée une notification pour un utilisateur
 */
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string,
) {
  return prisma.notification.create({
    data: { userId, type, title, message, link },
  });
}

/**
 * Récupère les notifications de l'utilisateur (avec pagination)
 */
export async function listNotifications(
  userId: string,
  options?: { page?: number; pageSize?: number; unreadOnly?: boolean },
) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where = {
    userId,
    ...(options?.unreadOnly ? { isRead: false } : {}),
  };

  const [items, total, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    items,
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
 * Marque une notification comme lue
 */
export async function markAsRead(userId: string, notificationId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new Error("Notification introuvable.");
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

/**
 * Marque toutes les notifications de l'utilisateur comme lues
 */
export async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return { updated: true };
}

/**
 * Compte les notifications non lues
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}
