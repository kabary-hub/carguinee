/**
 * AppShell — Layout principal avec :
 * - NAVBAR (haut) : Logo, Véhicules, Mes réservations, Messages, Profil, Notifications
 * - SIDEBAR (gauche) :
 *   - Desktop : fixe à gauche (pas de scroll, déconnexion toujours visible)
 *   - Mobile : toggleable via hamburger, overlay
 * - Toggle sidebar : bouton chevron pour ouvrir/fermer à tout moment
 *
 * Sidebar contient : Favoris, Fidélité, Statistiques, Paiements, Aide,
 * Paramètres (avant déconnexion)
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
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    setMobileSidebarOpen(false);
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

  // ── Liens de la NAVBAR (haut) — version desktop ──
  const navBarLinksDesktop = (
    <>
      <Link
        to="/vehicules"
        className={`rounded-lg px-2 py-1.5 text-[13px] font-semibold transition sm:px-3 sm:text-sm ${
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
          className={`rounded-lg px-2 py-1.5 text-[13px] font-semibold transition sm:px-3 sm:text-sm ${
            isActive("/reservations")
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
              : "text-slate-600 hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
          }`}
        >
          {t("nav.myBookings")}
        </Link>
      )}
    </>
  );

  // ── Liens de la NAVBAR (mobile) — 2 colonnes compactes ──
  const navBarLinksMobile = (
    <>
      <Link
        to="/vehicules"
        className={`flex-1 min-w-0 text-center rounded-lg px-2 py-2 text-xs font-bold truncate ${
          isActive("/vehicules")
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
            : "text-slate-600 hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
        }`}
      >
        {t("nav.vehicles")}
      </Link>
      <Link
        to="/reservations"
        className={`flex-1 min-w-0 text-center rounded-lg px-2 py-2 text-xs font-bold truncate ${
          isActive("/reservations")
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
            : "text-slate-600 hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
        }`}
      >
        {t("nav.myBookings")}
      </Link>
      <Link
        to="/messages"
        className={`relative flex-none rounded-lg px-2 py-2 text-xs font-bold ${
          isActive("/messages")
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
            : "text-slate-600 hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
        }`}
      >
        ✉
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 right-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>
    </>
  );

  // ── Liens de la SIDEBAR ──
  const sidebarLinks = user
    ? [
        { to: "/favoris", label: t("nav.favorites"), icon: "❤️" },
        { to: "/fidelite", label: t("nav.loyalty", { defaultValue: "Fidélité" }), icon: "⭐" },
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
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{roleLabel(user.role)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Liens principaux */}
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

      {/* Paramètres + Déconnexion — toujours visibles en bas, pas de scroll */}
      <div className="mt-auto shrink-0 border-t border-slate-200 px-3 py-3 dark:border-slate-800">
        <Link
          to="/parametres"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
            isActive("/parametres")
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <span className="text-base">⚙️</span>
          {t("nav.settings", { defaultValue: "Paramètres" })}
        </Link>
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
        {/* Ligne principale : Logo + Nav(center) + Controls(right) */}
        <div className="mx-auto flex max-w-7xl items-center justify-between px-2 py-1.5 sm:px-4 sm:py-2 lg:px-6">
          {/* Gauche : Hamburger + Logo */}
          <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
            {user && (
              <button
                type="button"
                onClick={() => {
                  setMobileSidebarOpen(!mobileSidebarOpen);
                  setDesktopSidebarCollapsed(!desktopSidebarCollapsed);
                }}
                className="flex-none rounded-lg p-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800 lg:p-2"
                aria-label={mobileSidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 dark:text-slate-300">
                  {mobileSidebarOpen ? (
                    <>
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
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
            <Link to="/" className="whitespace-nowrap text-base font-black tracking-tight text-slate-950 dark:text-white sm:text-xl">
              <span className="hidden sm:inline">CarGuinée</span>
              <span className="sm:hidden">CG</span>
            </Link>
          </div>

          {/* Centre : Navigation desktop */}
          <nav className="hidden items-center gap-1 md:flex">
            {navBarLinksDesktop}
            {user && (
              <Link
                to="/messages"
                className={`relative rounded-lg px-2 py-1.5 text-[13px] font-semibold transition sm:px-3 sm:text-sm ${
                  isActive("/messages")
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                    : "text-slate-600 hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
                }`}
              >
                {t("nav.messages")}
                {unreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-none text-white z-10 ring-1 ring-white dark:ring-slate-900">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            )}
          </nav>

          {/* Droite : Langue + Thème + Notifications + Profil */}
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
            <div className="hidden sm:block"><LanguageSwitcher /></div>
            <div className="hidden sm:block"><ThemeToggle /></div>

            {user && (
              <>
                <Link
                  to="/notifications"
                  className="relative rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 sm:p-2"
                  title={t("nav.notifications")}
                >
                  🔔
                </Link>
                <Link
                  to="/profil"
                  className={`hidden items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold transition lg:flex ${
                    isActive("/profil")
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                      : "text-slate-600 hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
                  }`}
                >
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </span>
                  <span className="max-w-[100px] truncate text-sm">{user.firstName}</span>
                </Link>
                <span className="hidden rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 lg:inline-block dark:bg-emerald-500/15 dark:text-emerald-300">
                  {roleLabel(user.role)}
                </span>
              </>
            )}

            {!user && (
              <Link
                to="/connexion"
                className="rounded-lg bg-emerald-600 px-2 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 sm:px-3 sm:text-sm"
              >
                {t("nav.login")}
              </Link>
            )}
          </div>
        </div>

        {/* ── Navigation mobile : rangée compacte ── */}
        <div className="flex gap-1 border-t border-slate-100 px-2 py-1.5 sm:hidden dark:border-slate-800">
          {navBarLinksMobile}
        </div>
      </header>

      <div className="flex flex-1">
        {/* ═══ SIDEBAR MOBILE (overlay) ═══ */}
        {mobileSidebarOpen && user && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <aside
              ref={sidebarRef}
              className="fixed left-0 top-0 z-50 flex h-full w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform lg:hidden dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex h-full flex-col">
                {sidebarContent}
              </div>
            </aside>
          </>
        )}

        {/* ═══ SIDEBAR DESKTOP (fixe) ═══ */}
        {user && (
          <aside
            className={`hidden border-r border-slate-200 bg-white transition-[width,border-color] duration-300 dark:border-slate-800 dark:bg-slate-900 lg:flex lg:flex-col lg:fixed lg:top-[52px] lg:bottom-0 lg:left-0 ${
              desktopSidebarCollapsed ? "w-0 overflow-hidden border-0" : "w-56 xl:w-64"
            }`}
          >
            <div className={`${desktopSidebarCollapsed ? "hidden" : "flex"} h-full flex-col`}>
              {sidebarContent}
            </div>
          </aside>
        )}

        {/* ═══ CONTENU PRINCIPAL ═══ */}
        <main className={`min-w-0 flex-1 ${user && !desktopSidebarCollapsed ? 'lg:ml-56 xl:ml-64' : ''}`}>          {children}
        </main>
      </div>

      {/* ═══ FOOTER ═══ */}
      <footer className="mt-auto border-t border-slate-200 bg-white px-4 py-6 sm:py-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-4xl px-2">
          <div className="flex flex-wrap items-center justify-center gap-2 gap-y-1 text-[11px] text-slate-500 sm:gap-4 sm:text-xs dark:text-slate-400">
            <a href="/conditions-generales" className="whitespace-nowrap hover:text-emerald-600 dark:hover:text-emerald-400">CGU</a>
            <a href="/mentions-legales" className="whitespace-nowrap hover:text-emerald-600 dark:hover:text-emerald-400">Mentions légales</a>
            <a href="/politique-confidentialite" className="whitespace-nowrap hover:text-emerald-600 dark:hover:text-emerald-400">Confidentialité</a>
            <a href="/registre-traitements" className="whitespace-nowrap hover:text-emerald-600 dark:hover:text-emerald-400">Registre</a>
          </div>
          <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
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
