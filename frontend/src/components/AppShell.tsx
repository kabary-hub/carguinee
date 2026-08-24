import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { roleLabel } from "../lib/roles";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ConfirmDialog } from "./ConfirmDialog";
import { useState, useEffect, useRef } from "react";
import { apiFetch } from "../lib/api";
import type { ApiResponse } from "../lib/domain";
import { ChatbotWidget } from "./chatbot/ChatbotWidget";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    setMobileMenuOpen(false);
    showToast(t("logout.success"));
  };

  // Fermer le menu mobile si on redimensionne vers desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fermer le menu mobile si on clique à l'extérieur
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  // ── Badge messages non lus ──
  const [unreadCount, setUnreadCount] = useState(0);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    const fetchUnread = () => {
      apiFetch<ApiResponse<{ count: number }>>("/api/messages/unread-count")
        .then((res) => setUnreadCount(res.data.count))
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15_000);
    return () => clearInterval(interval);
  }, [userId]);

  // Fermer le menu mobile lors de la navigation
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const navLinks = (
    <>
      <Link
        to="/vehicules"
        onClick={closeMobileMenu}
        className="rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
      >
        {t("nav.vehicles")}
      </Link>
      {user && (
        <>
          <Link
            to="/reservations"
            onClick={closeMobileMenu}
            className="rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
          >
            {t("nav.myBookings")}
          </Link>
          <Link
            to="/favoris"
            onClick={closeMobileMenu}
            className="rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
          >
            ❤️ {t("nav.favorites")}
          </Link>
          <Link
            to="/messages"
            onClick={closeMobileMenu}
            className="relative rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
          >
            💬 {t("nav.messages")}
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        </>
      )}
      {user?.role === "PROPRIETAIRE" && (
        <Link
          to="/proprietaire"
          onClick={closeMobileMenu}
          className="rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
        >
          {t("nav.ownerSpace")}
        </Link>
      )}
      {user?.role === "ADMIN" && (
        <Link
          to="/administration"
          onClick={closeMobileMenu}
          className="rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
        >
          {t("nav.administration")}
        </Link>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-6 sm:py-3">
          {/* Logo */}
          <Link to="/" className="text-lg font-black tracking-tight text-slate-950 dark:text-white sm:text-xl">
            Car<span className="text-emerald-600">Guinée</span>
          </Link>

          {/* Navigation desktop — cachée sur mobile */}
          <nav className="hidden items-center gap-1 text-sm font-semibold md:flex">
            {navLinks}
          </nav>

          {/* Contrôles à droite */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <LanguageSwitcher />
            <ThemeToggle />

            {user ? (
              <>
                {/* Badge rôle — caché sur très petit écran */}
                <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 lg:inline-block dark:bg-emerald-500/15 dark:text-emerald-300">
                  {roleLabel(user.role)}
                </span>

                {/* Notifications — toujours visible */}
                <Link
                  to="/notifications"
                  onClick={closeMobileMenu}
                  className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
                  title={t("nav.notifications")}
                >
                  🔔
                </Link>

                {/* Nom — caché sur mobile */}
                <Link
                  to="/profil"
                  className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:block dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {user.firstName}
                </Link>

                {/* Déconnexion — largeur fixe pour éviter les décalages au changement de langue */}
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="min-w-[44px] rounded-lg border border-red-300 px-2 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50 hover:text-red-700 sm:px-3 sm:min-w-[90px] sm:text-sm dark:border-red-800 dark:text-red-400 dark:hover:bg-red-500/15 dark:hover:text-red-300"
                  title={t("nav.logout")}
                >
                  <span className="hidden truncate sm:inline">{t("nav.logout")}</span>
                  <span className="sm:hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </span>
                </button>
              </>
            ) : (
              <Link
                to="/connexion"
                onClick={closeMobileMenu}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 sm:px-4 sm:py-2 sm:text-sm"
              >
                {t("nav.login")}
              </Link>
            )}

            {/* Bouton hamburger — visible uniquement sur mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="rounded-lg border border-slate-300 p-2 transition hover:bg-slate-100 md:hidden dark:border-slate-700 dark:hover:bg-slate-800"
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                /* Icône fermer (X) */
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 dark:text-slate-300">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              ) : (
                /* Icône hamburger (3 barres) */
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 dark:text-slate-300">
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Menu mobile déroulant */}
        {mobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="border-t border-slate-200 bg-white px-4 py-3 shadow-lg md:hidden dark:border-slate-800 dark:bg-slate-900"
          >
            <nav className="flex flex-col gap-1 text-sm font-semibold">
              {navLinks}
            </nav>

            {/* Profil + déconnexion dans le menu mobile */}
            {user && (
              <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                <Link
                  to="/profil"
                  onClick={closeMobileMenu}
                  className="flex-1 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  👤 {user.firstName} ({roleLabel(user.role)})
                </Link>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-500/15"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  {t("nav.logout")}
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-white px-4 py-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <Link to="/conditions-generales" className="hover:text-emerald-600 dark:hover:text-emerald-400">CGU</Link>
            <Link to="/mentions-legales" className="hover:text-emerald-600 dark:hover:text-emerald-400">Mentions légales</Link>
            <Link to="/politique-confidentialite" className="hover:text-emerald-600 dark:hover:text-emerald-400">Politique de confidentialité</Link>
            <Link to="/registre-traitements" className="hover:text-emerald-600 dark:hover:text-emerald-400">Registre des traitements</Link>
          </div>
          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            {t("home.footer")}
          </p>
        </div>
      </footer>

      <ConfirmDialog
        open={showLogoutConfirm}
        title={t("logout.title")}
        message={t("logout.message")}
        confirmLabel={t("logout.confirmLabel")}
        tone="rose"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      <ChatbotWidget />
    </div>
  );
}
