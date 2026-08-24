import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PasswordInput } from "../PasswordInput";
import { useToast } from "../../contexts/ToastContext";
import { apiFetch } from "../../lib/api";

type PasswordData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  resetCode: string;
};

type PasswordMode = null | "change" | "reset";
type ResetStep = "method" | "email" | "code" | "new";
type ResetMethod = "sms" | "email";

export function PasswordManager({
  userPhone,
  userEmail,
}: {
  userPhone: string;
  userEmail: string | null;
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [passwordMode, setPasswordMode] = useState<PasswordMode>(null);
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    resetCode: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Reset flow
  const [resetStep, setResetStep] = useState<ResetStep>("method");
  const [resetMethod, setResetMethod] = useState<ResetMethod>("sms");

  const resetForm = () => {
    setPasswordError("");
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "", resetCode: "" });
  };

  const openChangeMode = () => {
    resetForm();
    setPasswordMode("change");
  };

  const openResetMode = () => {
    resetForm();
    setResetStep("method");
    setPasswordMode("reset");
  };

  const closePassword = () => {
    setPasswordMode(null);
    setResetStep("method");
    resetForm();
  };

  // ── Change password handler ──
  const handleChangePassword = async (e: React.FormEvent) => {
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
  };

  // ── Send reset code handler ──
  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSaving(true);
    try {
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ phone: userPhone, method: resetMethod }),
      });
      showToast(t("profile.resetCodeSent"));
      setResetStep("code");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : t("profile.resetCodeError"));
    } finally {
      setPasswordSaving(false);
    }
  };

  // ── Verify reset code handler ──
  const handleVerifyResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    try {
      await apiFetch("/api/auth/verify-reset-code", {
        method: "POST",
        body: JSON.stringify({ phone: userPhone, code: passwordData.resetCode }),
      });
      setResetStep("new");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : t("profile.invalidCode"));
    }
  };

  // ── Set new password handler ──
  const handleSetNewPassword = async (e: React.FormEvent) => {
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
        body: JSON.stringify({ phone: userPhone, code: passwordData.resetCode, newPassword: passwordData.newPassword }),
      });
      showToast(t("profile.passwordResetSuccess"));
      setPasswordMode(null);
      setResetStep("method");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : t("profile.passwordResetError"));
    } finally {
      setPasswordSaving(false);
    }
  };

  const inputClass = "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">🔒 {t("profile.passwordManagement")}</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("profile.passwordManagementDesc")}</p>

      {/* ── Choice buttons ── */}
      {!passwordMode && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button onClick={openChangeMode} className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700">
            {t("profile.changePassword")}
          </button>
          <button onClick={openResetMode} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            {t("profile.forgotPassword")}
          </button>
        </div>
      )}

      {/* ── Mode: Modifier le mot de passe ── */}
      {passwordMode === "change" && (
        <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{t("profile.changePasswordTitle")}</p>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("profile.currentPassword")}
            <PasswordInput required value={passwordData.currentPassword} onChange={(val) => setPasswordData((c) => ({ ...c, currentPassword: val }))} className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("profile.newPassword")}
            <PasswordInput required minLength={8} value={passwordData.newPassword} onChange={(val) => setPasswordData((c) => ({ ...c, newPassword: val }))} className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("profile.confirmNewPassword")}
            <PasswordInput required minLength={8} value={passwordData.confirmPassword} onChange={(val) => setPasswordData((c) => ({ ...c, confirmPassword: val }))} className={inputClass} />
          </label>
          {passwordError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300">{passwordError}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={passwordSaving} className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
              {passwordSaving ? t("profile.saving") : t("profile.validate")}
            </button>
            <button type="button" onClick={closePassword} className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
              {t("profile.cancel")}
            </button>
          </div>
        </form>
      )}

      {/* ── Mode: Réinitialiser le mot de passe ── */}
      {passwordMode === "reset" && (
        <div className="mt-4 space-y-4">
          {/* Étape 1: Choisir la méthode */}
          {resetStep === "method" && (
            <div className="space-y-4">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{t("profile.resetPasswordTitle")}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("profile.chooseResetMethod")}</p>
              <div className="flex flex-col gap-3">
                <button type="button" onClick={() => { setResetMethod("sms"); setResetStep("email"); }} className="flex items-center gap-3 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                  <span className="text-xl">📱</span>
                  <div className="text-left"><p className="font-bold">SMS</p><p className="text-xs text-slate-500 dark:text-slate-400">{userPhone}</p></div>
                </button>
                {userEmail && (
                  <button type="button" onClick={() => { setResetMethod("email"); setResetStep("email"); }} className="flex items-center gap-3 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                    <span className="text-xl">📧</span>
                    <div className="text-left"><p className="font-bold">Email</p><p className="text-xs text-slate-500 dark:text-slate-400">{userEmail}</p></div>
                  </button>
                )}
              </div>
              <button type="button" onClick={closePassword} className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
                {t("profile.cancel")}
              </button>
            </div>
          )}

          {/* Étape 2: Envoyer le code */}
          {resetStep === "email" && (
            <form onSubmit={handleSendResetCode} className="space-y-4">
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

          {/* Étape 3: Vérifier le code */}
          {resetStep === "code" && (
            <form onSubmit={handleVerifyResetCode} className="space-y-4">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{t("profile.enterResetCode")}</p>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("profile.resetCode")}
                <input type="text" required value={passwordData.resetCode} onChange={(e) => setPasswordData((c) => ({ ...c, resetCode: e.target.value }))} className={inputClass} placeholder="123456" />
              </label>
              {passwordError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300">{passwordError}</p>}
              <div className="flex gap-3">
                <button type="submit" className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700">
                  {t("profile.validate")}
                </button>
                <button type="button" onClick={closePassword} className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
                  {t("profile.cancel")}
                </button>
              </div>
            </form>
          )}

          {/* Étape 4: Nouveau mot de passe */}
          {resetStep === "new" && (
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{t("profile.setNewPassword")}</p>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("profile.newPassword")}
                <PasswordInput required minLength={8} value={passwordData.newPassword} onChange={(val) => setPasswordData((c) => ({ ...c, newPassword: val }))} className={inputClass} />
              </label>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("profile.confirmNewPassword")}
                <PasswordInput required minLength={8} value={passwordData.confirmPassword} onChange={(val) => setPasswordData((c) => ({ ...c, confirmPassword: val }))} className={inputClass} />
              </label>
              {passwordError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300">{passwordError}</p>}
              <div className="flex gap-3">
                <button type="submit" disabled={passwordSaving} className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
                  {passwordSaving ? t("profile.saving") : t("profile.validate")}
                </button>
                <button type="button" onClick={closePassword} className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
                  {t("profile.cancel")}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
