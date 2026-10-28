export type Theme = "light" | "dark";
const KEY = "ritmo-theme";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return localStorage.getItem(KEY) === "dark" ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  localStorage.setItem(KEY, theme);
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/** Inline script run before paint so the saved theme doesn't flash. */
export const themeInitScript = `try{if(localStorage.getItem('${KEY}')==='dark')document.documentElement.classList.add('dark')}catch(e){}`;
