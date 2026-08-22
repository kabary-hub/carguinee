import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const THEME_KEY = "carguinee_theme";
const THEME_TRANSITION_MS = 300;

type ThemeContextValue = {
  isDark: boolean;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem(THEME_KEY) === "dark"
        : false;
    // Applique la classe avant le premier rendu pour éviter tout flash clair.
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", stored);
    }
    return stored;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    window.localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  const value = useMemo(
    () => ({
      isDark,
      toggle: () => {
        // Anime la bascule : la classe .theme-switching reste posée le temps
        // de la transition définie dans index.css.
        const root = document.documentElement;
        root.classList.add("theme-switching");
        setIsDark((current) => !current);
        window.setTimeout(
          () => root.classList.remove("theme-switching"),
          THEME_TRANSITION_MS + 50,
        );
      },
    }),
    [isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme doit être utilisé dans ThemeProvider.");
  }

  return context;
}
