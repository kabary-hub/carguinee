export type BookingStatus = "EN_ATTENTE" | "CONFIRMEE" | "EN_COURS" | "TERMINEE" | "ANNULEE" | "REJETEE";
export type Vehicle = {
  id: string; brand: string; model: string; type: string; condition: string; year?: number | null; mileageKm?: number | null; color?: string | null; seats?: number | null; description?: string | null; descriptionFr?: string | null; descriptionEn?: string | null;
  commune: string; quartier: string; secteur: string; supportsRental: boolean; supportsSale: boolean; dailyRentalPriceGnf?: number | null; rentalDepositGnf?: number | null; salePriceGnf?: number | null;
  publicationStatus: string; rejectionReason?: string | null; photos: { id: string; url: string; sortOrder: number }[]; owner?: { id: string; firstName: string; lastName: string; phone?: string; email?: string | null; role?: string; averageRating?: number | null; identityVerified?: boolean };
  // Champs V2 : caractéristiques techniques
  firstRegistrationDate?: string | null; vin?: string | null; odometerGuaranteed?: boolean | null; engineDisplacement?: number | null;
  fuelType?: string | null; transmission?: string | null; drivetrain?: string | null; horsepower?: number | null;
  equipmentList?: string[]; consumptionCity?: number | null; consumptionHighway?: number | null;
  lastMaintenanceDate?: string | null; nextMaintenanceDate?: string | null;
  // Champs V2 : documents administratifs
  carteGrisePresente?: boolean | null; carteGriseNom?: string | null; carteGrisePhoto?: string | null;
  visiteTechniqueValideJusquA?: string | null; assuranceValideJusquA?: string | null; documentsDisponibles?: string[];
  // Champs V2 : caution et localisation
  depositReturnPolicy?: string | null; depositHeldBy?: string | null;
  latitude?: number | null; longitude?: number | null;
  // Relations V2
  conditionReport?: { exteriorDamage?: string | null; paintQuality?: string | null; engineCondition?: string | null; transmissionCondition?: string | null; tireCondition?: string | null; brakeCondition?: string | null; interiorCondition?: string | null; seatsCondition?: string | null; electronicsWorking?: boolean | null; overallRating?: number | null; additionalNotes?: string | null } | null;
  _count?: { reviews?: number; favorites?: number; rentalBookings?: number };
  adminFavorited?: boolean;
};
export type Payment = { id: string; amount: number; currency: string; status: string; provider: string; createdAt: string };
export type Booking = { id: string; startDate: string; endDate: string; dailyRateGnf: number; totalAmountGnf: number; depositAmountGnf: number; depositStatus: string; status: BookingStatus; notes?: string | null; vehicle: Vehicle; customer?: { id: string; firstName: string; lastName: string; phone: string; email?: string | null }; payments?: Payment[] };
export type ApiResponse<T> = { status: "ok"; data: T };
export const formatGnf = (value?: number | null) => new Intl.NumberFormat("fr-GN", { style: "currency", currency: "GNF", maximumFractionDigits: 0 }).format(value ?? 0);
export const formatDate = (value: string) => new Intl.DateTimeFormat("fr-GN", { dateStyle: "medium" }).format(new Date(value));
