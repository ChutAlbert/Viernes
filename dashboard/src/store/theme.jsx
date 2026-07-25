import { createContext, useContext, useEffect, useState } from "react";

// Theme registry. `swatch` = [background, accent] for the picker preview.
export const THEMES = [
  { key: "noche",      label: "Noche",      swatch: ["#0b1120", "#7c3aed"] },
  { key: "dia",        label: "Día",        swatch: ["#ffffff", "#7c3aed"] },
  { key: "medianoche", label: "Medianoche", swatch: ["#060608", "#8b5cf6"] },
  { key: "oceano",     label: "Océano",     swatch: ["#08202e", "#22d3ee"] },
  { key: "ambar",      label: "Ámbar",      swatch: ["#211a13", "#f59e0b"] },
  { key: "pergamino",  label: "Pergamino",  swatch: ["#faf4e8", "#b45309"] },
];

const VALID = new Set(THEMES.map((t) => t.key));
const LEGACY = { dark: "noche", light: "dia" };

function readInitial() {
  const stored = localStorage.getItem("viernes_theme");
  if (stored && VALID.has(stored)) return stored;
  if (stored && LEGACY[stored]) return LEGACY[stored];
  return "noche";
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readInitial);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("viernes_theme", theme);
  }, [theme]);

  const setTheme = (key) => VALID.has(key) && setThemeState(key);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: "noche", setTheme: () => {}, themes: THEMES };
  return ctx;
}
