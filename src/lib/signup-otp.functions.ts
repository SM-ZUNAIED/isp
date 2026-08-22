import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const mobileSchema = z
  .string()
  .trim()
  .regex(/^01[3-9]\d{8}$/, "Enter a valid Bangladeshi mobile number");

const RequestInputSchema = z.object({ mobile: mobileSchema });

const VerifyInputSchema = z.object({
  mobile: mobileSchema,
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
  password: z.string().min(6).max(72),
});

export const mobileToEmail = (mobile: string) => `${mobile.trim()}@mobile.local`;

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Step 1 — send a 6-digit OTP to the mobile number. */
export const requestSignupOtp = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => RequestInputSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendSms } = await import("@/lib/sms.server");
    type SmsConfig = import("@/lib/sms.server").SmsConfig;

    const mobile = data.mobile;

    // Already registered?
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("mobile", mobile)
      .maybeSingle();
    if (existing) throw new Error("This mobile number is already registered. Please sign in.");

    // Rate limit: max 5 codes per 15 minutes per number.
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("signup_otps")
      .select("id", { count: "exact", head: true })
      .eq("mobile", mobile)
      .gte("created_at", since);
    if ((count ?? 0) >= 5) throw new Error("Too many attempts. Please try again later.");

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const { error: insErr } = await supabaseAdmin.from("signup_otps").insert({
      mobile,
      code_hash: await sha256(`${mobile}:${code}`),
      expires_at: new Date(Date.now() * 1 + 5 * 60 * 1000).toISOString(),
    });
    if (insErr) throw new Error("Could not create verification code.");

    const { data: setRow } = await supabaseAdmin
      .from("settings")
      .select("sms_api_config")
      .limit(1)
      .maybeSingle();
    const cfg = (setRow?.sms_api_config as SmsConfig | null) ?? null;
    if (!cfg?.url) throw new Error("SMS gateway is not configured. Contact the operator.");

    const res = await sendSms(cfg, mobile, `Your verification code is ${code}. Valid for 5 minutes.`);
    if (!res.ok) throw new Error("Could not send the verification SMS. Please try again.");

    return { sent: true };
  });

/** Step 2 — verify OTP and create the account. */
export const verifySignupOtp = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => VerifyInputSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { mobile, code, password } = data;

    const { data: row } = await supabaseAdmin
      .from("signup_otps")
      .select("id, code_hash, attempts, consumed, expires_at")
      .eq("mobile", mobile)
      .eq("consumed", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!row) throw new Error("No verification code found. Please request a new one.");
    if (new Date(row.expires_at).getTime() < Date.now()) throw new Error("The code has expired. Request a new one.");
    if (row.attempts >= 5) throw new Error("Too many wrong attempts. Request a new code.");

    if (row.code_hash !== (await sha256(`${mobile}:${code}`))) {
      await supabaseAdmin.from("signup_otps").update({ attempts: row.attempts + 1 }).eq("id", row.id);
      throw new Error("The verification code is incorrect.");
    }

    await supabaseAdmin.from("signup_otps").update({ consumed: true }).eq("id", row.id);

    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: mobileToEmail(mobile),
      password,
      email_confirm: true,
      user_metadata: { mobile, full_name: mobile },
    });
    if (error) {
      if (/already/i.test(error.message)) throw new Error("This mobile number is already registered.");
      throw new Error("Could not create the account. Please try again.");
    }

    return { created: true, email: mobileToEmail(mobile) };
  });
