import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";

// ── Cache en mémoire ─────────────────────────────────────────────────────────
interface CacheEntry {
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  expiresAt: number;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const translationCache = new Map<string, CacheEntry>();

function cacheKey(text: string, targetLang: string): string {
  return `${targetLang}::${text}`;
}

function getFromCache(text: string, targetLang: string): CacheEntry | null {
  const entry = translationCache.get(cacheKey(text, targetLang));
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    translationCache.delete(cacheKey(text, targetLang));
    return null;
  }
  return entry;
}

function setInCache(text: string, targetLang: string, sourceLang: string, translatedText: string) {
  translationCache.set(cacheKey(text, targetLang), {
    translatedText,
    sourceLang,
    targetLang,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

// Nettoyage toutes les 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of translationCache) {
    if (now > entry.expiresAt) translationCache.delete(key);
  }
}, 10 * 60 * 1000);

// ── Types ────────────────────────────────────────────────────────────────────
export type TranslateResult = {
  translatedText: string;
  detectedSourceLang: string;
  targetLang: string;
  fromCache: boolean;
};

// ── Langues supportées ───────────────────────────────────────────────────────
const SUPPORTED_LANGS = new Set([
  "auto", "en", "fr", "es", "de", "it", "pt", "ru", "zh", "ja",
  "ko", "ar", "nl", "pl", "tr", "vi", "th", "uk", "el", "he",
  "hi", "hu", "cs", "da", "fi", "sv", "no", "bg", "ro", "id",
]);

// ── Helpers ─────────────────────────────────────────────────────────────────

function prepareForDetection(text: string): string {
  if (text === text.toUpperCase() && text.length > 2) {
    return text.toLowerCase();
  }
  return text;
}

// ── Appel à LibreTranslate ───────────────────────────────────────────────────

async function callLibreTranslate(
  text: string,
  targetLang: string,
  sourceLang: string,
): Promise<{ translatedText: string; detectedLang: string; confidence: number }> {
  const baseUrl = env.LIBRETRANSLATE_URL.replace(/\/+$/, "");
  const body: Record<string, string> = {
    q: text,
    source: sourceLang,
    target: targetLang,
    format: "text",
  };
  if (env.LIBRETRANSLATE_API_KEY) {
    body.api_key = env.LIBRETRANSLATE_API_KEY;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch(`${baseUrl}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      throw new Error(`LibreTranslate ${response.status}: ${errBody || response.statusText}`);
    }

    const data = (await response.json()) as {
      translatedText: string;
      detectedLanguage?: { confidence: number; language: { iso: string } };
    };

    return {
      translatedText: data.translatedText,
      detectedLang: data.detectedLanguage?.language?.iso ?? sourceLang,
      confidence: data.detectedLanguage?.confidence ?? 0,
    };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Timeout traduction (5s).");
    }
    throw error;
  }
}

/**
 * Traduit un texte via LibreTranslate.
 *
 * Le frontend gère la logique bidirectionnelle :
 * - Il essaie d'abord targetLang="fr" → si le texte est en anglais, ça traduit EN→FR
 * - Si le résultat = texte source, il essaie targetLang="en" → FR→EN
 *
 * Le backend fait juste la traduction demandée avec un retry si détection douteuse.
 */
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang: string = "auto",
): Promise<TranslateResult> {
  if (!env.TRANSLATION_ENABLED) {
    throw new Error("La fonctionnalité de traduction est désactivée.");
  }

  if (!SUPPORTED_LANGS.has(targetLang)) {
    throw new Error(`Langue cible "${targetLang}" non supportée.`);
  }

  if (!text.trim()) {
    return { translatedText: text, detectedSourceLang: sourceLang, targetLang, fromCache: false };
  }

  // Vérifier le cache — ignorer les entrées « noop » (texte identique au source)
  const cached = getFromCache(text, targetLang);
  if (cached) {
    const cachedIsNoop = cached.translatedText.trim().toLowerCase() === text.trim().toLowerCase();
    if (!cachedIsNoop) {
      return {
        translatedText: cached.translatedText,
        detectedSourceLang: cached.sourceLang,
        targetLang: cached.targetLang,
        fromCache: true,
      };
    }
    // Cache contient un noop → le supprimer et refaire la traduction
    translationCache.delete(cacheKey(text, targetLang));
  }

  const textForDetection = prepareForDetection(text);

  // Appel principal avec détection auto
  let result = await callLibreTranslate(textForDetection, targetLang, "auto");

  // Si la langue détectée est la même que la cible → le texte est déjà dans
  // la langue cible. On force la langue source opposée pour traduire.
  const OPPOSITE: Record<string, string> = { fr: "en", en: "fr", es: "en", de: "en" };
  if (result.detectedLang === targetLang) {
    const forcedSource = OPPOSITE[targetLang] ?? "en";
    logger.debug({ detected: result.detectedLang, target: targetLang, forcedSource }, "[translate] Retry avec source forcée");
    result = await callLibreTranslate(textForDetection, targetLang, forcedSource);
  }

  // Si le résultat est identique au source → mauvaise détection, retry
  if (result.translatedText.trim().toLowerCase() === textForDetection.trim().toLowerCase()) {
    const forcedSource = result.detectedLang === "en" ? "fr" : "en";
    logger.debug({ forcedSource, target: targetLang }, "[translate] noop (result = source). Retry");
    result = await callLibreTranslate(textForDetection, targetLang, forcedSource);
  }

  // Ne pas mettre en cache si le résultat est identique au source (noop)
  const isNoop = result.translatedText.trim().toLowerCase() === textForDetection.trim().toLowerCase();
  if (!isNoop) {
    setInCache(text, targetLang, result.detectedLang, result.translatedText);
  }

  return {
    translatedText: result.translatedText,
    detectedSourceLang: result.detectedLang,
    targetLang,
    fromCache: false,
  };
}
