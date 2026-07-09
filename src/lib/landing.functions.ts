import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const getLandingData = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );

  const [settingsRes, packagesRes, zonesRes, noticesRes] = await Promise.all([
    supabase.from("settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("packages").select("*").eq("is_active", true).order("monthly_price"),
    supabase.from("zones").select("id, name, description"),
    supabase.from("notices").select("id, title, body").eq("is_active", true).order("created_at", { ascending: false }).limit(5),
  ]);

  return {
    settings: settingsRes.data,
    packages: packagesRes.data ?? [],
    zones: zonesRes.data ?? [],
    notices: noticesRes.data ?? [],
  };
});
