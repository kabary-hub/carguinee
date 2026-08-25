/**
 * Liste complète des communes et quartiers de Conakry (Guinée).
 * Trier par ordre alphabétique.
 * Utilisé par AddVehiclePage, OwnerDashboardPage et le catalogue.
 *
 * Source : quartiers-coordinates.json + connaissance locale.
 */

export const COMMUNES = [
  "COYAH",
  "DIXINN",
  "DUBREKA",
  "GBESSIA",
  "KAGBELEN",
  "KALOUM",
  "KASSA",
  "LAMBANYI",
  "MANEYAH",
  "MATAM",
  "MATOTO",
  "RATOMA",
  "SANOYAH",
  "SONFONIA",
  "TOMBOLIA",
] as const;

export type CommuneName = (typeof COMMUNES)[number];

export const QUARTIERS: Record<CommuneName, readonly string[]> = {
  COYAH: [
    "Bambéto Coyah",
    "Coyah Centre",
    "Koulamoussou",
    "Kouyé",
    "Mourtounoun",
    "Trimouyah",
  ],
  DIXINN: [
    "Belle-vue",
    "Camayenne",
    "Cameroun",
    "Dixinn Cité",
    "Dixinn Gare",
    "Dixinn Mosquée",
    "Hafia",
    "Kénien",
    "Landréah",
    "Minière",
  ],
  DUBREKA: [
    "Dubreka Centre",
    "Kéniériféré",
    "Kolenté Dubreka",
    "Tatawater",
  ],
  GBESSIA: [
    "Camp Samory",
    "Colomine",
    "Gbessia Centre",
    "Gbessia Porel",
    "Pamelou",
  ],
  KAGBELEN: [
    "Kagbelen Centre",
    "Kagbelen Gare",
    "Sambaoulé",
  ],
  KALOUM: [
    "Almamya",
    "Boulbinet",
    "Coronthie",
    "Kaloum Centre",
    "Kouléwondy",
    "Manquepas",
    "Sandervalia",
    "Sans-fil",
    "Témitaye",
    "Tombo",
  ],
  KASSA: [
    "Kassa Centre",
    "Kassa Île",
  ],
  LAMBANYI: [
    "Kinsay",
    "Lambanyi Centre",
    "Lambanyi Dock",
    "Micad",
  ],
  MANEYAH: [
    "Maneyah Centre",
    "Sangoyah Maneyah",
  ],
  MATAM: [
    "Bonfi",
    "Boussoura",
    "Carrière",
    "Coléah",
    "Hermakonon",
    "Lansanaya",
    "Lansboundji",
    "Madina",
    "Mafanco",
    "Matam Centre",
    "Touguiwondy",
  ],
  MATOTO: [
    "Kabitaya",
    "Kissosso",
    "Matoto Centre",
    "Sangoyah",
    "Simbaya",
    "Wanindara",
  ],
  RATOMA: [
    "Bomboli",
    "Dar-es-salam",
    "Demoudoula",
    "Hamdalaye",
    "Kakimbo",
    "Kaporo",
    "Kipé",
    "Koloma",
    "Korontin",
    "Nongo",
    "Ratoma Centre",
    "Soloprimo",
    "Taou",
    "Taouyah",
  ],
  SANOYAH: [
    "Sanoyah Centre",
  ],
  SONFONIA: [
    "Sonfonia Centre",
    "Sonfonia Gare",
  ],
  TOMBOLIA: [
    "Tombolia Centre",
  ],
} as const;

/**
 * Renvoie les quartiers d'une commune, ou un tableau vide si inconnu.
 */
export function getQuartiers(commune: string): readonly string[] {
  return QUARTIERS[commune as CommuneName] ?? [];
}
