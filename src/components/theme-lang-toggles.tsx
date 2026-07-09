import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useI18n } from "@/hooks/use-i18n";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="grid h-9 w-9 place-items-center rounded-lg border bg-card hover:bg-muted transition-colors"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export function LangToggle() {
  const { lang, toggle } = useI18n();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle language"
      className="inline-flex h-9 w-14 items-center justify-center rounded-lg border bg-card text-xs font-bold tabular-nums hover:bg-muted transition-colors"
    >
      <span className="inline-block w-8 text-center leading-none">
        {lang === "bn" ? "বাং" : "EN"}
      </span>
    </button>
  );
}
