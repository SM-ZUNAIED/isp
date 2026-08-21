import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** List all bills with customer name. */
export const listBills = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bills")
      .select("id, bill_number, billing_month, amount, paid_amount, due_amount, due_date, status, customer_id, customers(full_name, customer_code, mobile)")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** List active customers with billable amount + whether a bill already exists for the month. */
export const listBillableCustomers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ billing_month: z.string().regex(/^\d{4}-\d{2}$/) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const monthStart = `${data.billing_month}-01`;
    const { data: customers, error: cErr } = await context.supabase
      .from("customers")
      .select("id, customer_code, full_name, mobile, monthly_bill")
      .eq("status", "active")
      .order("customer_code", { ascending: true });
    if (cErr) throw new Error(cErr.message);

    const { data: existing } = await context.supabase
      .from("bills")
      .select("customer_id")
      .eq("billing_month", monthStart);
    const existingSet = new Set((existing ?? []).map((b) => b.customer_id));

    return (customers ?? []).map((c) => ({
      id: c.id,
      customer_code: c.customer_code,
      full_name: c.full_name,
      mobile: c.mobile,
      monthly_bill: Number(c.monthly_bill ?? 0),
      already_billed: existingSet.has(c.id),
    }));
  });

/** Generate monthly bills for selected (or all active) customers. */
export const generateMonthlyBills = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      billing_month: z.string().regex(/^\d{4}-\d{2}$/),
      customer_ids: z.array(z.string().uuid()).optional(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const monthStart = `${data.billing_month}-01`;
    const dueDate = new Date(monthStart);
    dueDate.setMonth(dueDate.getMonth() + 1);
    dueDate.setDate(10);

    let cq = context.supabase
      .from("customers")
      .select("id, customer_code, monthly_bill")
      .eq("status", "active");
    if (data.customer_ids && data.customer_ids.length > 0) {
      cq = cq.in("id", data.customer_ids);
    }
    const { data: customers, error: cErr } = await cq;
    if (cErr) throw new Error(cErr.message);

    const { data: existing } = await context.supabase
      .from("bills")
      .select("customer_id")
      .eq("billing_month", monthStart);
    const existingSet = new Set((existing ?? []).map((b) => b.customer_id));

    const toInsert = (customers ?? [])
      .filter((c) => !existingSet.has(c.id) && Number(c.monthly_bill) > 0)
      .map((c, i) => ({
        customer_id: c.id,
        bill_number: `INV-${data.billing_month.replace("-", "")}-${c.customer_code}-${String(i + 1).padStart(3, "0")}`,
        billing_month: monthStart,
        amount: Number(c.monthly_bill),

        due_date: dueDate.toISOString().slice(0, 10),
        status: "unpaid" as const,
      }));

    const skipped = (customers ?? []).length - toInsert.length;
    if (toInsert.length === 0) return { created: 0, skipped };
    const { error } = await context.supabase.from("bills").insert(toInsert);
    if (error) throw new Error(error.message);
    return { created: toInsert.length, skipped };
  });


    if (toInsert.length === 0) return { created: 0, skipped: existingSet.size };
    const { error } = await context.supabase.from("bills").insert(toInsert);
    if (error) throw new Error(error.message);
    return { created: toInsert.length, skipped: existingSet.size };
  });

/** Collect a payment against a bill (or standalone). */
export const collectPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      bill_id: z.string().uuid(),
      amount: z.number().positive(),
      method: z.enum(["cash", "bkash", "nagad", "rocket", "bank", "other"]),
      transaction_id: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    const { data: bill, error: bErr } = await supabase
      .from("bills")
      .select("id, customer_id, amount, paid_amount")
      .eq("id", data.bill_id)
      .single();
    if (bErr || !bill) throw new Error(bErr?.message ?? "Bill not found");

    const receipt = `RCP-${Date.now().toString(36).toUpperCase()}`;

    const { error: pErr } = await supabase.from("payments").insert({
      bill_id: bill.id,
      customer_id: bill.customer_id,
      amount: data.amount,
      method: data.method,
      transaction_id: data.transaction_id ?? null,
      notes: data.notes ?? null,
      receipt_number: receipt,
      received_by: userId,
    });
    if (pErr) throw new Error(pErr.message);

    const newPaid = Number(bill.paid_amount ?? 0) + data.amount;
    const due = Number(bill.amount) - newPaid;
    const status: "paid" | "partial" | "unpaid" =
      due <= 0 ? "paid" : newPaid > 0 ? "partial" : "unpaid";

    const { error: uErr } = await supabase
      .from("bills")
      .update({
        paid_amount: newPaid,
        status,
      })
      .eq("id", bill.id);
    if (uErr) throw new Error(uErr.message);

    return { ok: true, receipt, status };
  });

/** Recent payments log. */
export const listPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("payments")
      .select("id, receipt_number, amount, method, paid_at, transaction_id, customers(full_name, customer_code)")
      .order("paid_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Admin: manually override a bill's status. */
export const updateBillStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      bill_id: z.string().uuid(),
      status: z.enum(["unpaid", "partial", "paid", "overdue"]),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: bill, error: bErr } = await supabase
      .from("bills").select("id, amount, paid_amount").eq("id", data.bill_id).single();
    if (bErr || !bill) throw new Error(bErr?.message ?? "Bill not found");

    const amount = Number(bill.amount);
    let paid = Number(bill.paid_amount ?? 0);
    let due = amount - paid;

    if (data.status === "paid") { paid = amount; due = 0; }
    else if (data.status === "unpaid") { paid = 0; due = amount; }
    // "partial" and "overdue" leave paid/due as-is

    const { error } = await supabase
      .from("bills")
      .update({ status: data.status, paid_amount: paid })
      .eq("id", data.bill_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin: delete a payment log entry (linked income row is removed by trigger). */
export const deletePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden: admin only");

    const { data: pay, error: pErr } = await supabase
      .from("payments").select("id, bill_id, amount").eq("id", data.id).single();
    if (pErr || !pay) throw new Error(pErr?.message ?? "Payment not found");

    const { error: dErr } = await supabase.from("payments").delete().eq("id", data.id);
    if (dErr) throw new Error(dErr.message);

    if (pay.bill_id) {
      const { data: bill } = await supabase
        .from("bills").select("amount, paid_amount").eq("id", pay.bill_id).single();
      if (bill) {
        const newPaid = Math.max(0, Number(bill.paid_amount ?? 0) - Number(pay.amount));
        const amount = Number(bill.amount);
        const status = newPaid <= 0 ? "unpaid" : newPaid >= amount ? "paid" : "partial";
        await supabase.from("bills").update({ paid_amount: newPaid, status }).eq("id", pay.bill_id);
      }
    }
    return { ok: true };
  });


