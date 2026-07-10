import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  message: z.string().min(1).max(1000),
  target: z.enum(["all", "zone", "status", "custom"]).default("all"),
  zone_id: z.string().uuid().optional().nullable(),
  status: z.enum(["active", "pending", "suspended", "expired"]).optional().nullable(),
  mobiles: z.array(z.string()).optional().nullable(),
});

export const broadcastSms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase } = context;

    const { data: setRow } = await supabase
      .from("settings").select("sms_api_config").limit(1).maybeSingle();
    const cfg = (setRow?.sms_api_config as SmsConfig | null) ?? null;
    if (!cfg?.url) throw new Error("SMS API config not set (Settings → SMS)");

    let recipients: Array<{ mobile: string; id: string | null; name?: string | null }> = [];

    if (data.target === "custom" && data.mobiles?.length) {
      recipients = data.mobiles.map((m) => ({ mobile: m, id: null }));
    } else {
      let q = supabase.from("customers").select("id, mobile, full_name");
      if (data.target === "zone" && data.zone_id) q = q.eq("zone_id", data.zone_id);
      if (data.target === "status" && data.status) q = q.eq("status", data.status);
      const { data: rows } = await q;
      recipients = (rows ?? []).filter((r) => r.mobile).map((r) => ({
        mobile: r.mobile!, id: r.id, name: r.full_name,
      }));
    }

    let sent = 0, failed = 0;
    for (const r of recipients) {
      const msg = data.message.replaceAll("{name}", r.name ?? "");
      const res = await sendSms(cfg, r.mobile, msg);
      await supabase.from("notifications_log").insert({
        channel: "sms",
        recipient: r.mobile,
        message: msg,
        event_type: "broadcast",
        customer_id: r.id,
        status: res.ok ? "sent" : `failed:${res.error ?? ""}`.slice(0, 200),
      });
      if (res.ok) sent++; else failed++;
    }
    return { sent, failed, total: recipients.length };
  });

/** Manually trigger any cron task from admin UI. */
export const runCronTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ task: z.enum(["generate-bills", "send-reminders", "auto-suspend"]) }).parse(d),
  )
  .handler(async ({ data }) => {
    const base =
      process.env.PUBLIC_BASE_URL ||
      `https://project--9691aacd-75bf-4095-a9eb-97fce6752d73.lovable.app`;
    const key =
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.SB_PUBLISHABLE_KEY!;
    const res = await fetch(`${base}/api/public/cron/run?task=${data.task}`, {
      method: "POST",
      headers: { apikey: key },
    });
    const body = await res.text();
    if (!res.ok) throw new Error(`cron ${data.task} failed: ${body}`);
    return JSON.parse(body);
  });
