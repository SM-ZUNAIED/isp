import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buildThemeCss, type ThemeConfig } from "@/lib/theme-presets";

type LandingSettingsRow = { landing_content?: { theme?: ThemeConfig } | null } | null;

export function useThemeConfig() {
  return useQuery({
    queryKey: ["app-theme"],
    queryFn: async (): Promise<ThemeConfig | null> => {
      const { data } = await supabase.rpc("public_get_landing_settings");
      const row = data as unknown as LandingSettingsRow;
      return row?.landing_content?.theme ?? null;
    },
    staleTime: 60 * 1000,
  });
}

/**
 * Injects the globally configured theme (Admin → Design & Theme → Appearance)
 * as CSS variables so every surface — public site, admin, staff and customer
 * panels — stays in sync. Live-updates through Supabase realtime.
 */
export function ThemeVars() {
  const { data } = useThemeConfig();
  const qc = useQueryClient();

  useEffect(() => {
    const ch = supabase
      .channel(`theme-sync-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "settings" }, () => {
        qc.invalidateQueries({ queryKey: ["app-theme"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = "app-theme-vars";
    let el = document.getElementById(id) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = buildThemeCss(data ?? null);
  }, [data]);

  return null;
}
