import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "../../components/AppShell";
import { TranslateFieldButton } from "../../components/TranslateFieldButton";
import { useToast } from "../../contexts/ToastContext";
import { apiFetch } from "../../lib/api";
import { COMMUNES, getQuartiers } from "../../lib/communes-quartiers";

const VEHICLE_TYPES = [
  "CITADINE", "BERLINE", "SUV", "QUATRE_QUATRE", "UTILITAIRE", "MINIBUS", "CAMION", "MOTO", "AUTRE",
];
const VEHICLE_CONDITIONS = ["OCCASION", "NEUF"];
// Les communes sont importées depuis ../../lib/communes-quartiers

/**
 * Modes de commercialisation du véhicule :
 * - LOCATION : location uniquement (tarif journalier + caution)
 * - VENTE : vente uniquement (prix de vente)
 * - LOCATION_ET_VENTE : les deux
 */
type VehicleMode = "LOCATION" | "VENTE" | "LOCATION_ET_VENTE";

/**
 * Page d'ajout d'un véhicule par un propriétaire
 * Permet de choisir le mode (location, vente, location et vente)
 * et affiche/masque les champs en conséquence.
 */
export function AddVehiclePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const navigatingAwayRef = useRef(false);

  // ── État du mode de commercialisation ──
  const [mode, setMode] = useState<VehicleMode>("LOCATION");

  // ── État commune / quartier dynamique ──
  const [selectedCommune, setSelectedCommune] = useState<string>("");
  const quartiers = getQuartiers(selectedCommune);

  const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500";

  // Déterminer si les champs location doivent être affichés
  const showLocationFields = mode === "LOCATION" || mode === "LOCATION_ET_VENTE";
  // Déterminer si le champ vente doit être affiché
  const showSaleFields = mode === "VENTE" || mode === "LOCATION_ET_VENTE";

  /** Vérifie si le formulaire contient des données saisies */
  const isFormDirty = useCallback(() => {
    if (!formRef.current) return false;
    const data = new FormData(formRef.current);
    for (const [key, value] of data.entries()) {
      if (key === "commune" || key === "type" || key === "condition" || key === "vehicleMode") continue; // valeurs par défaut
      if (typeof value === "string" && value.trim().length > 0) return true;
      if (value instanceof File && value.size > 0) return true;
    }
    return false;
  }, []);

  // Avertir avant de quitter la page (naviguer ailleurs, refresh, fermer l'onglet)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isFormDirty()) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isFormDirty]);

  const createVehicle = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    setIsSubmitting(true);

    // Déterminer les supports en fonction du mode
    const supportsRental = mode === "LOCATION" || mode === "LOCATION_ET_VENTE";
    const supportsSale = mode === "VENTE" || mode === "LOCATION_ET_VENTE";

    try {
      await apiFetch("/api/vehicles", {
        method: "POST",
        body: JSON.stringify({
          type: data.get("type"),
          condition: data.get("condition"),
          brand: data.get("brand"),
          model: data.get("model"),
          year: Number(data.get("year")) || undefined,
          mileageKm: data.get("mileageKm") ? Number(data.get("mileageKm")) : undefined,
          color: data.get("color") || undefined,
          seats: data.get("seats") ? Number(data.get("seats")) : undefined,
          commune: data.get("commune"),
          quartier: data.get("quartier"),
          secteur: data.get("secteur"),
          // Champs location (tarif journalier + caution)
          supportsRental,
          dailyRentalPriceGnf: supportsRental && data.get("price") ? Number(data.get("price")) : undefined,
          rentalDepositGnf: supportsRental && data.get("deposit") ? Number(data.get("deposit")) : undefined,
          // Champs vente (prix de vente)
          supportsSale,
          salePriceGnf: supportsSale && data.get("salePrice") ? Number(data.get("salePrice")) : undefined,
          descriptionFr: data.get("descriptionFr") || undefined,
          descriptionEn: data.get("descriptionEn") || undefined,
          carteGrisePresente: data.get("carteGrisePresente") === "on",
          visiteTechniqueValideJusquA: data.get("visiteTechniqueValideJusquA") || undefined,
          assuranceValideJusquA: data.get("assuranceValideJusquA") || undefined,
        }),
      });
      showToast(t("owner.vehicleForm.draftCreated"));
      navigate("/proprietaire");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("owner.vehicleForm.creationImpossible"));
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Gestion du bouton Annuler / flèche retour */
  const handleCancel = () => {
    if (isFormDirty()) {
      setShowLeaveModal(true);
    } else {
      navigatingAwayRef.current = true;
      navigate("/proprietaire");
    }
  };

  /** Intercepter le bouton retour du navigateur / gesture swipe */
  useEffect(() => {
    const onPopState = () => {
      if (navigatingAwayRef.current) return;
      if (isFormDirty()) {
        setShowLeaveModal(true);
        window.history.pushState(null, "", window.location.href);
      }
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [isFormDirty]);

  return (
    <AppShell>
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
        {/* En-tête avec flèche retour */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={handleCancel}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            ←
          </button>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 sm:text-2xl">
            {t("owner.dashboard.addVehicle")}
          </h1>
        </div>

        {error && (
          <p className="mb-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
            {error}
          </p>
        )}

        <form ref={formRef} onSubmit={createVehicle} className="space-y-4">
          {/* ── Mode de commercialisation (Location / Vente / Les deux) ── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("owner.vehicleForm.commercialMode", { defaultValue: "Mode de commercialisation" })}
            </h2>
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
              {t("owner.vehicleForm.commercialModeHelp", { defaultValue: "Choisissez si le véhicule est disponible à la location, à la vente, ou les deux." })}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMode("LOCATION")}
                className={`rounded-xl border-2 px-3 py-3 text-sm font-bold transition ${
                  mode === "LOCATION"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-300"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600"
                }`}
              >
                {t("owner.vehicleForm.modeRental", { defaultValue: "Location" })}
              </button>
              <button
                type="button"
                onClick={() => setMode("VENTE")}
                className={`rounded-xl border-2 px-3 py-3 text-sm font-bold transition ${
                  mode === "VENTE"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-300"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600"
                }`}
              >
                {t("owner.vehicleForm.modeSale", { defaultValue: "Vente" })}
              </button>
              <button
                type="button"
                onClick={() => setMode("LOCATION_ET_VENTE")}
                className={`rounded-xl border-2 px-3 py-3 text-sm font-bold transition ${
                  mode === "LOCATION_ET_VENTE"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-300"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600"
                }`}
              >
                {t("owner.vehicleForm.modeBoth", { defaultValue: "Les deux" })}
              </button>
            </div>
          </div>

          {/* Identification du véhicule */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("owner.vehicleForm.identification", { defaultValue: "Identification" })}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input required name="brand" placeholder={t("owner.vehicleForm.brand")} className={inputClass} />
              <input required name="model" placeholder={t("owner.vehicleForm.model")} className={inputClass} />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <select name="type" defaultValue="BERLINE" className={inputClass}>
                {VEHICLE_TYPES.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}
              </select>
              <select name="condition" defaultValue="OCCASION" className={inputClass}>
                {VEHICLE_CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input name="year" type="number" min="1900" placeholder={t("owner.vehicleForm.year")} className={inputClass} />
              <input name="mileageKm" type="number" min="0" placeholder={t("owner.vehicleForm.mileage")} className={inputClass} />
              <input name="seats" type="number" min="1" placeholder={t("owner.vehicleForm.seats")} className={inputClass} />
            </div>
            <div className="mt-3">
              <input name="color" placeholder={t("owner.vehicleForm.color")} className={inputClass} />
            </div>
          </div>

          {/* ── Tarification ── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("owner.vehicleForm.pricing", { defaultValue: "Tarification" })}
            </h2>

            {/* Champs location (tarif journalier + caution) — masqués si mode = VENTE */}
            {showLocationFields && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {t("owner.vehicleForm.dailyPrice")} *
                  </label>
                  <input required name="price" type="number" min="1" placeholder={t("owner.vehicleForm.dailyPrice")} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {t("owner.vehicleForm.deposit")}
                  </label>
                  <input name="deposit" type="number" min="0" placeholder={t("owner.vehicleForm.deposit")} className={inputClass} />
                </div>
              </div>
            )}

            {/* Champ vente (prix de vente) — affiché si mode = VENTE ou LOCATION_ET_VENTE */}
            {showSaleFields && (
              <div className={showLocationFields ? "mt-3" : ""}>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {t("owner.vehicleForm.salePrice", { defaultValue: "Prix de vente (GNF)" })} *
                </label>
                <input required={mode === "VENTE"} name="salePrice" type="number" min="1" placeholder={t("owner.vehicleForm.salePricePlaceholder", { defaultValue: "Prix de vente en GNF" })} className={inputClass} />
              </div>
            )}

            {/* Message si aucun champ affiché (ne devrait pas arriver) */}
            {!showLocationFields && !showSaleFields && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("owner.vehicleForm.selectModeFirst", { defaultValue: "Sélectionnez un mode de commercialisation ci-dessus." })}
              </p>
            )}
          </div>

          {/* Documents */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("owner.vehicleForm.documents")}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="flex flex-col items-start gap-1">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("owner.vehicleForm.carteGrisePresent")}</span>
                <input type="checkbox" name="carteGrisePresente" className="h-4 w-4 rounded border-slate-300" />
              </label>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {t("owner.vehicleForm.visiteTechniqueValidUntil")}
                <input type="date" name="visiteTechniqueValideJusquA" className="mt-1 block w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" style={{ colorScheme: "dark" }} />
              </label>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {t("owner.vehicleForm.assuranceValidUntil")}
                <input type="date" name="assuranceValideJusquA" className="mt-1 block w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" style={{ colorScheme: "dark" }} />
              </label>
            </div>
          </div>

          {/* Localisation */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("owner.vehicleForm.location", { defaultValue: "Localisation" })}
            </h2>
            <select
              name="commune"
              value={selectedCommune}
              onChange={(e) => setSelectedCommune(e.target.value)}
              className={inputClass}
            >
              <option value="">{t("owner.vehicleForm.commune", { defaultValue: "Commune" })}</option>
              {COMMUNES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <select name="quartier" className={inputClass}>
                <option value="">{t("owner.vehicleForm.quartier")}</option>
                {quartiers.map((q) => <option key={q} value={q}>{q}</option>)}
              </select>
              <input required name="secteur" placeholder={t("owner.vehicleForm.secteur")} autoComplete="off" className={inputClass} />
            </div>
          </div>

          {/* Descriptions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("owner.vehicleForm.descriptions", { defaultValue: "Descriptions" })}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <textarea name="descriptionFr" placeholder={t("owner.vehicleForm.descriptionFr")} rows={3} className={inputClass} />
                <TranslateFieldButton sourceFieldName="descriptionFr" targetFieldName="descriptionEn" targetLang="en" />
              </div>
              <div>
                <textarea name="descriptionEn" placeholder={t("owner.vehicleForm.descriptionEn")} rows={3} className={inputClass} />
                <TranslateFieldButton sourceFieldName="descriptionEn" targetFieldName="descriptionFr" targetLang="fr" />
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {isSubmitting ? t("common.loading") : t("owner.vehicleForm.createVehicle")}
            </button>
          </div>
        </form>
      </main>

      {/* ── Modale de confirmation avant de quitter ── */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
              {t("owner.addVehicle.unsavedTitle", { defaultValue: "Données non enregistrées" })}
            </h3>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              {t("owner.addVehicle.unsavedMessage", { defaultValue: "Vous avez commencé à remplir le formulaire. Si vous quittez maintenant, les données saisies seront perdues." })}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {t("owner.addVehicle.continueFilling", { defaultValue: "Continuer la saisie" })}
              </button>
              <button
                onClick={() => {
                  navigatingAwayRef.current = true;
                  setShowLeaveModal(false);
                  navigate("/proprietaire");
                }}
                className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white hover:bg-rose-700"
              >
                {t("owner.addVehicle.quitAnyway", { defaultValue: "Quitter" })}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
