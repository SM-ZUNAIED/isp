import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const InquiryInput = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^01[3-9][0-9]{8}$/, "Invalid Bangladeshi mobile"),
  address: z.string().trim().max(300).optional().nullable(),
  package_id: z.string().uuid().optional().nullable(),
  package_name: z.string().max(120).optional().nullable(),
  message: z.string().trim().max(1000).optional().nullable(),
});

export const submitInquiry = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InquiryInput.parse(d))
  .handler(async ({ data }) => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { error } = await supabase.from("leads").insert({
      name: data.name,
      phone: data.phone,
      address: data.address ?? null,
      package_id: data.package_id ?? null,
      package_name: data.package_name ?? null,
      message: data.message ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
