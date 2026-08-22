import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";
import { detectLanguage } from "../lib/detectLanguage";

// ── Mapping langue → nom d'affichage ────────────────────────────────────────
const LANG_NAMES: Record<string, string> = {
  fr: "Français",
  en: "English",
};

function langName(code: string): string {
  return LANG_NAMES[code] ?? code.toUpperCase();
}

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
  text: string;
  className?: string;
};

/**
 * Bouton "Traduire" pour un message individuel.
 *
 * Logique :
 * - L'heuristique détermine la langue source (jamais écrasée par le backend)
 * - Si FR → tente traduire vers EN ; si EN → tente traduire vers FR
 * - L'affichage source→target utilise toujours l'heuristique
 */
export function TranslateButton({ text, className }: Props) {
  const { t } = useTranslation();
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [actualTargetLang, setActualTargetLang] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);

  // Détection heuristique = source de vérité pour la langue du message
  const detectedLang = useMemo(() => detectLanguage(text), [text]);

  const isNoop = (a: string, b: string) =>
    a.trim().toLowerCase() === b.trim().toLowerCase();

  const doTranslate = useCallback(async () => {
    // Si déjà traduit, toggle l'affichage
    if (translatedText !== null) {
      setShowTranslation((prev) => !prev);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Déterminer la langue cible selon l'heuristique
      const targetLang = detectedLang === "fr" ? "en" : "fr";

      const res = await apiFetch<TranslateResponse>("/api/translate-message", {
        method: "POST",
        body: JSON.stringify({ text, targetLang, sourceLang: "auto" }),
      });

      const result = res.data.translatedText;

      if (!isNoop(result, text)) {
        setTranslatedText(result);
        setActualTargetLang(targetLang);
        setShowTranslation(true);
      } else {
        // Le résultat est identique au source → pas de traduction possible
        setError(t("messages.translationUnavailable", "Traduction non disponible."));
        setTimeout(() => setError(null), 4000);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur de traduction.";
      setError(msg);
      setTimeout(() => setError(null), 4000);
    } finally {
      setLoading(false);
    }
  }, [text, translatedText, detectedLang, t]);

  return (
    <div className={className}>
      <button
        onClick={doTranslate}
        disabled={loading}
        type="button"
        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 transition hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-50"
        title={showTranslation
          ? t("messages.hideTranslation", "Masquer")
          : detectedLang === "fr"
            ? t("messages.translateTooltipEn", "Traduire en anglais")
            : t("messages.translateTooltip", "Traduire en français")
        }
      >
        {loading ? (
          <span className="inline-block h-3 w-3 animate-spin rounded-full border border-slate-300 border-t-emerald-600" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5"
          >
            <path
              fillRule="evenodd"
              d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V3.56A7.003 7.003 0 0 0 3.1 8.07a.75.75 0 0 1-1.04.96A8.503 8.503 0 0 1 10 1.5a.75.75 0 0 1 .75.75ZM10 16a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75ZM4.22 12.22a.75.75 0 0 1 1.06-.04A6.504 6.504 0 0 0 10 15.5a6.504 6.504 0 0 0 4.72-3.32.75.75 0 1 1 1.26.82A8.004 8.004 0 0 1 10 17a8.004 8.004 0 0 1-5.78-2.96.75.75 0 0 1-.04-1.06ZM13.5 10a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5V10Z"
              clipRule="evenodd"
            />
          </svg>
        )}
        <span>
          {loading
            ? t("messages.translating", "Traduction…")
            : showTranslation
              ? t("messages.hideTranslation", "Masquer")
              : detectedLang === "fr"
                ? t("messages.translateToEn", "Translate")
                : t("messages.translate", "Traduire")}
        </span>
      </button>

      {error && (
        <p className="mt-1 text-[11px] text-red-500 dark:text-red-400">{error}</p>
      )}

      {showTranslation && translatedText && (
        <div
          className="mt-1.5 overflow-hidden rounded-lg border border-dashed border-emerald-300 bg-emerald-50/60 px-3 py-2 dark:border-emerald-700 dark:bg-emerald-500/10"
          style={{ animation: "slideDown 0.25s ease-out" }}
        >
          {actualTargetLang && (
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              {langName(detectedLang)} → {langName(actualTargetLang)}
            </p>
          )}
          <p className="text-xs leading-relaxed text-emerald-800 dark:text-emerald-300">
            {translatedText}
          </p>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; max-height: 0; transform: translateY(-4px); }
          to { opacity: 1; max-height: 200px; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
