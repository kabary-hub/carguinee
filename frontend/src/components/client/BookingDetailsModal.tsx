import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatDate, formatGnf, type Booking } from "../../lib/domain";
import { StatusBadge } from "../StatusBadge";

type BookingDetailsModalProps = {
  booking: Booking;
  onClose: () => void;
};

function rentalDays(startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return Math.max(1, Math.round((end - start) / 86_400_000) + 1);
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-5 border-b border-slate-200 pb-2 text-xs font-black uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">
      {children}
    </h3>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
        {value ?? "—"}
      </p>
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  NON_REQUIS: "Non requis",
  A_PAYER: "À payer",
  DETENU: "Retenue",
  RESTITUE: "Restituée",
  RETENU_PARTIELLEMENT: "Retenue partielle",
  RETENU_TOTAL: "Retenue totale",
};

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  CITADINE: "Citadine",
  BERLINE: "Berline",
  SUV: "SUV",
  QUATRE_QUATRE: "4×4",
  UTILITAIRE: "Utilitaire",
  MINIBUS: "Minibus",
  CAMION: "Camion",
  MOTO: "Moto",
  AUTRE: "Autre",
};

const CONDITION_LABELS: Record<string, string> = {
  NEUF: "Neuf",
  OCCASION: "Occasion",
};

