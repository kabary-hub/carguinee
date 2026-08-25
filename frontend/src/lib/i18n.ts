import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import fr from "../../public/locales/fr/translation.json";
import en from "../../public/locales/en/translation.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    fallbackLng: "fr",
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage"],
      caches: ["localStorage"],
      key: "preferredLanguage",
    },
  });

// Si aucune langue n'est sauvegardée, forcer le français par défaut
const saved = localStorage.getItem("preferredLanguage");
if (!saved) {
  i18n.changeLanguage("fr");
  localStorage.setItem("preferredLanguage", "fr");
}

// Mettre à jour la balise <html lang> à chaque changement de langue
i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng.startsWith("en") ? "en" : "fr";
});

// Initialiser avec la langue courante
document.documentElement.lang = i18n.language?.startsWith("en") ? "en" : "fr";

export default i18n;
