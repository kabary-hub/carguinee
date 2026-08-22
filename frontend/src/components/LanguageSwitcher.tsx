import { useTranslation } from "react-i18next";

interface LanguageSwitcherProps {
  className?: string;
}

function FlagFrance({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 640 480"
      className={className}
      aria-hidden="true"
    >
      <g fillRule="evenodd" strokeWidth="1pt">
        <path fill="#002395" d="M0 0h213.3v480H0z" />
        <path fill="#fff" d="M213.3 0h213.4v480H213.3z" />
        <path fill="#ED2939" d="M426.7 0H640v480H426.7z" />
      </g>
    </svg>
  );
}

function FlagEngland({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 600 400"
      className={className}
      aria-hidden="true"
    >
      <rect width="600" height="400" fill="#fff" />
      <rect x="250" width="100" height="400" fill="#CE1124" />
      <rect y="150" width="600" height="100" fill="#CE1124" />
    </svg>
  );
}

export function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  const isFrench = i18n.language?.startsWith("fr");

  const toggleLanguage = () => {
    const nextLang = isFrench ? "en" : "fr";
    i18n.changeLanguage(nextLang);
    localStorage.setItem("preferredLanguage", nextLang);
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={isFrench ? "Switch to English" : "Passer en français"}
      title={isFrench ? "English" : "Français"}
      className={`flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 ${className}`}
    >
      {isFrench ? (
        <>
          <FlagFrance className="h-[16px] w-[22px] rounded-[2px] shadow-sm" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">FR</span>
        </>
      ) : (
        <>
          <FlagEngland className="h-[16px] w-[22px] rounded-[2px] shadow-sm" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">EN</span>
        </>
      )}
    </button>
  );
}
