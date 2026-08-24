import { roleLabel } from "../../lib/roles";
import type { ReactivationRequest, ModerationUser } from "./moderationTypes";

// ── Composant StatusBadge ────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    REJECTED: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  };
  const labels: Record<string, string> = {
    PENDING: "En attente",
    APPROVED: "Acceptée",
    REJECTED: "Refusée",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${styles[status] ?? ""}`}>
      {labels[status] ?? status}
    </span>
  );
}

// ── Composant InfoRow ────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
      <span className="min-w-[140px] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</span>
    </div>
  );
}

// ── Props communes ───────────────────────────────────────────────────────────

type DetailModalBase = {
  onClose: () => void;
  formatDate: (d: string) => string;
  t: (key: string) => string;
  actionLoading: boolean;
};

// ── DetailModal pour demande de réactivation ─────────────────────────────────

export function RequestDetailModal({
  req,
  onClose,
  onApprove,
  onReject,
  onBan,
  formatDate,
  t,
  actionLoading,
}: DetailModalBase & {
  req: ReactivationRequest;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onBan: (userId: string, ban: boolean) => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
            {t("admin.moderation.detailRequest")}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <InfoRow label={t("admin.moderation.table.user")} value={`${req.firstName} ${req.lastName}`} />
          <InfoRow label={t("admin.moderation.table.phone")} value={req.phone} />
          <InfoRow label={t("admin.moderation.table.email")} value={req.user.email ?? "—"} />
          <InfoRow label={t("admin.moderation.table.role")} value={roleLabel(req.user.role)} />
          <InfoRow label={t("admin.moderation.table.reason")} value={req.reason ?? "—"} />
          <InfoRow label={t("admin.moderation.table.status")} value={<StatusBadge status={req.status} />} />
          <InfoRow label={t("admin.moderation.table.date")} value={formatDate(req.createdAt)} />
          {req.reviewedAt && (
            <InfoRow label={t("admin.moderation.reviewedAt")} value={formatDate(req.reviewedAt)} />
          )}
          {req.reviewedBy && (
            <InfoRow label={t("admin.moderation.reviewedBy")} value={`${req.reviewedBy.firstName} ${req.reviewedBy.lastName}`} />
          )}
          {req.rejectionReason && (
            <InfoRow label={t("admin.moderation.rejectionReason")} value={req.rejectionReason} />
          )}
          <InfoRow
            label={t("admin.moderation.accountStatus")}
            value={
              req.user.isActive ? (
                <span className="text-emerald-600 dark:text-emerald-400">Actif</span>
              ) : req.user.isBanned ? (
                <span className="text-rose-600 dark:text-rose-400">🚫 Banni</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">⏸ Désactivé</span>
              )
            }
          />
        </div>

        {req.status === "PENDING" && (
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => onApprove(req.id)}
              disabled={actionLoading}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              ✓ {t("admin.moderation.approve")}
            </button>
            <button
              onClick={() => onReject(req.id)}
              disabled={actionLoading}
              className="rounded-xl border border-rose-300 px-4 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-800 dark:text-rose-400"
            >
              ✗ {t("admin.moderation.reject")}
            </button>
            <button
              onClick={() => onBan(req.userId, true)}
              disabled={actionLoading}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300"
            >
              🚫 {t("admin.moderation.ban")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── DetailModal pour utilisateur modéré ──────────────────────────────────────

export function UserDetailModal({
  user,
  onClose,
  onBan,
  onDeactivate,
  formatDate,
  t,
  actionLoading,
}: DetailModalBase & {
  user: ModerationUser;
  onBan: (userId: string, ban: boolean) => void;
  onDeactivate: (userId: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
            {t("admin.moderation.detailUser")}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <InfoRow label={t("admin.moderation.table.user")} value={`${user.firstName} ${user.lastName}`} />
          <InfoRow label={t("admin.moderation.table.phone")} value={user.phone} />
          <InfoRow label={t("admin.moderation.table.email")} value={user.email ?? "—"} />
          <InfoRow label={t("admin.moderation.table.role")} value={roleLabel(user.role)} />
          <InfoRow label={t("admin.moderation.table.vehicles")} value={String(user._count.vehicles)} />
          <InfoRow label={t("admin.moderation.table.bookings")} value={String(user._count.rentalBookings)} />
          <InfoRow label={t("admin.moderation.table.date")} value={formatDate(user.createdAt)} />
          <InfoRow
            label={t("admin.moderation.table.badge")}
            value={
              user.isBanned ? (
                <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                  🚫 {t("admin.moderation.banned")}
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  ⏸ {t("admin.moderation.deactivated")}
                </span>
              )
            }
          />
        </div>

        <div className="mt-6 flex gap-2">
          {user.isBanned ? (
            <button
              onClick={() => onBan(user.id, false)}
              disabled={actionLoading}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {t("admin.moderation.unban")}
            </button>
          ) : (
            <>
              <button
                onClick={() => onBan(user.id, true)}
                disabled={actionLoading}
                className="rounded-xl border border-rose-300 px-4 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-800 dark:text-rose-400"
              >
                🚫 {t("admin.moderation.ban")}
              </button>
              <button
                onClick={() => onDeactivate(user.id)}
                disabled={actionLoading}
                className="rounded-xl border border-amber-300 px-4 py-2 text-sm font-bold text-amber-600 transition hover:bg-amber-50 disabled:opacity-60 dark:border-amber-700 dark:text-amber-400"
              >
                ⏸ {t("admin.moderation.deactivate")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
