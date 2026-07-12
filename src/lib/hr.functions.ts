import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============ ATTENDANCE ============
export const listAttendance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ date: z.string().optional() }).parse(d ?? {}),
  )
  .handler(async ({ context, data }) => {
    const date = data.date ?? new Date().toISOString().slice(0, 10);
    const { data: staff } = await context.supabase.from("staff").select("id,full_name,staff_code,designation").order("full_name");
    const { data: att } = await context.supabase.from("attendance").select("*").eq("date", date);
    return { date, staff: staff ?? [], attendance: att ?? [] };
  });

const AttInput = z.object({
  staff_id: z.string().uuid(),
  date: z.string(),
  status: z.enum(["present", "absent", "leave", "half_day", "late"]),
  check_in: z.string().optional().nullable(),
  check_out: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

export const upsertAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AttInput.parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("attendance")
      .upsert(data, { onConflict: "staff_id,date" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ LEAVES ============
export const listLeaves = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("leaves")
      .select("*, staff:staff_id(full_name, staff_code)")
      .order("from_date", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const LeaveInput = z.object({
  staff_id: z.string().uuid(),
  leave_type: z.enum(["casual", "sick", "annual", "unpaid", "other"]),
  from_date: z.string(),
  to_date: z.string(),
  reason: z.string().optional().nullable(),
});

export const createLeave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => LeaveInput.parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("leaves").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setLeaveStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["pending", "approved", "rejected", "cancelled"]),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("leaves")
      .update({
        status: data.status,
        approved_by: context.userId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteLeave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("leaves").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ PAYROLL ============
export const listPayrollRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("payroll_runs")
      .select("*")
      .order("period_month", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const generatePayrollRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ period_month: z.string() }).parse(d))
  .handler(async ({ context, data }) => {
    // fetch active staff with salary
    const { data: staff } = await context.supabase
      .from("staff").select("id, full_name, salary").eq("status", "active");
    const items = (staff ?? []).map((s) => {
      const basic = Number(s.salary ?? 0);
      return {
        staff_id: s.id,
        basic,
        allowances: 0,
        deductions: 0,
        net_amount: basic,
        paid: false,
      };
    });
    const total = items.reduce((a, b) => a + b.net_amount, 0);

    const { data: run, error: e1 } = await context.supabase
      .from("payroll_runs")
      .insert({
        period_month: data.period_month,
        status: "draft",
        total_amount: total,
        generated_by: context.userId,
      })
      .select().single();
    if (e1) throw new Error(e1.message);

    if (items.length > 0) {
      const rows = items.map((it) => ({ ...it, run_id: run!.id }));
      const { error: e2 } = await context.supabase.from("payroll_items").insert(rows);
      if (e2) throw new Error(e2.message);
    }
    return run;
  });

export const listPayrollItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ run_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("payroll_items")
      .select("*, staff:staff_id(full_name, staff_code, designation)")
      .eq("run_id", data.run_id);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const finalizePayrollRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ run_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: run, error } = await context.supabase
      .from("payroll_runs")
      .update({ status: "finalized", finalized_at: new Date().toISOString() })
      .eq("id", data.run_id)
      .select().single();
    if (error) throw new Error(error.message);
    // Auto expense entry
    await context.supabase.from("expenses").insert({
      category: "Salary",
      amount: Number(run!.total_amount ?? 0),
      description: `Payroll ${String(run!.period_month).slice(0, 7)}`,
      entry_date: new Date().toISOString().slice(0, 10),
      created_by: context.userId,
    });
    return { ok: true };
  });

export const deletePayrollRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("payroll_runs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
