export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export const ACCENTS = [
  "amber",
  "blue",
  "pink",
  "rose",
  "emerald",
  "black",
] as const;
export type Accent = (typeof ACCENTS)[number];

export const DEFAULT_THEME: Theme = "light";
export const DEFAULT_ACCENT: Accent = "black";

export const THEME_STORAGE_KEY = "pyramid.theme";
export const ACCENT_STORAGE_KEY = "pyramid.accent";

export const ACCENT_SWATCH: Record<Accent, string | null> = {
  amber: "oklch(0.666 0.179 58.318)",
  blue: "oklch(0.546 0.245 262.881)",
  pink: "oklch(0.592 0.249 0.584)",
  rose: "oklch(0.586 0.253 17.585)",
  emerald: "oklch(0.596 0.145 163.225)",
  black: null,
};

export const ACCENT_LABEL: Record<Accent, string> = {
  amber: "Amber",
  blue: "Blue",
  pink: "Pink",
  rose: "Rose",
  emerald: "Emerald",
  black: "Black",
};

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

export function isAccent(value: unknown): value is Accent {
  return typeof value === "string" && (ACCENTS as readonly string[]).includes(value);
}

export function themeInitScript() {
  return `(function(){try{
var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
var a=localStorage.getItem(${JSON.stringify(ACCENT_STORAGE_KEY)});
var themes=${JSON.stringify(THEMES)};
var accents=${JSON.stringify(ACCENTS)};
if(themes.indexOf(t)===-1)t=${JSON.stringify(DEFAULT_THEME)};
if(accents.indexOf(a)===-1)a=${JSON.stringify(DEFAULT_ACCENT)};
var e=document.documentElement;
e.classList.toggle("dark",t==="dark");
e.dataset.accent=a;
e.style.colorScheme=t;
}catch(_){}})();`;
}
