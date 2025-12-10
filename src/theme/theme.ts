// Simple theme manager for System/Light/Dark support

type ThemeMode = 'system' | 'light' | 'dark';

const THEME_KEY = 'theme';
let mediaQuery: MediaQueryList | null = null;
let currentMode: ThemeMode = 'system';

function applyDarkClass(isDark: boolean) {
  const docEl = document.documentElement;
  const body = document.body;
  // Ionic dark palette uses the `ion-palette-dark` class from dark.class.css
  if (isDark) {
    docEl.classList.add('ion-palette-dark');
    body.classList.add('dark'); // keep for our variables.css overrides
  } else {
    docEl.classList.remove('ion-palette-dark');
    body.classList.remove('dark');
  }
}

function computeShouldDark(mode: ThemeMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  // system
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function setTheme(mode: ThemeMode) {
  currentMode = mode;
  localStorage.setItem(THEME_KEY, mode);

  // Remove previous listener if switching away from system
  mediaQuery?.removeEventListener?.('change', handleSystemChange);
  mediaQuery = null;

  if (mode === 'system') {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleSystemChange);
  }

  applyDarkClass(computeShouldDark(mode));
}

function handleSystemChange() {
  applyDarkClass(computeShouldDark('system'));
}

export function getTheme(): ThemeMode {
  return currentMode;
}

export function initTheme() {
  const stored = (localStorage.getItem(THEME_KEY) as ThemeMode | null) || 'system';
  currentMode = stored;
  setTheme(stored);
}
