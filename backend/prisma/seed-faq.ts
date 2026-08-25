/**
 * Seed FAQ — Peuple la table FaqEntry avec des questions/réponses
 * spécifiques à CarGuinée.
 *
 * Usage : cd backend && npx tsx prisma/seed-faq.ts
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL est obligatoire.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const FAQ_ENTRIES = [
  // ═══════════════════════ GÉNÉRAL ═══════════════════════
  {
    questionFr: "Qu'est-ce que CarGuinée ?",
    questionEn: "What is CarGuinée?",
    answerFr: "CarGuinée est une plateforme de location et de vente de véhicules en Guinée. Vous pouvez louer ou acheter des véhicules vérifiés, payer via Orange Money, et bénéficier d'un service avec chauffeur.",
    answerEn: "CarGuinée is a vehicle rental and sales platform in Guinea. You can rent or buy verified vehicles, pay via Orange Money, and enjoy a chauffeur service.",
    category: "GENERAL",
    keywords: ["carguinee", "plateforme", "site", "application", "service", "guinee", "vehicule"],
    sortOrder: 1,
  },
  {
    questionFr: "Quelles zones couvre CarGuinée ?",
    questionEn: "Which areas does CarGuinée cover?",
    answerFr: "CarGuinée couvre principalement la ville de Conakry avec les communes de Kaloum, Dixinn, Matam, Ratoma et Matoto. La expansion vers d'autres villes est prévue.",
    answerEn: "CarGuinée mainly covers Conakry with the communes of Kaloum, Dixinn, Matam, Ratoma, and Matoto. Expansion to other cities is planned.",
    category: "GENERAL",
    keywords: ["zone", "commune", "conakry", "kaloum", "dixinn", "matam", "ratoma", "matoto", "couverture"],
    sortOrder: 2,
  },
  {
    questionFr: "CarGuinée fonctionne avec ou sans chauffeur ?",
    questionEn: "Does CarGuinée work with or without a driver?",
    answerFr: "Les locations sur CarGuinée sont proposées avec chauffeur. Le chauffeur est inclus dans le tarif de location pour votre confort et votre sécurité.",
    answerEn: "Rentals on CarGuinée come with a driver. The driver is included in the rental rate for your comfort and safety.",
    category: "GENERAL",
    keywords: ["chauffeur", "conduire", "driver", "sans chauffeur", "avec chauffeur"],
    sortOrder: 3,
  },

  // ═══════════════════════ COMPTE ═══════════════════════
  {
    questionFr: "Comment créer un compte sur CarGuinée ?",
    questionEn: "How to create an account on CarGuinée?",
    answerFr: "Pour créer un compte :\n1️⃣ Cliquez sur « Inscription »\n2️⃣ Entrez votre numéro de téléphone guinéen (+224)\n3️⃣ Créez un mot de passe sécurisé\n4️⃣ Remplissez votre profil (nom, prénom)\n\nVous pouvez ensuite louer des véhicules ou demander à devenir propriétaire.",
    answerEn: "To create an account:\n1️⃣ Click \"Register\"\n2️⃣ Enter your Guinean phone number (+224)\n3️⃣ Create a secure password\n4️⃣ Fill in your profile (name)\n\nYou can then rent vehicles or apply to become an owner.",
    category: "ACCOUNT",
    keywords: ["compte", "inscription", "register", "créer", "signup", "s'inscrire"],
    sortOrder: 10,
  },
  {
    questionFr: "Comment modifier mon profil ?",
    questionEn: "How to edit my profile?",
    answerFr: "Allez dans « Paramètres » → « Mon profil » ou directement via le menu sidebar. Vous pouvez modifier votre nom, prénom, email et numéro de téléphone.",
    answerEn: "Go to \"Settings\" → \"My Profile\" or directly via the sidebar menu. You can edit your name, email, and phone number.",
    category: "ACCOUNT",
    keywords: ["profil", "modifier", "nom", "email", "telephone", "paramètres", "settings"],
    sortOrder: 11,
  },
  {
    questionFr: "Comment changer mon mot de passe ?",
    questionEn: "How to change my password?",
    answerFr: "Allez dans « Paramètres » → « Mon profil » → section « Mot de passe ». Entrez votre mot de passe actuel puis le nouveau mot de passe.",
    answerEn: "Go to \"Settings\" → \"My Profile\" → \"Password\" section. Enter your current password then the new password.",
    category: "ACCOUNT",
    keywords: ["mot de passe", "password", "changer", "sécurité", "connexion"],
    sortOrder: 12,
  },
  {
    questionFr: "Comment devenir propriétaire sur CarGuinée ?",
    questionEn: "How to become an owner on CarGuinée?",
    answerFr: "Pour devenir propriétaire :\n1️⃣ Créez un compte client\n2️⃣ Allez dans votre profil et cliquez « Devenir propriétaire »\n3️⃣ Remplissez le formulaire avec votre motivation\n4️⃣ Un administrateur examinera votre demande\n\nUne fois approuvé, vous pourrez publier et gérer vos véhicules.",
    answerEn: "To become an owner:\n1️⃣ Create a client account\n2️⃣ Go to your profile and click \"Become an owner\"\n3️⃣ Fill in the form with your motivation\n4️⃣ An admin will review your request\n\nOnce approved, you can publish and manage your vehicles.",
    category: "ACCOUNT",
    keywords: ["propriétaire", "owner", "devenir", "publier", "véhicule", "demande"],
    sortOrder: 13,
  },

  // ═══════════════════════ RÉSERVATION ═══════════════════════
  {
    questionFr: "Comment réserver un véhicule ?",
    questionEn: "How to book a vehicle?",
    answerFr: "Pour réserver :\n1️⃣ Parcourez le catalogue et sélectionnez un véhicule\n2️⃣ Consultez les photos, le tarif et la disponibilité\n3️⃣ Cliquez sur « Réserver » et choisissez vos dates\n4️⃣ Envoyez votre demande de réservation\n5️⃣ Le propriétaire confirmera votre demande\n6️⃣ Après confirmation, payez via Orange Money",
    answerEn: "To book:\n1️⃣ Browse the catalog and select a vehicle\n2️⃣ Check photos, rates, and availability\n3️⃣ Click \"Book\" and choose your dates\n4️⃣ Send your booking request\n5️⃣ The owner will confirm your request\n6️⃣ After confirmation, pay via Orange Money",
    category: "BOOKING",
    keywords: ["réserver", "reservation", "booking", "louer", "location", "dates", "demander"],
    sortOrder: 20,
  },
  {
    questionFr: "Comment annuler une réservation ?",
    questionEn: "How to cancel a booking?",
    answerFr: "Pour annuler :\n1️⃣ Allez dans « Mes réservations »\n2️⃣ Sélectionnez la réservation concernée\n3️⃣ Cliquez sur « Annuler »\n\n⚠️ L'annulation est possible avant le début de la location. Le remboursement dépend de la politique du propriétaire.",
    answerEn: "To cancel:\n1️⃣ Go to \"My Bookings\"\n2️⃣ Select the booking\n3️⃣ Click \"Cancel\"\n\n⚠️ Cancellation is possible before the rental starts. Refund depends on the owner's policy.",
    category: "BOOKING",
    keywords: ["annuler", "cancel", "annulation", "rembourser", "remboursement"],
    sortOrder: 21,
  },
  {
    questionFr: "Quel est le délai pour confirmer une réservation ?",
    questionEn: "How long does it take to confirm a booking?",
    answerFr: "Le propriétaire dispose généralement de 24 heures pour répondre à votre demande. Vous recevrez une notification une fois la décision prise.",
    answerEn: "The owner typically has 24 hours to respond to your request. You'll receive a notification once a decision is made.",
    category: "BOOKING",
    keywords: ["délai", "confirmer", "temps", "réponse", "attente", "notification"],
    sortOrder: 22,
  },
  {
    questionFr: "Puis-je modifier ma réservation après l'avoir envoyée ?",
    questionEn: "Can I modify my booking after sending it?",
    answerFr: "Une fois envoyée, la réservation ne peut pas être modifiée. Vous devez l'annuler et en créer une nouvelle avec les dates souhaitées.",
    answerEn: "Once sent, a booking cannot be modified. You need to cancel it and create a new one with the desired dates.",
    category: "BOOKING",
    keywords: ["modifier", "change", "dates", "changer", "update"],
    sortOrder: 23,
  },

  // ═══════════════════════ PAIEMENT ═══════════════════════
  {
    questionFr: "Comment payer avec Orange Money ?",
    questionEn: "How to pay with Orange Money?",
    answerFr: "Le paiement se fait via Orange Money :\n1️⃣ Après confirmation, allez dans « Mes réservations »\n2️⃣ Cliquez sur « Paiement OM »\n3️⃣ Entrez votre numéro Orange Money\n4️⃣ Validez sur votre téléphone\n\nLe paiement est sécurisé et instantané.",
    answerEn: "Payment via Orange Money:\n1️⃣ After confirmation, go to \"My Bookings\"\n2️⃣ Click \"OM Payment\"\n3️⃣ Enter your Orange Money number\n4️⃣ Confirm on your phone\n\nPayment is secure and instant.",
    category: "PAYMENT",
    keywords: ["payer", "paiement", "orange money", "om", "transaction", "mobile money"],
    sortOrder: 30,
  },
  {
    questionFr: "Quel est le montant de la caution ?",
    questionEn: "What is the deposit amount?",
    answerFr: "Le montant de la caution varie selon le véhicule et est affiché sur la fiche du véhicule. La caution est demandée en plus du loyer et restituée à la fin de la location si le véhicule est rendu en bon état.",
    answerEn: "The deposit amount varies by vehicle and is displayed on the vehicle listing. The deposit is requested in addition to the rental fee and returned at the end of the rental if the vehicle is returned in good condition.",
    category: "PAYMENT",
    keywords: ["caution", "deposit", "sécurité", "garantie", "restition", "remboursement"],
    sortOrder: 31,
  },
  {
    questionFr: "Quels moyens de paiement acceptés ?",
    questionEn: "What payment methods are accepted?",
    answerFr: "CarGuinée accepte principalement Orange Money comme moyen de paiement. D'autres options pourraient être ajoutées prochainement.",
    answerEn: "CarGuinée mainly accepts Orange Money as a payment method. Other options may be added soon.",
    category: "PAYMENT",
    keywords: ["moyen", "paiement", "payment", "method", "orange", "mobile", "carte", "banque"],
    sortOrder: 32,
  },
  {
    questionFr: "Comment obtenir un reçu de paiement ?",
    questionEn: "How to get a payment receipt?",
    answerFr: "Un reçu automatique est envoyé par notification après chaque paiement réussi. Vous pouvez également consulter l'historique dans « Mes paiements ».",
    answerEn: "An automatic receipt is sent via notification after each successful payment. You can also check the history in \"My Payments\".",
    category: "PAYMENT",
    keywords: ["reçu", "receipt", "facture", "historique", "paiement", "transaction"],
    sortOrder: 33,
  },

  // ═══════════════════════ VÉHICULE ═══════════════════════
  {
    questionFr: "Les véhicules sont-ils vérifiés ?",
    questionEn: "Are the vehicles verified?",
    answerFr: "Oui, tous les véhicules publiés sur CarGuinée passent par un processus de validation par notre équipe. Nous vérifions l'état du véhicule, les documents administratifs et la conformité.",
    answerEn: "Yes, all vehicles published on CarGuinée go through a validation process by our team. We check the vehicle's condition, administrative documents, and compliance.",
    category: "VEHICLE",
    keywords: ["vérifié", "verified", "validation", "contrôle", "qualité", "sécurité"],
    sortOrder: 40,
  },
  {
    questionFr: "Quels types de véhicules sont disponibles ?",
    questionEn: "What types of vehicles are available?",
    answerFr: "CarGuinée propose divers types de véhicules : citadines, berlines, SUV, 4x4, utilitaires, minibus et motos. Vous pouvez filtrer le catalogue par type.",
    answerEn: "CarGuinée offers various vehicle types: city cars, sedans, SUVs, 4x4s, utility vehicles, minibuses, and motorcycles. You can filter the catalog by type.",
    category: "VEHICLE",
    keywords: ["type", "catégorie", "citadine", "berline", "suv", "4x4", "utilitaire", "minibus", "moto"],
    sortOrder: 41,
  },
  {
    questionFr: "Comment utiliser la carte pour trouver un véhicule ?",
    questionEn: "How to use the map to find a vehicle?",
    answerFr: "Dans le catalogue, cliquez sur le bouton « Localisation » pour afficher la carte. Les véhicules apparaissent à leur position géographique. Cliquez sur un marqueur pour voir les détails.",
    answerEn: "In the catalog, click the \"Location\" button to display the map. Vehicles appear at their geographic position. Click a marker to see details.",
    category: "VEHICLE",
    keywords: ["carte", "map", "localisation", "position", "marqueur", "geolocalisation"],
    sortOrder: 42,
  },
  {
    questionFr: "Les véhicules ont-ils la climatisation ?",
    questionEn: "Do the vehicles have air conditioning?",
    answerFr: "La plupart des véhicules sur CarGuinée sont équipés de climatisation. Les équipements exacts sont listés sur la fiche de chaque véhicule.",
    answerEn: "Most vehicles on CarGuinée are equipped with air conditioning. Exact equipment is listed on each vehicle's page.",
    category: "VEHICLE",
    keywords: ["clim", "climatisation", "air conditioning", "equipement", "option", "confort"],
    sortOrder: 43,
  },

  // ═══════════════════════ FIDÉLITÉ / PARRAINAGE ═══════════════════════
  {
    questionFr: "Comment fonctionne le programme de fidélité ?",
    questionEn: "How does the loyalty program work?",
    answerFr: "Vous gagnez des points de fidélité à chaque réservation confirmée. Ces points peuvent être échangés contre des réductions sur vos prochaines locations. Consultez « Fidélité » dans le menu.",
    answerEn: "You earn loyalty points with each confirmed booking. These points can be exchanged for discounts on your next rentals. Check \"Loyalty\" in the menu.",
    category: "GENERAL",
    keywords: ["fidélité", "loyalty", "points", "réduction", "discount", "programme"],
    sortOrder: 50,
  },
  {
    questionFr: "Comment parrainer un ami ?",
    questionEn: "How to refer a friend?",
    answerFr: "Allez dans « Paramètres » → « Parrainage ». Partagez votre code ou lien de parrainage. Vous gagnez des points quand votre filleul effectue sa première réservation.",
    answerEn: "Go to \"Settings\" → \"Referral\". Share your referral code or link. You earn points when your referred friend makes their first booking.",
    category: "GENERAL",
    keywords: ["parrainer", "parrainage", "referral", "ami", "code", "bonus", "gagner"],
    sortOrder: 51,
  },

  // ═══════════════════════ CONTACT / SUPPORT ═══════════════════════
  {
    questionFr: "Comment contacter le support ?",
    questionEn: "How to contact support?",
    answerFr: "Vous pouvez nous contacter via :\n💬 Ce chatbot pour les questions fréquentes\n📧 Email : support@carguinee.com\n📱 Téléphone pendant les heures ouvrées\n\nNotre équipe vous répondra dans les plus brefs délais.",
    answerEn: "You can contact us via:\n💬 This chatbot for FAQ\n📧 Email: support@carguinee.com\n📱 Phone during business hours\n\nOur team will respond as soon as possible.",
    category: "GENERAL",
    keywords: ["contact", "support", "aide", "help", "assistance", "joindre", "email", "telephone"],
    sortOrder: 60,
  },
  {
    questionFr: "Quelles sont les heures d'ouverture ?",
    questionEn: "What are the business hours?",
    answerFr: "Le support CarGuinée est disponible du lundi au samedi, de 8h à 20h. Le chatbot est disponible 24h/24 pour les questions fréquentes.",
    answerEn: "CarGuinée support is available Monday to Saturday, 8am to 8pm. The chatbot is available 24/7 for FAQ.",
    category: "GENERAL",
    keywords: ["heure", "ouverture", "disponible", "horaire", "horaires", "24h", "weekend"],
    sortOrder: 61,
  },

  // ═══════════════════════ CONDITIONS DE LOCATION ═══════════════════════
  {
    questionFr: "Quelle est la durée minimum de location ?",
    questionEn: "What is the minimum rental duration?",
    answerFr: "La durée minimum de location est d'une journée. Vous pouvez louer un véhicule pour 1 jour ou plus.",
    answerEn: "The minimum rental duration is one day. You can rent a vehicle for 1 day or more.",
    category: "BOOKING",
    keywords: ["durée", "minimum", "jour", "temps", "combien", "période"],
    sortOrder: 24,
  },
  {
    questionFr: "Quel est le kilométrage inclus dans la location ?",
    questionEn: "What mileage is included in the rental?",
    answerFr: "Le kilométrage inclus varie selon le propriétaire. Les conditions sont affichées sur la fiche du véhicule.",
    answerEn: "Included mileage varies by owner. Conditions are displayed on the vehicle listing.",
    category: "BOOKING",
    keywords: ["kilométrage", "km", "distance", "limite", "dépassement"],
    sortOrder: 25,
  },
  {
    questionFr: "Puis-je louer un véhicule pour une demi-journée ?",
    questionEn: "Can I rent a vehicle for half a day?",
    answerFr: "La location se fait à la journée complète. Contactez le propriétaire via les messages pour négocier.",
    answerEn: "Rentals are for full days only. Contact the owner via messages to negotiate.",
    category: "BOOKING",
    keywords: ["demi-journée", "mi-temps", "court", "heures"],
    sortOrder: 26,
  },

  // ═══════════════════════ CAUTION ET SÉCURITÉ ═══════════════════════
  {
    questionFr: "Comment est restituée la caution ?",
    questionEn: "How is the deposit refunded?",
    answerFr: "La caution est restituée dans les 48h suivant la restitution du véhicule en bon état.",
    answerEn: "The deposit is refunded within 48h of returning the vehicle in good condition.",
    category: "PAYMENT",
    keywords: ["caution", "restitution", "remboursement", "retour", "garantie"],
    sortOrder: 34,
  },
  {
    questionFr: "Que se passe-t-il en cas de dommage au véhicule ?",
    questionEn: "What happens if the vehicle is damaged?",
    answerFr: "En cas de dommage, la caution peut être retenue. Un rapport d'état est établi à la restitution.",
    answerEn: "In case of damage, the deposit may be retained. A condition report is prepared at return.",
    category: "BOOKING",
    keywords: ["dommage", "accident", "dégât", "réparation", "casse", "rayure"],
    sortOrder: 27,
  },
  {
    questionFr: "Le véhicule est-il assuré ?",
    questionEn: "Is the vehicle insured?",
    answerFr: "Tous les véhicules publiés doivent être assurés. L'assurance est valable pendant la location.",
    answerEn: "All published vehicles must be insured. Insurance is valid during the rental.",
    category: "VEHICLE",
    keywords: ["assurance", "assuré", "couverture", "sinistre", "responsabilité"],
    sortOrder: 44,
  },

  // ═══════════════════════ DOCUMENTS ═══════════════════════
  {
    questionFr: "Quels documents dois-je fournir pour louer ?",
    questionEn: "What documents do I need to rent?",
    answerFr: "Présentez une pièce d'identité valide (CIN ou passeport) et votre téléphone vérifié sur CarGuinée.",
    answerEn: "Present a valid ID (national ID or passport) and your phone verified on CarGuinée.",
    category: "BOOKING",
    keywords: ["document", "pièce", "identité", "cin", "passeport", "papiers"],
    sortOrder: 28,
  },
  {
    questionFr: "Comment fonctionne la vérification d'identité ?",
    questionEn: "How does identity verification work?",
    answerFr: "Soumettez une photo de votre CIN, passeport ou permis via votre profil. Un admin validera sous 24-48h.",
    answerEn: "Submit a photo of your ID, passport or license via your profile. An admin will validate within 24-48h.",
    category: "ACCOUNT",
    keywords: ["vérification", "identité", "cin", "passeport", "permis", "valider"],
    sortOrder: 14,
  },

  // ═══════════════════════ ACHAT DE VÉHICULE ═══════════════════════
  {
    questionFr: "Puis-je acheter un véhicule sur CarGuinée ?",
    questionEn: "Can I buy a vehicle on CarGuinée?",
    answerFr: "Oui ! Utilisez le filtre Vente dans le catalogue pour voir les véhicules à acheter.",
    answerEn: "Yes! Use the Sale filter in the catalog to see vehicles for purchase.",
    category: "VEHICLE",
    keywords: ["acheter", "vente", "achat", "racheter"],
    sortOrder: 45,
  },
  {
    questionFr: "Comment se déroule l'achat d'un véhicule ?",
    questionEn: "How does the vehicle purchase process work?",
    answerFr: "Trouvez un véhicule à la vente, contactez le propriétaire, arrangez une visite et négociez le prix.",
    answerEn: "Find a vehicle for sale, contact the owner, arrange a visit and negotiate the price.",
    category: "VEHICLE",
    keywords: ["achat", "acheter", "vente", "négocier", "visite", "essai"],
    sortOrder: 46,
  },

  // ═══════════════════════ MESSAGES ET FAVORIS ═══════════════════════
  {
    questionFr: "Comment contacter le propriétaire d'un véhicule ?",
    questionEn: "How to contact a vehicle owner?",
    answerFr: "Contactez le propriétaire via la messagerie intégrée. Ouvrez la fiche du véhicule et cliquez Contacter.",
    answerEn: "Contact the owner via the built-in messaging. Open the vehicle listing and click Contact.",
    category: "GENERAL",
    keywords: ["contacter", "propriétaire", "message", "conversation", "discuter"],
    sortOrder: 62,
  },
  {
    questionFr: "Comment ajouter un véhicule en favori ?",
    questionEn: "How to add a vehicle to favorites?",
    answerFr: "Cliquez sur l'icône ❤️ sur la fiche du véhicule. Retrouvez vos favoris dans le menu sidebar.",
    answerEn: "Click the ❤️ icon on the vehicle listing. Find your favorites in the sidebar menu.",
    category: "GENERAL",
    keywords: ["favori", "favoris", "like", "aimer", "sauvegarder"],
    sortOrder: 63,
  },

  // ═══════════════════════ PROPRIÉTAIRE ═══════════════════════
  {
    questionFr: "Comment publier un véhicule sur CarGuinée ?",
    questionEn: "How to list a vehicle on CarGuinée?",
    answerFr: "Allez dans votre espace propriétaire, cliquez Ajouter un véhicule, remplissez les infos et soumettez.",
    answerEn: "Go to your owner dashboard, click Add a vehicle, fill in the info and submit.",
    category: "VEHICLE",
    keywords: ["publier", "publication", "ajouter", "annonce", "poster"],
    sortOrder: 47,
  },
  {
    questionFr: "Combien de véhicules puis-je publier ?",
    questionEn: "How many vehicles can I list?",
    answerFr: "Il n'y a pas de limite. Vous pouvez ajouter autant de véhicules que vous le souhaitez.",
    answerEn: "There is no limit. You can add as many vehicles as you want.",
    category: "VEHICLE",
    keywords: ["nombre", "limite", "combien", "quantité", "maximum"],
    sortOrder: 48,
  },

  // ═══════════════════════ SÉCURITÉ ═══════════════════════
  {
    questionFr: "Mes données personnelles sont-elles protégées ?",
    questionEn: "Are my personal data protected?",
    answerFr: "Oui, CarGuinée protège vos données conformément au RGPD. Exportez ou supprimez vos données depuis les paramètres.",
    answerEn: "Yes, CarGuinée protects your data in compliance with GDPR. Export or delete your data from settings.",
    category: "GENERAL",
    keywords: ["données", "protégé", "sécurité", "confidentialité", "rgpd", "vie privée"],
    sortOrder: 64,
  },
];

async function main() {
  console.log("🔍 Peuplage de la table FaqEntry...\n");

  let created = 0;
  let updated = 0;

  for (const entry of FAQ_ENTRIES) {
    // Upsert par questionFr (unique logique)
    const existing = await prisma.faqEntry.findFirst({
      where: { questionFr: entry.questionFr },
    });

    if (existing) {
      await prisma.faqEntry.update({
        where: { id: existing.id },
        data: {
          questionEn: entry.questionEn,
          answerFr: entry.answerFr,
          answerEn: entry.answerEn,
          category: entry.category,
          keywords: entry.keywords,
          sortOrder: entry.sortOrder,
        },
      });
      updated++;
    } else {
      await prisma.faqEntry.create({
        data: {
          questionFr: entry.questionFr,
          questionEn: entry.questionEn,
          answerFr: entry.answerFr,
          answerEn: entry.answerEn,
          category: entry.category,
          keywords: entry.keywords,
          sortOrder: entry.sortOrder,
          isActive: true,
        },
      });
      created++;
    }
  }

  console.log(`✅ FAQ seed terminé : ${created} créées, ${updated} mises à jour`);
  console.log(`   Total : ${FAQ_ENTRIES.length} entrées FAQ`);
  console.log("\nCatégories :");
  const categories = [...new Set(FAQ_ENTRIES.map((e) => e.category))];
  for (const cat of categories) {
    const count = FAQ_ENTRIES.filter((e) => e.category === cat).length;
    console.log(`   ${cat} : ${count} questions`);
  }
}

main().finally(() => prisma.$disconnect());
