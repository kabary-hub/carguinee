import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "../../components/ThemeToggle";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { PasswordInput } from "../../components/PasswordInput";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { apiFetch } from "../../lib/api";
import { getHomeRouteForRole } from "../../lib/roles"

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // ── Gestion du mot de passe ──
  const [passwordMode, setPasswordMode] = useState<null | "change" | "reset">(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    resetCode: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [resetStep, setResetStep] = useState<"method" | "email" | "code" | "new">("method");
  const [resetMethod, setResetMethod] = useState<"sms" | "email">("sms");


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
      // Mettre à jour le contexte d'auth en rechargeant la page
      showToast(t("profile.success"));
      setIsEditing(false);
      // Recharger la page pour que le contexte prenne en compte les nouvelles données
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
        // Cliquer en dehors de la carte profil pour fermer
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
              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">🔒 {t("profile.passwordManagement")}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("profile.passwordManagementDesc")}</p>

                {!passwordMode && (
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={() => { setPasswordMode("change"); setPasswordError(""); setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "", resetCode: "" }); }}
                      className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
                    >
                      {t("profile.changePassword")}
                    </button>
                    <button
                      onClick={() => { setPasswordMode("reset"); setPasswordError(""); setResetStep("method"); setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "", resetCode: "" }); }}
                      className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      {t("profile.forgotPassword")}
                    </button>
                  </div>
                )}

                {/* ── Mode Modifier le mot de passe ── */}
                {passwordMode === "change" && (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setPasswordError("");
                    if (passwordData.newPassword !== passwordData.confirmPassword) {
                      setPasswordError(t("auth.register.errors.passwordsDontMatch"));
                      return;
                    }
                    if (passwordData.newPassword.length < 8) {
                      setPasswordError(t("auth.register.errors.passwordTooShort"));
                      return;
                    }
                    setPasswordSaving(true);
                    try {
                      await apiFetch("/api/auth/change-password", {
                        method: "POST",
                        body: JSON.stringify({
                          currentPassword: passwordData.currentPassword,
                          newPassword: passwordData.newPassword,
                        }),
                      });
                      showToast(t("profile.passwordChanged"));
                      setPasswordMode(null);
                    } catch (err) {
                      setPasswordError(err instanceof Error ? err.message : t("profile.passwordChangeError"));
                    } finally {
                      setPasswordSaving(false);
                    }
                  }} className="mt-4 space-y-4">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{t("profile.changePasswordTitle")}</p>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t("profile.currentPassword")}
                      <PasswordInput required value={passwordData.currentPassword} onChange={(val) => setPasswordData((c) => ({ ...c, currentPassword: val }))} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                    </label>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t("profile.newPassword")}
                      <PasswordInput required minLength={8} value={passwordData.newPassword} onChange={(val) => setPasswordData((c) => ({ ...c, newPassword: val }))} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                    </label>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      {t("profile.confirmNewPassword")}
                      <PasswordInput required minLength={8} value={passwordData.confirmPassword} onChange={(val) => setPasswordData((c) => ({ ...c, confirmPassword: val }))} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                    </label>
                    {passwordError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300">{passwordError}</p>}
                    <div className="flex gap-3">
                      <button type="submit" disabled={passwordSaving} className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
                        {passwordSaving ? t("profile.saving") : t("profile.validate")}
                      </button>
                      <button type="button" onClick={() => setPasswordMode(null)} className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
                        {t("profile.cancel")}
                      </button>
                    </div>
                  </form>
                )}

                {/* ── Mode Réinitialiser le mot de passe ── */}
                {passwordMode === "reset" && (
                  <div className="mt-4 space-y-4">
                    {resetStep === "method" && (
                      <div className="space-y-4">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{t("profile.resetPasswordTitle")}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t("profile.chooseResetMethod")}</p>
                        <div className="flex flex-col gap-3">
                          <button type="button" onClick={() => { setResetMethod("sms"); setResetStep("email"); }} className="flex items-center gap-3 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                            <span className="text-xl">📱</span>
                            <div className="text-left"><p className="font-bold">SMS</p><p className="text-xs text-slate-500 dark:text-slate-400">{user.phone}</p></div>
                          </button>
                          {user.email && (
                            <button type="button" onClick={() => { setResetMethod("email"); setResetStep("email"); }} className="flex items-center gap-3 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                              <span className="text-xl">📧</span>
                              <div className="text-left"><p className="font-bold">Email</p><p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p></div>
                            </button>
                          )}
                        </div>
                        <button type="button" onClick={() => setPasswordMode(null)} className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
                          {t("profile.cancel")}
                        </button>
                      </div>
                    )}

                    {resetStep === "email" && (
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        setPasswordError("");
                        setPasswordSaving(true);
                        try {
                          await apiFetch("/api/auth/forgot-password", {
                            method: "POST",
                            body: JSON.stringify({ phone: user.phone, method: resetMethod }),
                          });
                          showToast(t("profile.resetCodeSent"));
                          setResetStep("code");
                        } catch (err) {
                          setPasswordError(err instanceof Error ? err.message : t("profile.resetCodeError"));
                        } finally {
                          setPasswordSaving(false);
                        }
                      }} className="space-y-4">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{t("profile.resetPasswordTitle")}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t("profile.resetPasswordDesc")}</p>
                        <div className="flex gap-3">
                          <button type="submit" disabled={passwordSaving} className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
                            {passwordSaving ? t("profile.sending") : t("profile.sendCode")}
                          </button>
                          <button type="button" onClick={() => setResetStep("method")} className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
                            {t("profile.cancel")}
                          </button>
                        </div>
                      </form>
                    )}

                    {resetStep === "code" && (
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        setPasswordError("");
                        try {
                          await apiFetch("/api/auth/verify-reset-code", {
                            method: "POST",
                            body: JSON.stringify({ phone: user.phone, code: passwordData.resetCode }),
                          });
                          setResetStep("new");
                        } catch (err) {
                          setPasswordError(err instanceof Error ? err.message : t("profile.invalidCode"));
                        }
                      }} className="space-y-4">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{t("profile.enterResetCode")}</p>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                          {t("profile.resetCode")}
                          <input type="text" required value={passwordData.resetCode} onChange={(e) => setPasswordData((c) => ({ ...c, resetCode: e.target.value }))} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" placeholder="123456" />
                        </label>
                        {passwordError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300">{passwordError}</p>}
                        <div className="flex gap-3">
                          <button type="submit" className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700">
                            {t("profile.validate")}
                          </button>
                          <button type="button" onClick={() => setPasswordMode(null)} className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
                            {t("profile.cancel")}
                          </button>
                        </div>
                      </form>
                    )}

                    {resetStep === "new" && (
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        setPasswordError("");
                        if (passwordData.newPassword !== passwordData.confirmPassword) {
                          setPasswordError(t("auth.register.errors.passwordsDontMatch"));
                          return;
                        }
                        if (passwordData.newPassword.length < 8) {
                          setPasswordError(t("auth.register.errors.passwordTooShort"));
                          return;
                        }
                        setPasswordSaving(true);
                        try {
                          await apiFetch("/api/auth/reset-password", {
                            method: "POST",
                            body: JSON.stringify({ phone: user.phone, code: passwordData.resetCode, newPassword: passwordData.newPassword }),
                          });
                          showToast(t("profile.passwordResetSuccess"));
                          setPasswordMode(null);
                          setResetStep("email");
                        } catch (err) {
                          setPasswordError(err instanceof Error ? err.message : t("profile.passwordResetError"));
                        } finally {
                          setPasswordSaving(false);
                        }
                      }} className="space-y-4">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{t("profile.setNewPassword")}</p>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                          {t("profile.newPassword")}
                          <PasswordInput required minLength={8} value={passwordData.newPassword} onChange={(val) => setPasswordData((c) => ({ ...c, newPassword: val }))} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                        </label>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                          {t("profile.confirmNewPassword")}
                          <PasswordInput required minLength={8} value={passwordData.confirmPassword} onChange={(val) => setPasswordData((c) => ({ ...c, confirmPassword: val }))} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                        </label>
                        {passwordError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300">{passwordError}</p>}
                        <div className="flex gap-3">
                          <button type="submit" disabled={passwordSaving} className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
                            {passwordSaving ? t("profile.saving") : t("profile.validate")}
                          </button>
                          <button type="button" onClick={() => { setPasswordMode(null); setResetStep("method"); }} className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
                            {t("profile.cancel")}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
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
        </div>
      </div>

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
