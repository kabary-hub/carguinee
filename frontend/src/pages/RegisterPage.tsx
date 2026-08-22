import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "../components/ThemeToggle";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { PasswordInput } from "../components/PasswordInput";
import { useAuth } from "../contexts/AuthContext";
import { getHomeRouteForRole } from "../lib/roles";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const registeredUser = await register({
        ...form,
        email: form.email || undefined,
      });
      // Tout nouveau compte reçoit le rôle CLIENT : ouverture sur le catalogue.
      navigate(getHomeRouteForRole(registeredUser.role), { replace: true });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : t("auth.register.errors.phoneExists"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 dark:bg-slate-950">
      <div className="mx-auto max-w-lg">
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
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
            {t("common.appName")}
          </p>
          <h1 className="mt-3 text-3xl font-black text-slate-900 dark:text-slate-100">
            {t("auth.register.createAccount")}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
            {t("auth.register.subtitle")}
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("auth.register.firstName")}
                <input
                  required
                  value={form.firstName}
                  onChange={(event) => updateField("firstName", event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("auth.register.lastName")}
                <input
                  required
                  value={form.lastName}
                  onChange={(event) => updateField("lastName", event.target.value)}
                  className={inputClass}
                />
              </label>
            </div>

            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("auth.register.phone")}
              <input
                required
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="+224..."
                className={inputClass}
              />
            </label>

            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("auth.register.emailOptional")}
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className={inputClass}
              />
            </label>

            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("auth.register.password")}
              <PasswordInput
                required
                minLength={8}
                value={form.password}
                onChange={(value) => updateField("password", value)}
                className={inputClass}
              />
              <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">
                {t("auth.register.passwordHelp")}
              </span>
            </label>

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300" role="alert">
                {error}
              </p>
            )}

            <button
              disabled={isSubmitting}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {isSubmitting ? t("common.loading") : t("auth.register.createButton")}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            {t("auth.register.haveAccount")}{" "}
            <Link to="/connexion" className="font-semibold text-emerald-700 dark:text-emerald-400">
              {t("auth.register.loginNow")}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
