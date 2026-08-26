/**
 * Audit Logging — trace toutes les actions sensibles dans le système.
 * 
 * En production : logs structurés JSON pour ELK/Datadog.
 * En dev : logs colorés via pino-pretty.
 * 
 * Actions tracées :
 *   - Auth : login, logout, register, password reset
 *   - Admin : ban/unban user, approve/reject vehicles, delete content
 *   - Owner : create/edit/delete vehicle, activate boost
 *   - Client : create/cancel booking, payment, review
 *   - Security : failed login, rate limit hit, CSRF violation
 */
import { logger } from "./logger.js";

export type AuditAction =
  | "auth.login"
  | "auth.logout"
  | "auth.register"
  | "auth.password_reset"
  | "auth.password_change"
  | "auth.account_deactivate"
  | "auth.account_reactivation_request"
  | "admin.user_ban"
  | "admin.user_unban"
  | "admin.user_suspend"
  | "admin.user_role_change"
  | "admin.vehicle_approve"
  | "admin.vehicle_reject"
  | "admin.vehicle_delete"
  | "admin.booking_cancel"
  | "admin.report_resolve"
  | "admin.feature_flag_toggle"
  | "owner.vehicle_create"
  | "owner.vehicle_update"
  | "owner.vehicle_delete"
  | "owner.vehicle_submit"
  | "owner.boost_activate"
  | "owner.boost_cancel"
  | "client.booking_create"
  | "client.booking_cancel"
  | "client.booking_deposit"
  | "client.payment_om"
  | "client.review_create"
  | "client.favorite_toggle"
  | "client.message_send"
  | "security.login_failed"
  | "security.rate_limit_hit"
  | "security.csrf_violation"
  | "security.unauthorized_access";

interface AuditEntry {
  timestamp: string;
  action: AuditAction;
  userId?: string;
  phone?: string;
  role?: string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  success: boolean;
}

/**
 * Enregistre une entrée d'audit.
 * En production, ces logs sont ingérés par ELK/Datadog pour le monitoring.
 */
export function auditLog(entry: Omit<AuditEntry, "timestamp">) {
  const fullEntry: AuditEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  // Logger en JSON structuré pour la machine
  if (entry.success) {
    logger.info({ audit: fullEntry }, `[AUDIT] ${entry.action}`);
  } else {
    logger.warn({ audit: fullEntry }, `[AUDIT] ${entry.action} (failed)`);
  }
}

/**
 * Helper pour tracer un login réussi.
 */
export function auditLogin(userId: string, phone: string, role: string, ip?: string) {
  auditLog({
    action: "auth.login",
    userId,
    phone,
    role,
    ip,
    success: true,
  });
}

/**
 * Helper pour tracer un login échoué.
 */
export function auditLoginFailed(phone: string, ip?: string, reason?: string) {
  auditLog({
    action: "security.login_failed",
    phone,
    ip,
    details: { reason },
    success: false,
  });
}

/**
 * Helper pour tracer une action admin.
 */
export function auditAdminAction(
  action: AuditAction,
  adminId: string,
  targetUserId: string,
  details?: Record<string, unknown>,
) {
  auditLog({
    action,
    userId: adminId,
    details: { targetUserId, ...details },
    success: true,
  });
}
