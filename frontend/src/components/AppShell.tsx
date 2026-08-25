/**
 * AppShell — Layout principal avec :
 * - NAVBAR (haut) : Véhicules, Mes réservations, Messages
 * - SIDEBAR (gauche) :
 *   - Desktop : fixe, toujours visible (largeur 256px)
 *   - Mobile : toggleable via hamburger, overlay
 *
 * Sidebar contient : Favoris, Fidélité, Profil, Paramètres,
 *   Statistiques, Paiements, Aide, Déconnexion
 */

import { Link, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    setMobileSidebarOpen(false);
    showToast(t("logout.success"));
  };

  // Fermer la sidebar mobile sur navigation
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  // Fermer la sidebar mobile si on clique à l'extérieur
  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setMobileSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileSidebarOpen]);

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

  const isActive = (path: string) => location.pathname === path;

  // ── Liens de la NAVBAR (haut) ──
  const navBarLinks = (
    <>
      <Link
        to="/vehicules"
        className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
          isActive("/vehicules")
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
            : "text-slate-600 hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
        }`}
      >
        {t("nav.vehicles")}
      </Link>
      {user && (
        <Link
          to="/reservations"
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
            isActive("/reservations")
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
              : "text-slate-600 hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
          }`}
        >
          {t("nav.myBookings")}
        </Link>
      )}
      {user && (
        <Link
          to="/messages"
          className={`relative rounded-lg px-3 py-2 text-sm font-semibold transition ${
            isActive("/messages")
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
              : "text-slate-600 hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
          }`}
        >
          {t("nav.messages")}
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>
      )}
    </>
  );

  // ── Liens de la SIDEBAR ──
  const sidebarLinks = user
    ? [
        { to: "/favoris", label: t("nav.favorites"), icon: "❤️" },
        { to: "/fidelite", label: t("nav.loyalty", { defaultValue: "Fidélité" }), icon: "⭐" },
        { to: "/profil", label: t("nav.profile", { defaultValue: "Profil" }), icon: "👤" },
        { to: "/parametres", label: t("nav.settings", { defaultValue: "Paramètres" }), icon: "⚙️" },
        { to: "/statistiques", label: t("nav.stats", { defaultValue: "Statistiques" }), icon: "📊" },
        { to: "/paiements", label: t("nav.payments", { defaultValue: "Paiements" }), icon: "💰" },
        { to: "/aide", label: t("nav.help", { defaultValue: "Aide" }), icon: "❓" },
      ]
    : [];

  // ── Contenu de la sidebar (réutilisable desktop + mobile) ──
  const sidebarContent = (
    <>
      {/* En-tête sidebar — profil */}
      {user && (
        <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{roleLabel(user.role)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Liens */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                isActive(link.to)
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Déconnexion */}
      <div className="border-t border-slate-200 px-3 py-3 dark:border-slate-800">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-rose-50 hover:text-rose-700 dark:text-slate-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
        >
          <span className="text-base">🚪</span>
          {t("nav.logout")}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {/* ═══ NAVBAR ═══ */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-6 sm:py-3">
          {/* Logo + bouton hamburger (mobile uniquement) */}
          <div className="flex items-center gap-2">
            {user && (
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                className="rounded-lg border border-slate-300 p-2 transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 lg:hidden"
                aria-label={mobileSidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 dark:text-slate-300">
                  {mobileSidebarOpen ? (
                    <>
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </>
                  ) : (
                    <>
                      <line x1="4" x2="20" y1="12" y2="12" />
                      <line x1="4" x2="20" y1="6" y2="6" />
                      <line x1="4" x2="20" y1="18" y2="18" />
                    </>
                  )}
                </svg>
              </button>
            )}
            <Link to="/" className="text-lg font-black tracking-tight text-slate-950 dark:text-white sm:text-xl">
              Car<span className="text-emerald-600">Guinée</span>
            </Link>
          </div>

          {/* Navigation navbar — desktop */}
          <nav className="hidden items-center gap-1 md:flex">
            {navBarLinks}
          </nav>

          {/* Contrôles droite */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <LanguageSwitcher />
            <ThemeToggle />

            {user ? (
              <>
                <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 lg:inline-block dark:bg-emerald-500/15 dark:text-emerald-300">
                  {roleLabel(user.role)}
                </span>
                <Link
                  to="/notifications"
                  className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
                  title={t("nav.notifications")}
                >
                  🔔
                </Link>
              </>
            ) : (
              <Link
                to="/connexion"
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 sm:px-4 sm:py-2 sm:text-sm"
              >
                {t("nav.login")}
              </Link>
            )}
          </div>
        </div>

        {/* Navigation navbar — mobile (scroll horizontal) */}
        <div className="border-t border-slate-100 px-3 py-2 md:hidden dark:border-slate-800">
          <nav className="flex gap-1 overflow-x-auto">
            {navBarLinks}
          </nav>
        </div>
      </header>

      <div className="flex flex-1">
        {/* ═══ SIDEBAR MOBILE (overlay) ═══ */}
        {mobileSidebarOpen && user && (
          <>
            {/* Overlay — mobile uniquement */}
            <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />

            {/* Panneau sidebar mobile */}
            <aside
              ref={sidebarRef}
              className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-slate-200 bg-white pt-16 shadow-xl transition-transform dark:border-slate-800 dark:bg-slate-900 lg:hidden"
            >
              {sidebarContent}
            </aside>
          </>
        )}

        {/* ═══ SIDEBAR DESKTOP (fixe) ═══ */}
        {user && (
          <aside className="hidden w-64 flex-shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex lg:flex-col">
            {sidebarContent}
          </aside>
        )}

        {/* ═══ CONTENU PRINCIPAL ═══ */}
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* ═══ FOOTER ═══ */}
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
