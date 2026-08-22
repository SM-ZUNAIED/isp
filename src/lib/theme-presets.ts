/** Global appearance / theme configuration shared by every panel. */

export type ThemeColors = {
  primary?: string;
  accent?: string;
  background?: string;
  foreground?: string;
  card?: string;
  muted?: string;
  border?: string;
};

export type ThemeConfig = {
  preset?: string;
  light?: ThemeColors;
  dark?: ThemeColors;
  radius?: number; // rem
  buttonRadius?: number; // rem
  buttonStyle?: "solid" | "gradient" | "outline";
  fontFamily?: string;
  containerWidth?: number; // px
};

export type ThemePreset = {
  id: string;
  name: string;
  emoji: string;
  light: Required<Pick<ThemeColors, "primary" | "accent" | "background" | "foreground" | "card" | "muted" | "border">>;
  dark: Required<Pick<ThemeColors, "primary" | "accent" | "background" | "foreground" | "card" | "muted" | "border">>;
};

export const FONT_OPTIONS = [
  { id: "Anek Bangla", label: "Anek Bangla (default)" },
  { id: "Hind Siliguri", label: "Hind Siliguri" },
  { id: "Noto Sans Bengali", label: "Noto Sans Bengali" },
  { id: "Inter", label: "Inter" },
  { id: "Poppins", label: "Poppins" },
];

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "emerald",
    name: "Emerald (Default)",
    emoji: "🌿",
    light: { primary: "#159A5C", accent: "#E8A33D", background: "#FBFEFC", foreground: "#141C2B", card: "#FFFFFF", muted: "#EEF3F6", border: "#DDE5EA" },
    dark: { primary: "#2FD68A", accent: "#F2B650", background: "#0F1421", foreground: "#F3F6FA", card: "#182030", muted: "#1F2839", border: "#2A3547" },
  },
  {
    id: "warm-earth",
    name: "Warm Earth",
    emoji: "🌾",
    light: { primary: "#8A6B2F", accent: "#C09A5B", background: "#FFFDF7", foreground: "#241C10", card: "#FFFBF2", muted: "#F2EBDD", border: "#E3D8C2" },
    dark: { primary: "#D7B269", accent: "#B08B45", background: "#171208", foreground: "#F7F1E4", card: "#211A0E", muted: "#2C2416", border: "#3B3121" },
  },
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    emoji: "🌊",
    light: { primary: "#1F73D8", accent: "#4FA8F5", background: "#F7FBFF", foreground: "#10203A", card: "#FFFFFF", muted: "#E7F0FA", border: "#D2E1F2" },
    dark: { primary: "#5AA9FF", accent: "#2F7BD6", background: "#0B1626", foreground: "#EAF3FF", card: "#122034", muted: "#1A2B45", border: "#25395A" },
  },
  {
    id: "forest",
    name: "Forest",
    emoji: "🌲",
    light: { primary: "#1E7A4B", accent: "#57C08A", background: "#F8FDF9", foreground: "#0F2318", card: "#FFFFFF", muted: "#E6F3EB", border: "#D0E6DA" },
    dark: { primary: "#4FD394", accent: "#2C8C5C", background: "#0B1710", foreground: "#E9F8EF", card: "#12241A", muted: "#1A3125", border: "#264534" },
  },
  {
    id: "sunset",
    name: "Sunset",
    emoji: "🌇",
    light: { primary: "#D45B2C", accent: "#E8854A", background: "#FFFAF7", foreground: "#2D1810", card: "#FFF3ED", muted: "#F7E7DE", border: "#EBD3C6" },
    dark: { primary: "#F0794A", accent: "#C25226", background: "#1B0F0A", foreground: "#FDEDE4", card: "#261610", muted: "#332017", border: "#452C20" },
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    emoji: "👑",
    light: { primary: "#6D3BD1", accent: "#A177EE", background: "#FCFAFF", foreground: "#1D1330", card: "#FFFFFF", muted: "#EFE9FB", border: "#DFD5F4" },
    dark: { primary: "#A984F7", accent: "#7A4FD6", background: "#130E20", foreground: "#F1EBFF", card: "#1C1530", muted: "#261D40", border: "#352A55" },
  },
  {
    id: "rose-gold",
    name: "Rose Gold",
    emoji: "🌸",
    light: { primary: "#C06A80", accent: "#E4A0B2", background: "#FFFAFB", foreground: "#2B141B", card: "#FFF4F6", muted: "#F8E7EC", border: "#EED3DA" },
    dark: { primary: "#E9909F", accent: "#B96A7C", background: "#1B0F13", foreground: "#FCEAEE", card: "#26161B", muted: "#331F26", border: "#452B33" },
  },
  {
    id: "slate-modern",
    name: "Slate Modern",
    emoji: "⚡",
    light: { primary: "#41527A", accent: "#7C90BF", background: "#FAFBFD", foreground: "#141A26", card: "#FFFFFF", muted: "#ECEFF5", border: "#DCE1EB" },
    dark: { primary: "#8DA2D4", accent: "#5468A0", background: "#0E1320", foreground: "#EDF1F9", card: "#161D2E", muted: "#1F2739", border: "#2C364C" },
  },
  {
    id: "midnight",
    name: "Midnight",
    emoji: "🌙",
    light: { primary: "#232D63", accent: "#4A56A8", background: "#FAFAFD", foreground: "#11142B", card: "#FFFFFF", muted: "#ECEDF6", border: "#DADCEC" },
    dark: { primary: "#7C8AE0", accent: "#4C58B5", background: "#0A0C1A", foreground: "#EDEEFA", card: "#131730", muted: "#1B2040", border: "#272D55" },
  },
];

