import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";
import { detectLanguage } from "../lib/detectLanguage";

type TranslateResponse = {
  status: string;
  data: {
    translatedText: string;
    detectedSourceLang: string;
    targetLang: string;
    fromCache: boolean;
  };
};

type Props = {
  /** Name attribute du textarea source à lire */
  sourceFieldName: string;
  /** Name attribute du textarea cible à remplir */
  targetFieldName: string;
  /** Langue cible de la traduction */
  targetLang: "fr" | "en";
  className?: string;
};

/**
 * Bouton de traduction pour un champ de formulaire (textarea).
 *
 * - Détecte la langue du texte saisi dans le champ source
 * - Affiche "Traduire en anglais" si la cible est EN, "Traduire en français" si FR
 * - Active/désactive selon que le texte est détecté dans la bonne langue
 * - Appelle l'API de traduction et remplit le champ cible
 */
export function TranslateFieldButton({
  sourceFieldName,
  targetFieldName,
  targetLang,
  className,
}: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [detectedLang, setDetectedLang] = useState<"fr" | "en" | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Détecter la langue du champ source en temps réel (polling toutes les 800ms)
  useEffect(() => {
    const detect = () => {
      const form = document.querySelector("form");
      if (!form) return;
      const field = form.querySelector(`[name=${sourceFieldName}]`) as HTMLTextAreaElement | HTMLInputElement | null;
      if (!field || !field.value.trim()) {
        setDetectedLang(null);
        return;
      }
      setDetectedLang(detectLanguage(field.value));
    };

    detect();
    intervalRef.current = setInterval(detect, 800);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sourceFieldName]);

  const handleTranslate = useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
    const form = (e.currentTarget as HTMLElement).closest("form");
    if (!form) return;
    const field = form.querySelector(`[name=${sourceFieldName}]`) as HTMLTextAreaElement | HTMLInputElement | null;
    if (!field || !field.value.trim()) return;

    setLoading(true);
    try {
      const res = await apiFetch<TranslateResponse>("/api/translate-message", {
        method: "POST",
        body: JSON.stringify({ text: field.value, targetLang, sourceLang: "auto" }),
      });
      const targetField = form.querySelector(`[name=${targetFieldName}]`) as HTMLTextAreaElement | HTMLInputElement | null;
      if (targetField && "value" in targetField) {
        targetField.value = res.data.translatedText;
      }
    } catch {
      // Erreur silencieuse (comportement existant)
    } finally {
      setLoading(false);
    }
  }, [sourceFieldName, targetFieldName, targetLang]);

  // Le bouton est désactivé si le champ source contient déjà du texte dans la langue cible
  const isSourceSameAsTarget = detectedLang === targetLang;

  const label = targetLang === "en"
    ? t("owner.translateToEn", "🔄 Traduire en anglais")
    : t("owner.translateToFr", "🔄 Traduire en français");

  const tooltip = targetLang === "en"
    ? t("owner.translateToEnTooltip", "Traduire ce texte en anglais")
    : t("owner.translateToFrTooltip", "Traduire ce texte en français");

  return (
    <button
      type="button"
      onClick={handleTranslate}
      disabled={loading || !detectedLang || isSourceSameAsTarget}
      className={`mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 disabled:opacity-50 ${className ?? ""}`}
      title={isSourceSameAsTarget ? undefined : tooltip}
    >
      {loading ? (
        <span className="inline-block h-3 w-3 animate-spin rounded-full border border-emerald-300 border-t-emerald-600" />
      ) : undefined}
      {" "}
      {label}
    </button>
  );
}