export function BookingDetailsModal({
  booking,
  onClose,
}: BookingDetailsModalProps) {
  const { t, i18n } = useTranslation();
  const vehicle = booking.vehicle;
  const owner = vehicle.owner;
  const customer = booking.customer;
  const days = rentalDays(booking.startDate, booking.endDate);
  const isFr = i18n.language?.startsWith("fr");

  const handlePrint = () => window.print();

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("bookings.details.vehicle")}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="booking-modal max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900 print:h-auto print:max-h-none print:overflow-visible print:border-0 print:shadow-none print:p-0">
        {/* ── En-tête ──────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
              {vehicle.brand} {vehicle.model}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Réservation #{booking.id.slice(0, 8)}
            </p>
            <div className="mt-2">
              <StatusBadge value={booking.status} />
            </div>
          </div>
          <div className="flex gap-2 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              🖨️ {t("common.print", { defaultValue: "Imprimer" })}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label={t("common.close")}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Détails réservation ──────────────────────────────────── */}
        <SectionTitle>
          📋 {t("bookings.details.dates", { defaultValue: "Réservation" })}
        </SectionTitle>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field
            label={t("bookings.details.startDate", { defaultValue: "Début" })}
            value={formatDate(booking.startDate)}
          />
          <Field
            label={t("bookings.details.endDate", { defaultValue: "Fin" })}
            value={formatDate(booking.endDate)}
          />
          <Field
            label={t("bookings.details.duration", { defaultValue: "Durée" })}
            value={`${days} ${isFr ? "jour(s)" : "day(s)"}`}
          />
          <Field
            label={t("bookings.details.dailyRate", { defaultValue: "Tarif/jour" })}
            value={formatGnf(booking.dailyRateGnf)}
          />
          <Field
            label={t("bookings.details.totalAmount", { defaultValue: "Montant total" })}
            value={formatGnf(booking.totalAmountGnf)}
          />
          <Field
            label={t("bookings.details.depositAmount", { defaultValue: "Caution" })}
            value={formatGnf(booking.depositAmountGnf)}
          />
          <Field
            label={t("bookings.details.depositStatus", { defaultValue: "Statut caution" })}
            value={STATUS_LABELS[booking.depositStatus] ?? booking.depositStatus}
          />
        </div>

        {/* ── Client ───────────────────────────────────────────────── */}
        {customer && (
          <>
            <SectionTitle>
              👤 {isFr ? "Client" : "Customer"}
            </SectionTitle>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <Field
                label={t("profile.fullName", { defaultValue: "Nom complet" })}
                value={`${customer.firstName} ${customer.lastName}`}
              />
              <Field
                label={t("profile.phone", { defaultValue: "Téléphone" })}
                value={customer.phone}
              />
              {customer.email && (
                <Field
                  label={t("profile.email", { defaultValue: "Email" })}
                  value={customer.email}
                />
              )}
              <Field
                label="ID"
                value={<span className="font-mono text-xs">{customer.id}</span>}
              />
            </div>
          </>
        )}

        {/* ── Propriétaire ─────────────────────────────────────────── */}
        {owner && (
          <>
            <SectionTitle>
              🏠 {isFr ? "Propriétaire" : "Owner"}
            </SectionTitle>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <Field
                label={t("profile.fullName", { defaultValue: "Nom complet" })}
                value={`${owner.firstName} ${owner.lastName}`}
              />
              {owner.phone && (
                <Field
                  label={t("profile.phone", { defaultValue: "Téléphone" })}
                  value={owner.phone}
                />
              )}
              {owner.email && (
                <Field
                  label={t("profile.email", { defaultValue: "Email" })}
                  value={owner.email}
                />
              )}
              {owner.averageRating != null && (
                <Field
                  label={t("owner.dashboard.stats.rating", { defaultValue: "Note" })}
                  value={`⭐ ${owner.averageRating.toFixed(1)}/5`}
                />
              )}
              {owner.identityVerified != null && (
                <Field
                  label={isFr ? "Identité vérifiée" : "Identity verified"}
                  value={owner.identityVerified ? "✅" : "❌"}
                />
              )}
            </div>
          </>
        )}

        {/* ── Véhicule ─────────────────────────────────────────────── */}
        <SectionTitle>
          🚗 {isFr ? "Véhicule" : "Vehicle"}
        </SectionTitle>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field
            label={t("vehicles.details.brand", { defaultValue: "Marque" })}
            value={vehicle.brand}
          />
          <Field
            label={t("vehicles.details.model", { defaultValue: "Modèle" })}
            value={vehicle.model}
          />
          {vehicle.year && (
            <Field
              label={t("vehicles.details.year", { defaultValue: "Année" })}
              value={vehicle.year}
            />
          )}
          <Field
            label={t("vehicles.details.type", { defaultValue: "Type" })}
            value={VEHICLE_TYPE_LABELS[vehicle.type] ?? vehicle.type}
          />
          <Field
            label={t("vehicles.details.condition", { defaultValue: "État" })}
            value={CONDITION_LABELS[vehicle.condition] ?? vehicle.condition}
          />
          {vehicle.mileageKm != null && (
            <Field
              label={t("vehicles.details.mileage", { defaultValue: "Kilométrage" })}
              value={`${vehicle.mileageKm.toLocaleString("fr-FR")} km`}
            />
          )}
          {vehicle.color && (
            <Field
              label={t("vehicles.details.color", { defaultValue: "Couleur" })}
              value={vehicle.color}
            />
          )}
          {vehicle.seats != null && (
            <Field
              label={t("vehicles.details.seats", { defaultValue: "Places" })}
              value={vehicle.seats}
            />
          )}
          <Field
            label={t("vehicles.details.commune", { defaultValue: "Commune" })}
            value={vehicle.commune}
          />
          <Field
            label={t("vehicles.details.quartier", { defaultValue: "Quartier" })}
            value={vehicle.quartier}
          />
          {vehicle.secteur && (
            <Field
              label={t("vehicles.details.secteur", { defaultValue: "Secteur" })}
              value={vehicle.secteur}
            />
          )}
          {vehicle.fuelType && (
            <Field
              label={isFr ? "Carburant" : "Fuel"}
              value={vehicle.fuelType}
            />
          )}
          {vehicle.transmission && (
            <Field
              label={isFr ? "Transmission" : "Transmission"}
              value={vehicle.transmission}
            />
          )}
          {vehicle.horsepower != null && (
            <Field
              label={isFr ? "Puissance" : "Horsepower"}
              value={`${vehicle.horsepower} CV`}
            />
          )}
        </div>

        {/* ── Photos ───────────────────────────────────────────────── */}
        {vehicle.photos && vehicle.photos.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isFr ? "Photos" : "Photos"} ({vehicle.photos.length})
            </p>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {vehicle.photos.slice(0, 5).map((photo) => (
                <img
                  key={photo.id}
                  src={photo.url}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
                />
              ))}
              {vehicle.photos.length > 5 && (
                <span className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  +{vehicle.photos.length - 5}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Notes client ─────────────────────────────────────────── */}
        {booking.notes && (
          <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("bookings.details.customerNote", { defaultValue: "Note du client" })}
            </p>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">
              {booking.notes}
            </p>
          </div>
        )}

        {/* ── Footer actions ───────────────────────────────────────── */}
        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 dark:border-slate-700 sm:flex-row sm:justify-end print:hidden">
          <Link
            to={`/vehicules/${vehicle.id}`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {t("bookings.viewVehicle", { defaultValue: "Voir le véhicule" })}
          </Link>
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            🖨️ {t("common.print", { defaultValue: "Imprimer" })}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
