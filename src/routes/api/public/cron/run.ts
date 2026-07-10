import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { sendSms, type SmsConfig } from "@/lib/sms.server";

/**
 * Unified cron endpoint. Called by pg_cron with `?task=<name>`.
 * Tasks: generate-bills | send-reminders | auto-suspend
 * Auth: apikey header must match SUPABASE anon/publishable key.
 */
export const Route = createFileRoute("/api/public/cron/run")({
  server: {
    handlers: {
      POST: async ({ request }) => handle(request),
      GET: async ({ request }) => handle(request),
    },
  },
});

async function handle(request: Request) {
  const url = new URL(request.url);
  const task = url.searchParams.get("task");

  const providedKey =
    request.headers.get("apikey") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const expected =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SB_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!providedKey || !expected || providedKey !== expected) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const supabase = createClient<Database>(
    process.env.SUPABASE_URL || process.env.SB_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SB_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  try {
    if (task === "generate-bills") return json(await generateBills(supabase));
    if (task === "send-reminders") return json(await sendReminders(supabase));
    if (task === "auto-suspend") return json(await autoSuspend(supabase));
    return new Response(JSON.stringify({ error: "unknown task" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("cron task failed", task, msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

function json(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    headers: { "content-type": "application/json" },
  });
}

type SB = ReturnType<typeof createClient<Database>>;

async function loadSettings(supabase: SB) {
  const { data } = await supabase
    .from("settings")
    .select("bill_generation_day, bill_due_days, overdue_notice_days, auto_suspend_after_days, auto_billing_enabled, sms_api_config")
    .limit(1)
    .maybeSingle();
  return {
    bill_generation_day: data?.bill_generation_day ?? 1,
    bill_due_days: data?.bill_due_days ?? 10,
    overdue_notice_days: (data?.overdue_notice_days as number[] | null) ?? [3, 7, 15],
    auto_suspend_after_days: data?.auto_suspend_after_days ?? 30,
    auto_billing_enabled: data?.auto_billing_enabled ?? true,
    sms_api_config: data?.sms_api_config as SmsConfig | null,
  };
}

async function generateBills(supabase: SB) {
  const s = await loadSettings(supabase);
  if (!s.auto_billing_enabled) return { skipped: "disabled" };

  const now = new Date();
  // Only generate on the configured day of month
  if (now.getUTCDate() !== s.bill_generation_day) {
    return { skipped: `not_generation_day (today=${now.getUTCDate()}, cfg=${s.bill_generation_day})` };
  }

  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const monthStart = `${y}-${m}-01`;
  const due = new Date(now);
  due.setUTCDate(due.getUTCDate() + s.bill_due_days);
  const dueDate = due.toISOString().slice(0, 10);

  const { data: customers } = await supabase
    .from("customers")
    .select("id, customer_code, monthly_bill")
    .eq("status", "active");

  const { data: existing } = await supabase
    .from("bills")
    .select("customer_id")
    .eq("billing_month", monthStart);
  const existingSet = new Set((existing ?? []).map((b) => b.customer_id));

  const rows = (customers ?? [])
    .filter((c) => !existingSet.has(c.id) && Number(c.monthly_bill) > 0)
    .map((c, i) => ({
      customer_id: c.id,
      bill_number: `INV-${y}${m}-${c.customer_code}-${String(i + 1).padStart(3, "0")}`,
      billing_month: monthStart,
      amount: Number(c.monthly_bill),
      due_amount: Number(c.monthly_bill),
      due_date: dueDate,
      status: "unpaid" as const,
    }));

  if (rows.length === 0) return { created: 0, skipped: existingSet.size };
  const { error } = await supabase.from("bills").insert(rows);
  if (error) throw new Error(error.message);
  return { created: rows.length, skipped: existingSet.size };
}

async function sendReminders(supabase: SB) {
  const s = await loadSettings(supabase);
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // Fetch bills that are unpaid / partial / overdue with a due_date past
  const { data: bills } = await supabase
    .from("bills")
    .select("id, bill_number, due_date, due_amount, amount, status, customer_id, customers(full_name, mobile)")
    .in("status", ["unpaid", "partial", "overdue"])
    .not("due_date", "is", null);

  let sent = 0;
  let skipped = 0;

  for (const b of bills ?? []) {
    if (!b.due_date) { skipped++; continue; }
    const daysOverdue = Math.floor((today.getTime() - new Date(b.due_date).getTime()) / 86400000);
    if (!s.overdue_notice_days.includes(daysOverdue)) { skipped++; continue; }

    const cust = Array.isArray(b.customers) ? b.customers[0] : b.customers;
    const mobile = cust?.mobile;
    if (!mobile) { skipped++; continue; }

    // Dedupe: already logged today for this event?
    const eventType = `overdue_reminder_d${daysOverdue}`;
    const { count: already } = await supabase
      .from("notifications_log")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", b.customer_id)
      .eq("event_type", eventType)
      .gte("created_at", `${todayStr}T00:00:00Z`);
    if ((already ?? 0) > 0) { skipped++; continue; }

    // Auto-flip status to overdue if past due
    if (b.status !== "overdue" && daysOverdue > 0) {
      await supabase.from("bills").update({ status: "overdue" }).eq("id", b.id);
    }

    const msg = `প্রিয় ${cust?.full_name ?? ""}, আপনার বিল ${b.bill_number} বকেয়া ${Number(b.due_amount ?? b.amount).toFixed(0)} টাকা। দ্রুত পরিশোধ করুন।`;

    const result = await sendSms(s.sms_api_config, mobile, msg);
    await supabase.from("notifications_log").insert({
      channel: "sms",
      recipient: mobile,
      message: msg,
      event_type: eventType,
      customer_id: b.customer_id,
      status: result.ok ? "sent" : `failed:${result.error ?? "unknown"}`.slice(0, 200),
    });
    if (result.ok) sent++;
  }
  return { sent, skipped, scanned: bills?.length ?? 0 };
}

async function autoSuspend(supabase: SB) {
  const s = await loadSettings(supabase);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - s.auto_suspend_after_days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  // Find customers whose oldest unpaid bill due_date < cutoff and currently active
  const { data: overdue } = await supabase
    .from("bills")
    .select("customer_id")
    .in("status", ["unpaid", "partial", "overdue"])
    .lt("due_date", cutoffStr);
  const ids = Array.from(new Set((overdue ?? []).map((b) => b.customer_id)));
  if (ids.length === 0) return { suspended: 0 };

  const { data: suspended, error } = await supabase
    .from("customers")
    .update({ status: "suspended" })
    .in("id", ids)
    .eq("status", "active")
    .select("id");
  if (error) throw new Error(error.message);
  return { suspended: suspended?.length ?? 0 };
}

