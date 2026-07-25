import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Scales are theme-independent.
export const typography = { xs: 11, sm: 13, base: 15, lg: 17, xl: 20, xxl: 26, xxxl: 36 };
export const radius     = { sm: 8, md: 12, lg: 16, xl: 20, full: 999 };
export const spacing    = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };

// Semantic colors are shared across all themes.
const semantic = {
  green: '#22c55e', greenBg: '#22c55e15',
  yellow: '#f59e0b', yellowBg: '#f59e0b15',
  red: '#ef4444', redBg: '#ef444415',
};

// ── Palettes ──────────────────────────────────────────────────────────────────
const noche = {
  bg: '#0f1117', shell: '#12161f', surface: '#171c2a', surfaceHigh: '#1e2535',
  border: '#232839', borderMed: '#2a3045', hover: '#1e2535',
  text: '#e2e8f0', text2: '#c4cfe3', text3: '#8a97b0', text4: '#546078',
  accent: '#7c3aed', accentBg: '#7c3aed20', accentText: '#a78bfa',
  cyan: '#06b6d4', cyanBg: '#06b6d415', ...semantic,
};
const dia = {
  bg: '#f0f4f8', shell: '#ffffff', surface: '#ffffff', surfaceHigh: '#f1f5f9',
  border: '#e2e8f0', borderMed: '#cbd5e1', hover: '#eef2f7',
  text: '#0f172a', text2: '#334155', text3: '#64748b', text4: '#94a3b8',
  accent: '#7c3aed', accentBg: '#7c3aed18', accentText: '#6d28d9',
  cyan: '#0891b2', cyanBg: '#0891b214', ...semantic,
};
const medianoche = {
  bg: '#000000', shell: '#0a0a0c', surface: '#111114', surfaceHigh: '#1a1a1f',
  border: '#222226', borderMed: '#2c2c33', hover: '#161619',
  text: '#f4f5f7', text2: '#c7cbd4', text3: '#8b8f9a', text4: '#565a63',
  accent: '#8b5cf6', accentBg: '#8b5cf622', accentText: '#c4b5fd',
  cyan: '#22d3ee', cyanBg: '#22d3ee18', ...semantic,
};
const oceano = {
  bg: '#061620', shell: '#08202e', surface: '#0a2a3a', surfaceHigh: '#103648',
  border: '#163b4f', borderMed: '#1e4a60', hover: '#0e3143',
  text: '#e6f6fb', text2: '#a9d5e4', text3: '#6f9cad', text4: '#4a6c7a',
  accent: '#22d3ee', accentBg: '#22d3ee22', accentText: '#67e8f9',
  cyan: '#38bdf8', cyanBg: '#38bdf818', ...semantic,
};
const ambar = {
  bg: '#1a1410', shell: '#211a13', surface: '#2a2017', surfaceHigh: '#352a1e',
  border: '#3a2e20', borderMed: '#4a3a28', hover: '#2f251a',
  text: '#f5ecd9', text2: '#d8c6a6', text3: '#a08a68', text4: '#6e5f45',
  accent: '#f59e0b', accentBg: '#f59e0b22', accentText: '#fcd34d',
  cyan: '#fbbf24', cyanBg: '#fbbf2418', ...semantic,
};
const pergamino = {
  bg: '#f2e9d8', shell: '#faf4e8', surface: '#fdf8ee', surfaceHigh: '#f0e6d2',
  border: '#e2d5bd', borderMed: '#cbb992', hover: '#efe4cf',
  text: '#3a2f1e', text2: '#6b5a3e', text3: '#97835f', text4: '#b3a687',
  accent: '#b45309', accentBg: '#b4530918', accentText: '#9a3412',
  cyan: '#0e7490', cyanBg: '#0e749014', ...semantic,
};

export const palettes = { noche, dia, medianoche, oceano, ambar, pergamino };

// `light` themes get dark status-bar / text-on-light chrome.
export const LIGHT_THEMES = new Set(['dia', 'pergamino']);

export const THEMES = [
  { key: 'noche',      label: 'Noche',      swatch: ['#12161f', '#7c3aed'] },
  { key: 'dia',        label: 'Día',        swatch: ['#ffffff', '#7c3aed'] },
  { key: 'medianoche', label: 'Medianoche', swatch: ['#0a0a0c', '#8b5cf6'] },
  { key: 'oceano',     label: 'Océano',     swatch: ['#08202e', '#22d3ee'] },
  { key: 'ambar',      label: 'Ámbar',      swatch: ['#211a13', '#f59e0b'] },
  { key: 'pergamino',  label: 'Pergamino',  swatch: ['#faf4e8', '#b45309'] },
];

const STORAGE_KEY = 'viernes_theme';
const LEGACY = { dark: 'noche', light: 'dia' };

// Back-compat: static default palette for any module-scope import.
export const colors = noche;

// ── Context ────────────────────────────────────────────────────────────────────
const ThemeContext = createContext({ colors: noche, theme: 'noche', setTheme: () => {}, themes: THEMES });

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('noche');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      const key = palettes[v] ? v : LEGACY[v];
      if (key && palettes[key]) setThemeState(key);
    }).catch(() => {});
  }, []);

  const setTheme = (key) => {
    if (!palettes[key]) return;
    setThemeState(key);
    AsyncStorage.setItem(STORAGE_KEY, key).catch(() => {});
  };

  const value = useMemo(
    () => ({ colors: palettes[theme] || noche, theme, setTheme, themes: THEMES, isLight: LIGHT_THEMES.has(theme) }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

// Memoized per-theme StyleSheet: pass a (colors) => StyleSheet.create({...}) factory.
export function useStyles(factory) {
  const { colors: c } = useContext(ThemeContext);
  return useMemo(() => factory(c), [factory, c]);
}
