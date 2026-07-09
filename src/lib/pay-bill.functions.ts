import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Public bill lookup by customer code. Returns customer + latest outstanding bill. */
export const lookupPublicBill = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      customer_code: z.string().trim().min(2).max(64),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const code = data.customer_code.toUpperCase();

    const { data: customer, error: cErr } = await supabaseAdmin
      .from("customers")
      .select("id, customer_code, full_name, mobile, monthly_bill, status, packages(name)")
      .ilike("customer_code", code)
      .maybeSingle();

    if (cErr) throw new Error(cErr.message);
    if (!customer) throw new Error("NOT_FOUND");

    const { data: bill, error: bErr } = await supabaseAdmin
      .from("bills")
      .select("id, bill_number, billing_month, amount, paid_amount, due_amount, due_date, status")
      .eq("customer_id", customer.id)
      .in("status", ["unpaid", "partial", "overdue"])
      .order("due_date", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (bErr) throw new Error(bErr.message);

    return {
      customer: {
        id: customer.id,
        code: customer.customer_code,
        name: customer.full_name,
        mobile: customer.mobile,
        package: (customer as any).packages?.name ?? null,
      },
      bill: bill
        ? {
            id: bill.id,
            number: bill.bill_number,
            month: bill.billing_month,
            amount: Number(bill.amount),
            paid: Number(bill.paid_amount ?? 0),
            due: Number(bill.due_amount ?? bill.amount),
            due_date: bill.due_date,
            status: bill.status,
          }
        : null,
      monthly_bill: Number(customer.monthly_bill ?? 0),
    };
  });

/** Public payment submission. Records a payment and updates the bill. */
export const submitPublicPayment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      bill_id: z.string().uuid(),
      method: z.enum(["bkash", "nagad", "rocket", "card", "bank"]),
      transaction_id: z.string().trim().min(3).max(64).optional().nullable(),
      msisdn: z.string().trim().regex(/^01[3-9]\d{8}$/).optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: bill, error: bErr } = await supabaseAdmin
      .from("bills")
      .select("id, customer_id, amount, paid_amount, due_amount, status")
      .eq("id", data.bill_id)
      .single();
    if (bErr || !bill) throw new Error("Bill not found");
    if (bill.status === "paid") throw new Error("Bill already paid");

    const amount = Number(bill.due_amount ?? bill.amount);
    if (!(amount > 0)) throw new Error("Nothing to pay");

    const dbMethod =
      data.method === "card" || data.method === "bank" ? "other" : data.method;

    const receipt = `RCP-${Date.now().toString(36).toUpperCase()}`;

    const notes = [
      `channel:${data.method}`,
      data.msisdn ? `msisdn:${data.msisdn}` : null,
    ].filter(Boolean).join(" | ");

    const { error: pErr } = await supabaseAdmin.from("payments").insert({
      bill_id: bill.id,
      customer_id: bill.customer_id,
      amount,
      method: dbMethod as "bkash" | "nagad" | "rocket" | "other",
      transaction_id: data.transaction_id ?? null,
      notes,
      receipt_number: receipt,
      received_by: null,
    });
    if (pErr) throw new Error(pErr.message);

    const newPaid = Number(bill.paid_amount ?? 0) + amount;
    const due = Number(bill.amount) - newPaid;
    const status: "paid" | "partial" | "unpaid" =
      due <= 0 ? "paid" : newPaid > 0 ? "partial" : "unpaid";

    const { error: uErr } = await supabaseAdmin
      .from("bills")
      .update({
        paid_amount: newPaid,
        due_amount: Math.max(0, due),
        status,
      })
      .eq("id", bill.id);
    if (uErr) throw new Error(uErr.message);

    return { ok: true, receipt, amount, status };
  });
