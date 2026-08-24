import { useState, useRef, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "../components/ThemeToggle";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { PasswordInput } from "../components/PasswordInput";
import { useAuth } from "../contexts/AuthContext";
import { getHomeRouteForRole, isRouteAllowedForRole } from "../lib/roles";
import { apiFetch, type ApiError } from "../lib/api";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // État pour le cas "compte désactivé"
  const [accountDeactivated, setAccountDeactivated] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestReason, setRequestReason] = useState("");

  // Afficher un message si redirigé après bannissement
  const locationState = location.state as { banned?: boolean } | null;
  const hasCleanedRef = useRef(false);
  if (locationState?.banned && !hasCleanedRef.current) {
    // Nettoyer l'état pour ne pas afficher le message au rechargement
    window.history.replaceState({}, "");
    hasCleanedRef.current = true;
  }
  const bannedError = locationState?.banned ? t("auth.login.accountBanned") : "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setAccountDeactivated(false);
    setRequestSent(false);
    setIsSubmitting(true);

    try {
      const authenticatedUser = await login({ phone, password });
      const from = (location.state as { from?: string } | null)?.from;
      const safeFrom = from && isRouteAllowedForRole(from, authenticatedUser.role) ? from : undefined;
      navigate(safeFrom ?? getHomeRouteForRole(authenticatedUser.role), {
        replace: true,
      });
    } catch (submissionError) {
      const err = submissionError as ApiError;
      if (err.status === 403) {
        // Compte désactivé ou banni
        setAccountDeactivated(true);
        setError("");
      } else {
        setError(submissionError instanceof Error ? submissionError.message : t("auth.login.errors.networkError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Demande de réactivation
  async function handleRequestReactivation() {
    setRequesting(true);
    try {
      await apiFetch("/api/auth/request-reactivation", {
        method: "POST",
        body: JSON.stringify({ phone, reason: requestReason || undefined }),
      });
      setRequestSent(true);
      setAccountDeactivated(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer la demande.");
      setAccountDeactivated(false);
    } finally {
      setRequesting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 dark:bg-slate-950">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {t("common.backToHome")}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">{t("common.appName")}</p>
          <h1 className="mt-3 text-3xl font-black text-slate-900 dark:text-slate-100">{t("auth.login.title")}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
            {t("auth.login.subtitle")}
          </p>

          {/* ── Demande de réactivation envoyée ── */}
          {requestSent && (
            <div className="mt-6 rounded-xl bg-emerald-50 p-5 dark:bg-emerald-500/15">
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                ✅ {t("auth.login.reactivationSuccess")}
              </p>
              <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
                {t("auth.login.reactivationSuccessDesc")}
              </p>
            </div>
          )}

          {/* ── Compte désactivé : demande de réactivation ── */}
          {accountDeactivated && !requestSent && (
            <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-700 dark:bg-amber-500/15">
              <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                ⚠️ {t("auth.login.accountDeactivated")}
              </p>
              <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                {t("auth.login.accountDeactivatedDesc")}
              </p>
              <label className="mt-3 block text-sm font-medium text-amber-700 dark:text-amber-300">
                {t("auth.login.reactivationReason")}
                <textarea
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  rows={2}
                  placeholder={t("auth.login.reactivationReasonPlaceholder")}
                  className="mt-1 w-full rounded-lg border border-amber-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-amber-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </label>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleRequestReactivation}
                  disabled={requesting}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {requesting ? t("common.loading") : t("auth.login.requestReactivation")}
                </button>
                <button
                  type="button"
                  onClick={() => { setAccountDeactivated(false); setRequestReason(""); }}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  {t("profile.cancel")}
                </button>
              </div>
            </div>
          )}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("auth.login.phone")}
              <input
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+224..."
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:ring-emerald-900/50"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("auth.login.password")}
              <PasswordInput
                required
                value={password}
                onChange={setPassword}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:ring-emerald-900/50"
              />
            </label>

            {(error || bannedError) && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300" role="alert">
                {error || bannedError}
              </p>
            )}

            <button
              disabled={isSubmitting}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? t("common.loading") : t("auth.login.loginButton")}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            {t("auth.login.noAccount")}{" "}
            <Link to="/inscription" className="font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300">
              {t("auth.login.registerNow")}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
