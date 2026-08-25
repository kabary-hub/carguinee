import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "./components/ProtectedRoute";

// ── Lazy-loaded pages ───────────────────────────────────────────────────────
const HomePage = lazy(() => import("./pages/HomePage").then((m) => ({ default: m.HomePage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("./pages/RegisterPage").then((m) => ({ default: m.RegisterPage })));
const AccessDeniedPage = lazy(() => import("./pages/AccessDeniedPage").then((m) => ({ default: m.AccessDeniedPage })));
const VehiclesPage = lazy(() => import("./pages/client/VehiclesPage").then((m) => ({ default: m.VehiclesPage })));
const VehicleDetailPage = lazy(() => import("./pages/client/VehicleDetailPage").then((m) => ({ default: m.VehicleDetailPage })));
const ProfilePage = lazy(() => import("./pages/client/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const MyBookingsPage = lazy(() => import("./pages/client/MyBookingsPage").then((m) => ({ default: m.MyBookingsPage })));
const OwnerDashboardPage = lazy(() => import("./pages/owner/OwnerDashboardPage").then((m) => ({ default: m.OwnerDashboardPage })));
const AddVehiclePage = lazy(() => import("./pages/owner/AddVehiclePage").then((m) => ({ default: m.AddVehiclePage })));
const OwnerBoostPage = lazy(() => import("./pages/owner/OwnerBoostPage").then((m) => ({ default: m.OwnerBoostPage })));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage").then((m) => ({ default: m.AdminDashboardPage })));
const AdminChatsPage = lazy(() => import("./pages/admin/AdminChatsPage").then((m) => ({ default: m.AdminChatsPage })));
const AdminFavoritesPage = lazy(() => import("./pages/admin/AdminFavoritesPage").then((m) => ({ default: m.AdminFavoritesPage })));
const AdminReviewsPage = lazy(() => import("./pages/admin/AdminReviewsPage").then((m) => ({ default: m.AdminReviewsPage })));
const AdminModerationPage = lazy(() => import("./pages/admin/AdminModerationPage").then((m) => ({ default: m.AdminModerationPage })));
const FavoritesPage = lazy(() => import("./pages/client/FavoritesPage").then((m) => ({ default: m.FavoritesPage })));
const NotificationsPage = lazy(() => import("./pages/client/NotificationsPage").then((m) => ({ default: m.NotificationsPage })));
const MessagesPage = lazy(() => import("./pages/client/MessagesPage").then((m) => ({ default: m.MessagesPage })));
const ConditionsGeneralesPage = lazy(() => import("./pages/legal/ConditionsGeneralesPage").then((m) => ({ default: m.ConditionsGeneralesPage })));
const MentionsLegalesPage = lazy(() => import("./pages/legal/MentionsLegalesPage").then((m) => ({ default: m.MentionsLegalesPage })));
const PolitiqueConfidentialitePage = lazy(() => import("./pages/legal/PolitiqueConfidentialitePage").then((m) => ({ default: m.PolitiqueConfidentialitePage })));
const RegistreTraitementsPage = lazy(() => import("./pages/legal/RegistreTraitementsPage").then((m) => ({ default: m.RegistreTraitementsPage })));
const ReferralPage = lazy(() => import("./pages/client/ReferralPage").then((m) => ({ default: m.ReferralPage })));
const LoyaltyPage = lazy(() => import("./pages/client/LoyaltyPage").then((m) => ({ default: m.LoyaltyPage })));
const SettingsPage = lazy(() => import("./pages/client/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const StatsPage = lazy(() => import("./pages/client/StatsPage").then((m) => ({ default: m.StatsPage })));
const PaymentsPage = lazy(() => import("./pages/client/PaymentsPage").then((m) => ({ default: m.PaymentsPage })));
const HelpPage = lazy(() => import("./pages/client/HelpPage").then((m) => ({ default: m.HelpPage })));

// ── Fallback de chargement ──────────────────────────────────────────────────
function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-emerald-600" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Chargement…</p>
      </div>
    </div>
  );
}

// ── Routes ──────────────────────────────────────────────────────────────────
function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/connexion" element={<LoginPage />} />
        <Route path="/inscription" element={<RegisterPage />} />
        <Route path="/acces-refuse" element={<AccessDeniedPage />} />
        <Route path="/vehicules" element={<VehiclesPage />} />
        <Route path="/vehicules/:id" element={<VehicleDetailPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/profil" element={<ProfilePage />} />
          <Route path="/reservations" element={<MyBookingsPage />} />
          <Route path="/parametres" element={<SettingsPage />} />
          <Route path="/statistiques" element={<StatsPage />} />
          <Route path="/paiements" element={<PaymentsPage />} />
          <Route path="/aide" element={<HelpPage />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["PROPRIETAIRE", "ADMIN"]} />}>
          <Route path="/proprietaire" element={<OwnerDashboardPage />} />
          <Route path="/proprietaire/ajouter" element={<AddVehiclePage />} />
          <Route path="/proprietaire/boost" element={<OwnerBoostPage />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route path="/administration" element={<AdminDashboardPage />} />
          <Route path="/administration/chats" element={<AdminChatsPage />} />
          <Route path="/administration/favoris" element={<AdminFavoritesPage />} />
          <Route path="/administration/avis" element={<AdminReviewsPage />} />
          <Route path="/administration/moderation" element={<AdminModerationPage />} />
        </Route>
        {/* ── Pages V2 : Favoris, Notifications, Messages ── */}
        <Route element={<ProtectedRoute />}>
          <Route path="/favoris" element={<FavoritesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:conversationId" element={<MessagesPage />} />
          <Route path="/parrainage" element={<ReferralPage />} />
          <Route path="/fidelite" element={<LoyaltyPage />} />
        </Route>
        {/* ── Pages légales ── */}
        <Route path="/conditions-generales" element={<ConditionsGeneralesPage />} />
        <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
        <Route path="/politique-confidentialite" element={<PolitiqueConfidentialitePage />} />
        <Route path="/registre-traitements" element={<RegistreTraitementsPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
