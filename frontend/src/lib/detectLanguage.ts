// ── Détection heuristic de la langue ───────────────────────────────────────
// Caractères accentués français courants
const FRENCH_ACCENTS_RE = /[àâéèêëîïôùûüçœæÀÂÉÈÊËÎÏÔÙÛÜÇŒÆ]/;
// Mots-outils et verbes essentiels français (sans accent pour gérer les majuscules)
const FRENCH_WORDS_RE = /\b(le|la|les|un|une|des|est|sont|avec|pour|dans|pas|que|qui|je|tu|il|elle|nous|vous|ils|ont|mais|aussi|bien|cette|ce|mon|ma|mes|ton|ta|tes|son|sa|ses|de|du|au|aux|en|sur|par|ne|se|y|me|te|tout|plus|ici|meme|comme|encore|fait|rien|temps|vie|oui|merci|salut|bonjour|tres|peut|faire|aller|dire|venir|voir|croire|vouloir|pouvoir|devoir|jamais|toujours|comment|pourquoi|parce|maintenant|avant|apres|entre|faut)\b/;

export function detectLanguage(text: string): "fr" | "en" {
  // Si on trouve des caractères accentués → très probablement français
  if (FRENCH_ACCENTS_RE.test(text)) return "fr";
  // On travaille en minuscule pour la détection de mots
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  let frenchCount = 0;
  let totalWords = 0;
  for (const word of words) {
    const clean = word.replace(/[^a-zàâéèêëîïôùûüçœæ]/g, "");
    if (!clean) continue;
    totalWords++;
    if (FRENCH_WORDS_RE.test(clean)) frenchCount++;
  }
  // Si plus de 30% des mots sont français courants → français
  if (totalWords > 0 && frenchCount / totalWords >= 0.3) return "fr";
  return "en";
}
