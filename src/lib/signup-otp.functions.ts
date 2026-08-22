import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { mobileToEmail, sha256Hex } from "@/lib/mobile-auth";

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


/** Step 1 — send a 6-digit OTP to the mobile number. */
export const requestSignupOtp = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => RequestInputSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendSms } = await import("@/lib/sms.server");
    type SmsConfig = import("@/lib/sms.server").SmsConfig;

    const mobile = data.mobile;

    // Already registered? (only if a real auth user still exists)
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("mobile", mobile)
      .maybeSingle();
    if (existing) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(existing.id);
      if (authUser?.user) {
        return { sent: false as const, error: "This mobile number is already registered. Please sign in." };
      }
    }

    // Rate limit: max 5 codes per 15 minutes per number.
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("signup_otps")
      .select("id", { count: "exact", head: true })
      .eq("mobile", mobile)
      .gte("created_at", since);
    if ((count ?? 0) >= 5) return { sent: false as const, error: "Too many attempts. Please try again later." };

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const { error: insErr } = await supabaseAdmin.from("signup_otps").insert({
      mobile,
      code_hash: await sha256Hex(`${mobile}:${code}`),
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });
    if (insErr) return { sent: false as const, error: "Could not create verification code." };

    const { data: setRow } = await supabaseAdmin
      .from("settings")
      .select("sms_api_config")
      .limit(1)
      .maybeSingle();
    const cfg = (setRow?.sms_api_config as SmsConfig | null) ?? null;
    if (!cfg?.url) return { sent: false as const, error: "SMS gateway is not configured. Contact the operator." };

    const res = await sendSms(cfg, mobile, `Your verification code is ${code}. Valid for 5 minutes.`);
    if (!res.ok) return { sent: false as const, error: "Could not send the verification SMS. Please try again." };

    return { sent: true as const };
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

    const fail = (error: string) => ({ created: false as const, error });

    if (!row) return fail("No verification code found. Please request a new one.");
    if (new Date(row.expires_at).getTime() < Date.now()) return fail("The code has expired. Request a new one.");
    if (row.attempts >= 5) return fail("Too many wrong attempts. Request a new code.");

    if (row.code_hash !== (await sha256Hex(`${mobile}:${code}`))) {
      await supabaseAdmin.from("signup_otps").update({ attempts: row.attempts + 1 }).eq("id", row.id);
      return fail("The verification code is incorrect.");
    }

    await supabaseAdmin.from("signup_otps").update({ consumed: true }).eq("id", row.id);

    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: mobileToEmail(mobile),
      password,
      email_confirm: true,
      user_metadata: { mobile, full_name: mobile },
    });
    if (error) {
      if (/already/i.test(error.message)) return fail("This mobile number is already registered.");
      return fail("Could not create the account. Please try again.");
    }

    return { created: true as const, email: mobileToEmail(mobile) };
  });
