import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "../../components/ThemeToggle";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { PasswordManager } from "../../components/profile/PasswordManager";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { apiFetch } from "../../lib/api";
import { getHomeRouteForRole } from "../../lib/roles";

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  // ── RGPD : Désactivation de compte ──
  const handleDeactivate = async () => {
    try {
      await apiFetch("/api/auth/deactivate", { method: "POST" });
      showToast(t("rgpd.deactivateSuccess"));
      logout();
      navigate("/connexion", { replace: true });
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("rgpd.deactivateError"), "error");
    } finally {
      setShowDeactivateConfirm(false);
    }
  };

  // ── RGPD : Export des données ──
  const handleExportData = async () => {
    setExporting(true);
    try {
      const response = await apiFetch<Blob>("/api/auth/export-data", {});
      const blob = new Blob([JSON.stringify(response)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "carguinee-mes-donnees.json";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast(t("rgpd.exportSuccess"));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("rgpd.exportError"), "error");
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    showToast(t("logout.success"));
    navigate("/connexion", { replace: true });
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await apiFetch<{
        status: string;
        data: { id: string; phone: string; email: string | null; firstName: string; lastName: string; role: string; isActive: boolean };
      }>("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email || null,
          phone: formData.phone,
        }),
      });
      showToast(t("profile.success"));
      setIsEditing(false);
      window.location.reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("profile.updateImpossible"));
      showToast(reason instanceof Error ? reason.message : t("profile.updateImpossible"), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main
      className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 dark:bg-slate-950"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          navigate(getHomeRouteForRole(user.role), { replace: true });
        }
      }}
    >
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(getHomeRouteForRole(user.role))}
            className="text-sm font-semibold text-emerald-700 dark:text-emerald-400"
          >
            {t("common.backToMySpace")}
          </button>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                {t("profile.mySpace")}
              </p>
              <h1 className="mt-3 text-3xl font-black text-slate-900 dark:text-slate-100">
                {user.firstName} {user.lastName}
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t("profile.profileSubtitle")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  {t("profile.editProfile")}
                </button>
              )}
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-500/15"
              >
                {t("profile.logout")}
              </button>
            </div>
          </div>

          {/* Affichage normal ou mode édition */}
          {!isEditing ? (
            <>
              {/* Nom et prénom + infos */}
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-emerald-50 p-5 dark:bg-emerald-500/15">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    {t("profile.fullName")}
                  </p>
                  <p className="mt-2 text-lg font-black text-emerald-900 dark:text-emerald-200">
                    {user.firstName} {user.lastName}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/60">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {t("profile.phone")}
                  </p>
                  <p className="mt-2 font-semibold text-slate-900 dark:text-slate-100">{user.phone}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/60">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {t("profile.email")}
                  </p>
                  <p className="mt-2 font-semibold text-slate-900 dark:text-slate-100">
                    {user.email ?? t("profile.notProvided")}
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-5 dark:bg-emerald-500/15">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    {t("profile.role")}
                  </p>
                  <p className="mt-2 font-semibold text-emerald-900 dark:text-emerald-200">
                    {user.role}
                  </p>
                </div>
              </div>

              {/* ── Section Gestion du mot de passe ── */}
              <div className="mt-8">
                <PasswordManager userPhone={user.phone} userEmail={user.email} />
              </div>
            </>
          ) : (
            <form onSubmit={handleSave} className="mt-8 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("profile.firstName")}
                  <input
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData((c) => ({ ...c, firstName: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("profile.lastName")}
                  <input
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData((c) => ({ ...c, lastName: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </label>
              </div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("profile.phone")}
                <input
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData((c) => ({ ...c, phone: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("profile.emailOptional")}
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((c) => ({ ...c, email: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </label>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? t("profile.saving") : t("profile.saveChanges")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      firstName: user.firstName,
                      lastName: user.lastName,
                      email: user.email ?? "",
                      phone: user.phone,
                    });
                    setError("");
                  }}
                  className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  {t("profile.cancel")}
                </button>
              </div>
            </form>
          )}

          {/* ── Section RGPD : Droits de l'utilisateur ── */}
          {!isEditing && (
            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm sm:p-6 dark:border-amber-800/40 dark:bg-amber-500/5">
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">🛡️ {t("rgpd.title")}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("rgpd.description")}</p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleExportData}
                  disabled={exporting}
                  className="rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-3 font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                >
                  {exporting ? t("rgpd.exporting") : t("rgpd.exportData")}
                </button>

                <button
                  onClick={() => setShowDeactivateConfirm(true)}
                  className="rounded-xl border border-red-300 px-5 py-3 font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-500/15"
                >
                  {t("rgpd.deactivateAccount")}
                </button>
              </div>

              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                {t("rgpd.deactivateNote")}
              </p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showDeactivateConfirm}
        title={t("rgpd.deactivateConfirmTitle")}
        message={t("rgpd.deactivateConfirmMessage")}
        confirmLabel={t("rgpd.deactivateConfirmButton")}
        tone="rose"
        onConfirm={handleDeactivate}
        onCancel={() => setShowDeactivateConfirm(false)}
      />

      <ConfirmDialog
        open={showLogoutConfirm}
        title={t("logout.title")}
        message={t("logout.message")}
        confirmLabel={t("logout.confirmLabel")}
        tone="rose"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </main>
  );
}
