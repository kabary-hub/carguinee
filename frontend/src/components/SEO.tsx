import { useEffect } from "react";

/**
 * Composant SEO — Gère les balises meta du document
 * Utilise directement le DOM pour éviter une dépendance externe
 */

interface SEOProps {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
}

const DEFAULT_TITLE = "CarGuinée — Location et vente de véhicules à Conakry";
const DEFAULT_DESCRIPTION = "Trouvez, louez ou vendez un véhicule à Conakry, Guinée. Plateforme de mobilité sécurisée pour particuliers et professionnels.";
const DEFAULT_TITLE_EN = "CarGuinée — Vehicle rental and sales in Conakry";
const DEFAULT_DESCRIPTION_EN = "Find, rent or buy a vehicle in Conakry, Guinea. Secure mobility platform for individuals and professionals.";
const DEFAULT_URL = "https://carguinee.com";
const DEFAULT_IMAGE = "https://carguinee.com/og-image.png";

import { useTranslation } from "react-i18next";

export function SEO({ title, description, url, image }: SEOProps = {}) {
  const { i18n } = useTranslation();
  useEffect(() => {
    const isEn = i18n.language?.startsWith("en");
    const fullTitle = title ? `${title} | CarGuinée` : (isEn ? DEFAULT_TITLE_EN : DEFAULT_TITLE);
    const metaDescription = description || (isEn ? DEFAULT_DESCRIPTION_EN : DEFAULT_DESCRIPTION);
    const metaUrl = url || DEFAULT_URL;
    const metaImage = image || DEFAULT_IMAGE;

    // Mettre à jour le titre
    document.title = fullTitle;

    // Mettre à jour ou créer les balises meta
    setMetaTag("description", metaDescription);
    setMetaTag("og:title", fullTitle, "property");
    setMetaTag("og:description", metaDescription, "property");
    setMetaTag("og:url", metaUrl, "property");
    setMetaTag("og:image", metaImage, "property");
    setMetaTag("og:type", "website", "property");
    setMetaTag("og:site_name", "CarGuinée", "property");
    setMetaTag("twitter:card", "summary_large_image", "name");
    setMetaTag("twitter:title", fullTitle, "name");
    setMetaTag("twitter:description", metaDescription, "name");
    setMetaTag("robots", "index, follow", "name");

    // Canonical link
    let canonical = document.querySelector("link[rel=\"canonical\"]") as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = metaUrl;
  }, [title, description, url, image]);

  return null;
}

/**
 * Définit ou met à jour une balise meta dans le <head>
 */
function setMetaTag(
  name: string,
  content: string,
  attribute: "name" | "property" = "name",
) {
  let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}