export const DEFAULT_PRESET_ID = "emerald";

/* ---------- helpers ---------- */

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function isValidHex(hex: string | undefined | null): boolean {
  return !!hex && !!hexToRgb(hex);
}

function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 1;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Readable foreground (white/near-black) for a background colour. */
export function contrastOn(hex: string): string {
  return luminance(hex) > 0.45 ? "#111318" : "#FFFFFF";
}

function mix(hex: string, target: string, amount: number): string {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  if (!a || !b) return hex;
  const out = a.map((v, i) => Math.round(v + (b[i]! - v) * amount));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function rgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

export function resolveColors(cfg: ThemeConfig | null | undefined, mode: "light" | "dark"): Required<ThemePreset["light"]> {
  const preset = THEME_PRESETS.find((p) => p.id === (cfg?.preset ?? DEFAULT_PRESET_ID)) ?? THEME_PRESETS[0]!;
  const base = preset[mode];
  const over = (mode === "light" ? cfg?.light : cfg?.dark) ?? {};
  const pick = (k: keyof ThemeColors) => (isValidHex(over[k]) ? (over[k] as string) : base[k as keyof typeof base]);
  return {
    primary: pick("primary"),
    accent: pick("accent"),
    background: pick("background"),
    foreground: pick("foreground"),
    card: pick("card"),
    muted: pick("muted"),
    border: pick("border"),
  };
}

function blockFor(cfg: ThemeConfig, mode: "light" | "dark"): string {
  const c = resolveColors(cfg, mode);
  const isDark = mode === "dark";
  const mutedFg = mix(c.foreground, c.background, 0.42);
  const secondary = mix(c.primary, c.accent, 0.6);
  return `
  --background: ${c.background};
  --foreground: ${c.foreground};
  --card: ${c.card};
  --card-foreground: ${c.foreground};
  --popover: ${c.card};
  --popover-foreground: ${c.foreground};
  --primary: ${c.primary};
  --primary-foreground: ${contrastOn(c.primary)};
  --secondary: ${secondary};
  --secondary-foreground: ${contrastOn(secondary)};
  --accent: ${c.accent};
  --accent-foreground: ${contrastOn(c.accent)};
  --muted: ${c.muted};
  --muted-foreground: ${mutedFg};
  --border: ${c.border};
  --input: ${isDark ? mix(c.border, c.background, 0.3) : mix(c.border, c.background, 0.4)};
  --ring: ${c.primary};
  --hero-foreground: ${contrastOn(c.primary)};
  --chart-1: ${c.primary};
  --chart-2: ${secondary};
  --chart-3: ${c.accent};
  --chart-4: ${mix(c.accent, c.primary, 0.5)};
  --chart-5: ${mix(c.primary, c.background, 0.35)};
  --sidebar: ${isDark ? c.card : c.background};
  --sidebar-foreground: ${c.foreground};
  --sidebar-primary: ${c.primary};
  --sidebar-primary-foreground: ${contrastOn(c.primary)};
  --sidebar-accent: ${c.muted};
  --sidebar-accent-foreground: ${c.foreground};
  --sidebar-border: ${c.border};
  --sidebar-ring: ${c.primary};
  --gradient-primary: linear-gradient(135deg, ${c.primary}, ${mix(c.primary, c.accent, 0.55)});
  --gradient-hero: linear-gradient(135deg, ${c.primary} 0%, ${secondary} 100%);
  --gradient-accent: linear-gradient(135deg, ${c.accent}, ${mix(c.accent, c.primary, 0.4)});
  --gradient-card: linear-gradient(180deg, ${c.card}, ${mix(c.card, c.background, 0.6)});
  --shadow-glow: 0 20px 60px -20px ${rgba(c.primary, 0.4)};
  --shadow-elevated: 0 25px 50px -12px ${rgba(c.foreground, isDark ? 0.5 : 0.15)};
  --shadow-soft: 0 8px 30px -8px ${rgba(c.foreground, isDark ? 0.4 : 0.08)};`;
}

/** Build the CSS injected globally (admin, customer, staff panels and public site). */
export function buildThemeCss(cfg: ThemeConfig | null | undefined): string {
  if (!cfg) return "";
  const c: ThemeConfig = cfg;
  const radius = typeof c.radius === "number" ? `\n  --radius: ${c.radius}rem;` : "";
  const font = c.fontFamily
    ? `\nhtml, body { font-family: "${c.fontFamily}", "Anek Bangla", system-ui, sans-serif; }`
    : "";
  const btnRadius =
    typeof c.buttonRadius === "number"
      ? `\nbutton, .btn, [data-slot="button"] { border-radius: ${c.buttonRadius}rem; }`
      : "";
  const container =
    typeof c.containerWidth === "number" ? `\n.max-w-7xl { max-width: ${c.containerWidth}px; }` : "";
  return `:root {${radius}${blockFor(c, "light")}
}
.dark {${blockFor(c, "dark")}
}${font}${btnRadius}${container}`;
}
