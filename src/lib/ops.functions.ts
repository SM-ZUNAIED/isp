import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const OPS_TABLES = [
  "attendance",
  "leave_requests",
  "advance_salary",
  "payroll",
  "salary_policies",
  "staff",
  "ip_phone_configs",
  "sip_numbers",
  "follow_ups",
  "call_logs",
  "voice_templates",
  "auto_voice_sms",
  "customers",
] as const;

export type OpsTable = (typeof OPS_TABLES)[number];

const TableEnum = z.enum(OPS_TABLES);
const Values = z.record(z.string(), z.any());

export const opsList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        table: TableEnum,
        select: z.string().default("*"),
        orderBy: z.string().optional(),
        ascending: z.boolean().default(true),
        limit: z.number().int().positive().max(2000).default(500),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    let q = context.supabase
      .from(data.table as never)
      .select(data.select)
      .limit(data.limit);
    if (data.orderBy) q = q.order(data.orderBy, { ascending: data.ascending });
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as Array<Record<string, string | number | boolean | null>>;
  });

export const opsInsert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ table: TableEnum, values: Values }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from(data.table as never)
      .insert(data.values as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const opsUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ table: TableEnum, id: z.string(), values: Values }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from(data.table as never)
      .update(data.values as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const opsDelete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ table: TableEnum, id: z.string() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from(data.table as never)
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const count = async (
  sb: { from: (t: string) => { select: (s: string, o: object) => Promise<{ count: number | null }> } },
  table: string,
) => {
  const { count: c } = await sb.from(table).select("*", { count: "exact", head: true });
  return c ?? 0;
};

export const hrStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as never as Parameters<typeof count>[0];
    const today = new Date().toISOString().slice(0, 10);
    const [staffRows, attToday, leaves, adv, pay] = await Promise.all([
      context.supabase.from("staff").select("id,status,salary"),
      context.supabase.from("attendance").select("status").eq("work_date", today),
      context.supabase.from("leave_requests").select("status"),
      context.supabase.from("advance_salary").select("amount,status"),
      context.supabase.from("payroll").select("net_salary,status,pay_month"),
    ]);
    const staff = (staffRows.data ?? []) as Array<{ status: string; salary: number | null }>;
    const att = (attToday.data ?? []) as Array<{ status: string }>;
    const lv = (leaves.data ?? []) as Array<{ status: string }>;
    const ad = (adv.data ?? []) as Array<{ amount: number; status: string }>;
    const pr = (pay.data ?? []) as Array<{ net_salary: number; status: string }>;
    void sb;
    return {
      totalStaff: staff.length,
      activeStaff: staff.filter((s) => s.status === "active").length,
      salaryBudget: staff.reduce((a, s) => a + Number(s.salary ?? 0), 0),
      presentToday: att.filter((a) => a.status === "present").length,
      absentToday: att.filter((a) => a.status === "absent").length,
      pendingLeaves: lv.filter((l) => l.status === "pending").length,
      pendingAdvance: ad.filter((a) => a.status === "pending").length,
      advanceTotal: ad.filter((a) => a.status === "approved").reduce((a, x) => a + Number(x.amount ?? 0), 0),
      payrollPaid: pr.filter((p) => p.status === "paid").reduce((a, x) => a + Number(x.net_salary ?? 0), 0),
      payrollUnpaid: pr.filter((p) => p.status !== "paid").reduce((a, x) => a + Number(x.net_salary ?? 0), 0),
    };
  });

export const callStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [logs, fu, phones, nums, tpls, camps] = await Promise.all([
      context.supabase.from("call_logs").select("direction,outcome,duration_sec,called_at"),
      context.supabase.from("follow_ups").select("status,scheduled_at"),
      context.supabase.from("ip_phone_configs").select("is_active"),
      context.supabase.from("sip_numbers").select("is_active"),
      context.supabase.from("voice_templates").select("id"),
      context.supabase.from("auto_voice_sms").select("status,sent_count"),
    ]);
    const l = (logs.data ?? []) as Array<{ direction: string; outcome: string; duration_sec: number; called_at: string }>;
    const f = (fu.data ?? []) as Array<{ status: string; scheduled_at: string }>;
    const today = new Date().toISOString().slice(0, 10);
    return {
      totalCalls: l.length,
      callsToday: l.filter((x) => (x.called_at ?? "").slice(0, 10) === today).length,
      incoming: l.filter((x) => x.direction === "incoming").length,
      outgoing: l.filter((x) => x.direction === "outgoing").length,
      missed: l.filter((x) => x.outcome === "missed").length,
      totalMinutes: Math.round(l.reduce((a, x) => a + Number(x.duration_sec ?? 0), 0) / 60),
      pendingFollowUps: f.filter((x) => x.status === "pending").length,
      dueTodayFollowUps: f.filter((x) => (x.scheduled_at ?? "").slice(0, 10) === today).length,
      activePhones: ((phones.data ?? []) as Array<{ is_active: boolean }>).filter((x) => x.is_active).length,
      activeNumbers: ((nums.data ?? []) as Array<{ is_active: boolean }>).filter((x) => x.is_active).length,
      templates: (tpls.data ?? []).length,
      campaigns: (camps.data ?? []).length,
      voiceSent: ((camps.data ?? []) as Array<{ sent_count: number }>).reduce((a, x) => a + Number(x.sent_count ?? 0), 0),
    };
  });

export const generatePayroll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ month: z.string() }).parse(d))
  .handler(async ({ context, data }) => {
    const month = `${data.month}-01`;
    const { data: staff, error } = await context.supabase
      .from("staff")
      .select("id,salary,status")
      .eq("status", "active");
    if (error) throw new Error(error.message);
    const { data: existing } = await context.supabase
      .from("payroll")
      .select("staff_id")
      .eq("pay_month", month);
    const have = new Set(((existing ?? []) as Array<{ staff_id: string }>).map((r) => r.staff_id));
    const rows = ((staff ?? []) as Array<{ id: string; salary: number | null }>)
      .filter((s) => !have.has(s.id))
      .map((s) => ({
        staff_id: s.id,
        pay_month: month,
        basic_salary: Number(s.salary ?? 0),
        net_salary: Number(s.salary ?? 0),
        status: "unpaid",
      }));
    if (rows.length) {
      const { error: e2 } = await context.supabase.from("payroll").insert(rows as never);
      if (e2) throw new Error(e2.message);
    }
    return { created: rows.length, skipped: have.size };
  });
