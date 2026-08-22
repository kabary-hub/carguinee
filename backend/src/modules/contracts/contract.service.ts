import fs from "node:fs";
import path from "node:path";
import { prisma } from "../../lib/prisma.js";

// Chemin de stockage des contrats PDF
const CONTRACTS_DIR = path.resolve("contracts");

// S'assurer que le dossier existe
if (!fs.existsSync(CONTRACTS_DIR)) {
  fs.mkdirSync(CONTRACTS_DIR, { recursive: true });
}

/**
 * Génère le contenu HTML d'un contrat de location
 */
function generateContractHtml(data: {
  owner: { firstName: string; lastName: string; phone: string; email: string | null };
  customer: { firstName: string; lastName: string; phone: string; email: string | null };
  vehicle: { brand: string; model: string; year: number | null; mileageKm: number | null };
  booking: {
    startDate: string;
    endDate: string;
    totalAmountGnf: number;
    depositAmountGnf: number;
    dailyRateGnf: number;
  };
  contractId: string;
}): string {
  const { owner, customer, vehicle, booking, contractId } = data;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formatMontant = (montant: number) =>
    new Intl.NumberFormat("fr-GN", { maximumFractionDigits: 0 }).format(montant) + " GNF";

  // Calculer le nombre de jours
  const debut = new Date(booking.startDate);
  const fin = new Date(booking.endDate);
  const nbJours = Math.ceil((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24));

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Contrat de Location - ${contractId}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a2e; margin: 40px; line-height: 1.6; }
    h1 { text-align: center; color: #059669; font-size: 22px; border-bottom: 2px solid #059669; padding-bottom: 10px; }
    h2 { color: #059669; font-size: 16px; margin-top: 24px; }
    .header-text { text-align: center; font-size: 12px; color: #666; margin-bottom: 20px; }
    .info-block { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 12px 0; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .info-label { font-weight: 600; color: #475569; font-size: 13px; }
    .info-value { font-size: 14px; }
    .montant { font-size: 18px; font-weight: 700; color: #059669; }
    .article { margin: 16px 0; }
    .article h3 { font-size: 14px; color: #1a1a2e; margin-bottom: 6px; }
    .article p { font-size: 13px; color: #334155; }
    .signature-block { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; text-align: center; }
    .signature-box { border-top: 1px solid #1a1a2e; padding-top: 8px; }
    .footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
    .logo { text-align: center; margin-bottom: 10px; }
    .logo span { font-size: 28px; font-weight: 900; color: #059669; }
  </style>
</head>
<body>
  <div class="logo"><span>CarGuinée</span></div>
  <div class="header-text">Plateforme de Mobilité — République de Guinée</div>

  <h1>CONTRAT DE LOCATION DE VÉHICULE</h1>

  <p style="text-align: center; font-size: 13px; color: #64748b;">
    N° ${contractId} — Fait à Conakry, le ${formatDate(new Date().toISOString())}
  </p>

  <p>Entre les soussignés :</p>

  <div class="info-block">
    <div class="info-grid">
      <div>
        <p class="info-label">Le Propriétaire</p>
        <p class="info-value">${owner.firstName} ${owner.lastName}</p>
        <p class="info-value">Tél : ${owner.phone}</p>
        ${owner.email ? `<p class="info-value">Email : ${owner.email}</p>` : ""}
      </div>
      <div>
        <p class="info-label">Le Client</p>
        <p class="info-value">${customer.firstName} ${customer.lastName}</p>
        <p class="info-value">Tél : ${customer.phone}</p>
        ${customer.email ? `<p class="info-value">Email : ${customer.email}</p>` : ""}
      </div>
    </div>
  </div>

  <p>Il a été convenu ce qui suit :</p>

  <div class="article">
    <h2>ARTICLE 1 — OBJET</h2>
    <p>Le Propriétaire met à disposition du Client le véhicule suivant :</p>
    <div class="info-block">
      <div class="info-grid">
        <div><span class="info-label">Marque :</span> <span class="info-value">${vehicle.brand}</span></div>
        <div><span class="info-label">Modèle :</span> <span class="info-value">${vehicle.model}</span></div>
        ${vehicle.year ? `<div><span class="info-label">Année :</span> <span class="info-value">${vehicle.year}</span></div>` : ""}
        ${vehicle.mileageKm ? `<div><span class="info-label">Kilométrage :</span> <span class="info-value">${vehicle.mileageKm.toLocaleString("fr-FR")} km</span></div>` : ""}
      </div>
    </div>
  </div>

  <div class="article">
    <h2>ARTICLE 2 — DURÉE</h2>
    <p>La location est effectuée du <strong>${formatDate(booking.startDate)}</strong> au <strong>${formatDate(booking.endDate)}</strong>, soit <strong>${nbJours} jour(s)</strong>.</p>
  </div>

  <div class="article">
    <h2>ARTICLE 3 — PRIX ET CAUTION</h2>
    <div class="info-block">
      <div class="info-grid">
        <div>
          <p class="info-label">Tarif journalier</p>
          <p class="montant">${formatMontant(booking.dailyRateGnf)}</p>
        </div>
        <div>
          <p class="info-label">Montant total</p>
          <p class="montant">${formatMontant(booking.totalAmountGnf)}</p>
        </div>
        ${booking.depositAmountGnf > 0 ? `
        <div>
          <p class="info-label">Caution</p>
          <p class="montant">${formatMontant(booking.depositAmountGnf)}</p>
        </div>` : ""}
      </div>
    </div>
  </div>

  <div class="article">
    <h2>ARTICLE 4 — CONDITIONS GÉNÉRALES</h2>
    <p>4.1 Le Client s'engage à utiliser le véhicule de manière conforme à sa destination normale et à respecter les règles de la circulation routière.</p>
    <p>4.2 Le Client s'engage à restituer le véhicule dans le même état que lors de la prise en charge, sous réserve de l'usure normale.</p>
    <p>4.3 Tout dommage causé au véhicule par une utilisation inappropriée sera à la charge exclusive du Client.</p>
    <p>4.4 La caution est restituée dans les 7 jours ouvrés suivant la restitution du véhicule, après vérification de son état.</p>
    <p>4.5 Le Client ne peut sous-louer le véhicule ni le mettre à disposition d'un tiers sans l'accord écrit du Propriétaire.</p>
    <p>4.6 En cas d'accident, le Client doit immédiatement prévenir le Propriétaire et les autorités compétentes.</p>
    <p>4.7 Le présent contrat est soumis au droit guinéen. Tout litige sera soumis aux tribunaux compétents de Conakry.</p>
  </div>

  <div class="article">
    <h2>ARTICLE 5 — ASSURANCE</h2>
    <p>Le Client déclare être titulaire d'une assurance couvrant la responsabilité civile pour l'utilisation du véhicule loué.</p>
  </div>

  <div class="article">
    <h2>ARTICLE 6 — RESTITUTION</h2>
    <p>Le véhicule doit être restitué à la date et à l'heure convenues. Tout retard de restitution non autorisé pourra entraîner la facturation de jours supplémentaires au tarif journalier convenu.</p>
  </div>

  <div class="signature-block">
    <div>
      <p class="info-label">Le Propriétaire</p>
      <p>${owner.firstName} ${owner.lastName}</p>
      <div class="signature-box">&nbsp;</div>
    </div>
    <div>
      <p class="info-label">Le Client</p>
      <p>${customer.firstName} ${customer.lastName}</p>
      <div class="signature-box">&nbsp;</div>
    </div>
  </div>

  <div class="footer">
    <p>CarGuinée — Plateforme de Mobilité — Conakry, Guinée</p>
    <p>Ce contrat a été généré automatiquement par la plateforme CarGuinée.</p>
  </div>
</body>
</html>`;
}

/**
 * Génère un contrat PDF pour une réservation confirmée
 */
export async function generateContract(bookingId: string) {
  const booking = await prisma.rentalBooking.findUnique({
    where: { id: bookingId },
    include: {
      vehicle: { select: { brand: true, model: true, year: true, mileageKm: true } },
      customer: { select: { firstName: true, lastName: true, phone: true, email: true } },
    },
  });

  if (!booking) {
    throw new Error("Réservation introuvable.");
  }

  if (booking.status !== "CONFIRMEE") {
    throw new Error("Le contrat ne peut être généré que pour une réservation confirmée.");
  }

  // Vérifier si un contrat existe déjà
  const existingContract = await prisma.rentalContract.findUnique({
    where: { bookingId },
  });

  if (existingContract) {
    return existingContract;
  }

  // Récupérer les infos du propriétaire
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: booking.vehicleId },
    select: { ownerId: true },
  });

  if (!vehicle) {
    throw new Error("Véhicule introuvable.");
  }

  const owner = await prisma.user.findUnique({
    where: { id: vehicle.ownerId },
    select: { firstName: true, lastName: true, phone: true, email: true },
  });

  if (!owner) {
    throw new Error("Propriétaire introuvable.");
  }

  // Générer le contenu HTML
  const contractId = `CG-${new Date().getFullYear()}-${bookingId.slice(0, 8).toUpperCase()}`;
  const html = generateContractHtml({
    owner,
    customer: booking.customer,
    vehicle: booking.vehicle,
    booking: {
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
      totalAmountGnf: booking.totalAmountGnf,
      depositAmountGnf: booking.depositAmountGnf,
      dailyRateGnf: booking.dailyRateGnf,
    },
    contractId,
  });

  // Sauvegarder le HTML comme fichier (pourrait être converti en PDF avec une lib)
  const fileName = `${contractId}.html`;
  const filePath = path.join(CONTRACTS_DIR, fileName);
  fs.writeFileSync(filePath, html, "utf-8");

  // Enregistrer en base
  const contract = await prisma.rentalContract.create({
    data: {
      bookingId,
      pdfUrl: `/contracts/${fileName}`,
    },
  });

  return contract;
}

/**
 * Récupère le contrat d'une réservation
 */
export async function getContract(bookingId: string) {
  const contract = await prisma.rentalContract.findUnique({
    where: { bookingId },
    include: {
      booking: {
        include: {
          vehicle: { select: { brand: true, model: true, year: true } },
          customer: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!contract) {
    throw new Error("Contrat introuvable.");
  }

  return contract;
}

/**
 * Signe électroniquement un contrat
 */
export async function signContract(
  bookingId: string,
  signerId: string,
  role: "customer" | "owner",
) {
  const contract = await prisma.rentalContract.findUnique({
    where: { bookingId },
    include: {
      booking: {
        include: {
          vehicle: { select: { ownerId: true } },
          customer: { select: { id: true } },
        },
      },
    },
  });

  if (!contract) {
    throw new Error("Contrat introuvable.");
  }

  // Vérifier que le signataire est bien concerné
  const isCustomer = contract.booking.customer.id === signerId;
  const isOwner = contract.booking.vehicle.ownerId === signerId;

  if (!isCustomer && !isOwner) {
    throw new Error("Vous n'êtes pas autorisé à signer ce contrat.");
  }

  const updateData: { customerSigned?: boolean; ownerSigned?: boolean; signedAt?: Date } = {};

  if (role === "customer" && isCustomer) {
    updateData.customerSigned = true;
  } else if (role === "owner" && isOwner) {
    updateData.ownerSigned = true;
  } else {
    throw new Error("Rôle de signataire invalide.");
  }

  // Mettre à jour la date de signature si les deux parties ont signé
  const updatedContract = await prisma.rentalContract.update({
    where: { bookingId },
    data: {
      ...updateData,
      ...(contract.customerSigned && role === "owner" ? { signedAt: new Date() } : {}),
      ...(contract.ownerSigned && role === "customer" ? { signedAt: new Date() } : {}),
    },
  });

  return updatedContract;
}
