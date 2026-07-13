import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type SiteMeta = {
  title: string;
  description: string;
};

const DEFAULT_TITLE = "Net Bill Pro — ISP বিলিং ও নেটওয়ার্ক অটোমেশন সফটওয়্যার";
const DEFAULT_DESC = "বাংলাদেশের ISP ব্যবসার জন্য সম্পূর্ণ বিলিং, MikroTik, OLT, ONU অটোমেশন সফটওয়্যার।";

export const getSiteMeta = createServerFn({ method: "GET" }).handler(async (): Promise<SiteMeta> => {
  try {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data } = await supabase.rpc("public_get_landing_settings");
    const row = (data ?? null) as { site_title?: string | null; site_description?: string | null; isp_name?: string | null } | null;
    return {
      title: row?.site_title?.trim() || row?.isp_name?.trim() || DEFAULT_TITLE,
      description: row?.site_description?.trim() || DEFAULT_DESC,
    };
  } catch {
    return { title: DEFAULT_TITLE, description: DEFAULT_DESC };
  }
});