/**
 * Utilitaires d'impression pour l'interface admin.
 * Génère une page HTML dans une nouvelle fenêtre, puis déclenche l'impression.
 */

function buildPrintPage(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1e293b; padding: 20px; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    .subtitle { font-size: 11px; color: #64748b; margin-bottom: 16px; }
    .logo { font-size: 22px; font-weight: 900; margin-bottom: 8px; }
    .logo span { color: #059669; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; font-size: 11px; }
    th { background: #f1f5f9; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; }
    .badge-green { background: #d1fae5; color: #065f46; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .badge-amber { background: #fef3c7; color: #92400e; }
    .badge-slate { background: #f1f5f9; color: #475569; }
    .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    .card-title { font-size: 14px; font-weight: 900; margin-bottom: 8px; }
    .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; }
    .row .label { color: #64748b; }
    .row .value { font-weight: 600; }
    .footer { margin-top: 20px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="logo">Car<span>Guinée</span></div>
  ${bodyHtml}
  <div class="footer">
    Imprimé le ${new Date().toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })} — CarGuinée Admin
  </div>
</body>
</html>`;
}

/** Ouvre une fenêtre d'impression avec le contenu généré */
function openPrintWindow(title: string, bodyHtml: string) {
  const html = buildPrintPage(title, bodyHtml);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank", "width=900,height=700");
  if (!win) {
    URL.revokeObjectURL(url);
    return;
  }
  win.onload = () => {
    win.print();
    URL.revokeObjectURL(url);
  };
}

// ── Badge helpers ────────────────────────────────────────────────────────────
const BADGE_MAP: Record<string, string> = {
  ACTIVE: "badge-green", INACTIVE: "badge-red",
  CLIENT: "badge-slate", PROPRIETAIRE: "badge-green", ADMIN: "badge-amber",
  EN_ATTENTE: "badge-amber", CONFIRMEE: "badge-green", EN_COURS: "badge-green",
  TERMINEE: "badge-slate", ANNULEE: "badge-red", REJETEE: "badge-red",
  PUBLIEE: "badge-green", BROUILLON: "badge-slate", EN_ATTENTE_VALIDATION: "badge-amber",
  REJETEE_VEHICLE: "badge-red", ARCHIVEE: "badge-slate",
};

function badge(text: string, variant?: string) {
  const cls = variant ?? BADGE_MAP[text] ?? "badge-slate";
  return `<span class="badge ${cls}">${text}</span>`;
}

// ═════════════════════════════════════════════════════════════════════════════
//  UTILISATEURS
// ═════════════════════════════════════════════════════════════════════════════

type PrintUser = {
  id: string; phone: string; email: string | null; firstName: string; lastName: string;
  role: string; isActive: boolean; createdAt: string;
  _count: { vehicles: number; rentalBookings: number };
};

/** Imprimer la fiche détaillée d'un utilisateur */
export function printUserCard(user: PrintUser) {
  const ROLE_LABELS: Record<string, string> = { CLIENT: "Client", PROPRIETAIRE: "Propriétaire", ADMIN: "Administrateur" };
  const body = `
    <h1>Fiche Utilisateur</h1>
    <div class="subtitle">CarGuinée — Administration</div>
    <div class="card">
      <div class="card-title">${user.firstName} ${user.lastName}</div>
      <div class="row"><span class="label">Téléphone</span><span class="value">${user.phone}</span></div>
      <div class="row"><span class="label">Email</span><span class="value">${user.email || "—"}</span></div>
      <div class="row"><span class="label">Rôle</span><span class="value">${badge(ROLE_LABELS[user.role] ?? user.role, BADGE_MAP[user.role])}</span></div>
      <div class="row"><span class="label">Statut</span><span class="value">${user.isActive ? badge("Actif", "badge-green") : badge("Inactif", "badge-red")}</span></div>
      <div class="row"><span class="label">Inscrit le</span><span class="value">${new Date(user.createdAt).toLocaleDateString("fr-FR", { dateStyle: "long" })}</span></div>
      <div class="row"><span class="label">Véhicules</span><span class="value">${user._count.vehicles}</span></div>
      <div class="row"><span class="label">Réservations</span><span class="value">${user._count.rentalBookings}</span></div>
    </div>
  `;
  openPrintWindow(`Fiche ${user.firstName} ${user.lastName}`, body);
}

/** Imprimer la liste des utilisateurs actuellement affichés */
export function printUserList(users: PrintUser[], filterLabel: string) {
  const ROLE_LABELS: Record<string, string> = { CLIENT: "Client", PROPRIETAIRE: "Propriétaire", ADMIN: "Administrateur" };
  const rows = users.map((u) => `
    <tr>
      <td>${u.firstName} ${u.lastName}</td>
      <td>${u.phone}</td>
      <td>${u.email || "—"}</td>
      <td>${ROLE_LABELS[u.role] ?? u.role}</td>
      <td>${u.isActive ? "Actif" : "Inactif"}</td>
      <td>${u._count.vehicles}</td>
      <td>${u._count.rentalBookings}</td>
    </tr>
  `).join("");

  const body = `
    <h1>Liste des Utilisateurs</h1>
    <div class="subtitle">Filtre : ${filterLabel || "Tous"} — ${users.length} utilisateur(s)</div>
    <table>
      <thead>
        <tr>
          <th>Nom</th><th>Téléphone</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Véhicules</th><th>Réservations</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
  openPrintWindow("Liste Utilisateurs", body);
}

// ═════════════════════════════════════════════════════════════════════════════
//  RÉSERVATIONS
// ═════════════════════════════════════════════════════════════════════════════

type PrintBooking = {
  id: string; startDate: string; endDate: string; totalAmountGnf: number; status: string;
  vehicle: { brand: string; model: string; owner?: { firstName: string; lastName: string } };
  customer?: { firstName: string; lastName: string };
};

const BOOKING_STATUS_FR: Record<string, string> = {
  EN_ATTENTE: "En attente", CONFIRMEE: "Confirmée", EN_COURS: "En cours",
  TERMINEE: "Terminée", ANNULEE: "Annulée", REJETEE: "Rejetée",
};

/** Imprimer la liste des réservations actuellement affichées */
export function printBookingList(bookings: PrintBooking[], filterLabel: string) {
  const rows = bookings.map((b) => `
    <tr>
      <td>${b.vehicle.brand} ${b.vehicle.model}</td>
      <td>${b.customer?.firstName ?? ""} ${b.customer?.lastName ?? ""}</td>
      <td>${b.vehicle.owner?.firstName ?? ""} ${b.vehicle.owner?.lastName ?? ""}</td>
      <td>${new Date(b.startDate).toLocaleDateString("fr-FR")} → ${new Date(b.endDate).toLocaleDateString("fr-FR")}</td>
      <td>${new Intl.NumberFormat("fr-GN", { style: "currency", currency: "GNF", maximumFractionDigits: 0 }).format(b.totalAmountGnf)}</td>
      <td>${badge(BOOKING_STATUS_FR[b.status] ?? b.status, BADGE_MAP[b.status])}</td>
    </tr>
  `).join("");

  const total = bookings.reduce((s, b) => s + b.totalAmountGnf, 0);
  const totalFormatted = new Intl.NumberFormat("fr-GN", { style: "currency", currency: "GNF", maximumFractionDigits: 0 }).format(total);

  const body = `
    <h1>Liste des Réservations</h1>
    <div class="subtitle">Filtre : ${filterLabel || "Toutes"} — ${bookings.length} réservation(s) — Total : ${totalFormatted}</div>
    <table>
      <thead>
        <tr>
          <th>Véhicule</th><th>Client</th><th>Propriétaire</th><th>Période</th><th>Montant</th><th>Statut</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
  openPrintWindow("Liste Réservations", body);
}

// ═════════════════════════════════════════════════════════════════════════════
//  VÉHICULES (par statut)
// ═════════════════════════════════════════════════════════════════════════════

type PrintVehicle = {
  id: string; brand: string; model: string; commune: string; publicationStatus: string;
  dailyRentalPriceGnf?: number | null;
  owner?: { firstName: string; lastName: string };
};

const VEHICLE_STATUS_FR: Record<string, string> = {
  BROUILLON: "Brouillon", EN_ATTENTE_VALIDATION: "En attente", PUBLIEE: "Publiée",
  REJETEE: "Rejetée", ARCHIVEE: "Archivée",
};

/** Imprimer la liste des véhicules par statut */
export function printVehicleList(vehicles: PrintVehicle[], filterLabel: string) {
  const rows = vehicles.map((v) => `
    <tr>
      <td>${v.brand} ${v.model}</td>
      <td>${v.owner?.firstName ?? ""} ${v.owner?.lastName ?? ""}</td>
      <td>${v.commune}</td>
      <td>${VEHICLE_STATUS_FR[v.publicationStatus] ?? v.publicationStatus}</td>
      <td>${v.dailyRentalPriceGnf ? new Intl.NumberFormat("fr-GN", { style: "currency", currency: "GNF", maximumFractionDigits: 0 }).format(v.dailyRentalPriceGnf) : "—"}</td>
    </tr>
  `).join("");

  const body = `
    <h1>Liste des Véhicules</h1>
    <div class="subtitle">Filtre : ${filterLabel || "Tous"} — ${vehicles.length} véhicule(s)</div>
    <table>
      <thead>
        <tr>
          <th>Véhicule</th><th>Propriétaire</th><th>Commune</th><th>Statut</th><th>Prix/jour</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
  openPrintWindow("Liste Véhicules", body);
}
