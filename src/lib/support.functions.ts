import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ============= TICKETS ============= */

export const listTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("tickets")
      .select("id, ticket_number, subject, description, category, status, created_at, updated_at, customers(full_name, customer_code, mobile)")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateTicketStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["pending", "in_progress", "solved", "closed"]),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("tickets").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listTicketReplies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ ticket_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("ticket_replies")
      .select("id, message, is_staff, created_at, user_id")
      .eq("ticket_id", data.ticket_id)
      .order("created_at");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const addTicketReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      ticket_id: z.string().uuid(),
      message: z.string().min(1),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("ticket_replies").insert({
      ticket_id: data.ticket_id,
      message: data.message,
      is_staff: true,
      user_id: context.userId,
    });
    if (error) throw new Error(error.message);
    await context.supabase
      .from("tickets").update({ status: "in_progress" }).eq("id", data.ticket_id);
    return { ok: true };
  });

/* ============= NOTICES ============= */

export const listNoticesAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("notices").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createNotice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      title: z.string().min(1),
      body: z.string().optional().nullable(),
      is_active: z.boolean().default(true),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error, data: row } = await context.supabase
      .from("notices").insert(data).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const toggleNotice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), is_active: z.boolean() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("notices").update({ is_active: data.is_active }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteNotice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("notices").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============= ACCOUNTS (INCOME/EXPENSE) ============= */

export const listAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [inc, exp] = await Promise.all([
      context.supabase.from("incomes").select("*").order("entry_date", { ascending: false }).limit(200),
      context.supabase.from("expenses").select("*").order("entry_date", { ascending: false }).limit(200),
    ]);
    return { incomes: inc.data ?? [], expenses: exp.data ?? [] };
  });

const EntryInput = z.object({
  amount: z.number().positive(),
  category: z.string().min(1),
  description: z.string().optional().nullable(),
  entry_date: z.string().min(1),
});

export const addIncome = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => EntryInput.parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("incomes").insert({
      ...data, created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => EntryInput.parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("expenses").insert({
      ...data, created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), kind: z.enum(["income", "expense"]) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const table = data.kind === "income" ? "incomes" : "expenses";
    const { error } = await context.supabase.from(table).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============= SETTINGS ============= */

export const getSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("settings").select("*").eq("id", 1).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

const SettingsInput = z.object({
  isp_name: z.string().optional().nullable(),
  hero_title: z.string().optional().nullable(),
  hero_subtitle: z.string().optional().nullable(),
  about_text: z.string().optional().nullable(),
  hotline: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
});

export const updateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SettingsInput.parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("settings")
      .upsert({ id: 1, ...data });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============= CUSTOMER PORTAL ============= */

export const getCustomerPortal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: customer } = await supabase
      .from("customers")
      .select("id, customer_code, full_name, mobile, address, monthly_bill, status, expiry_date, packages(name, download_speed, upload_speed), zones(name)")
      .eq("user_id", userId)
      .maybeSingle();

    if (!customer) return { customer: null, bills: [], payments: [], tickets: [] };

    const [bills, payments, tickets] = await Promise.all([
      supabase.from("bills")
        .select("id, bill_number, billing_month, amount, paid_amount, due_amount, status, due_date")
        .eq("customer_id", customer.id).order("billing_month", { ascending: false }).limit(20),
      supabase.from("payments")
        .select("id, receipt_number, amount, method, paid_at")
        .eq("customer_id", customer.id).order("paid_at", { ascending: false }).limit(20),
      supabase.from("tickets")
        .select("id, ticket_number, subject, status, category, created_at")
        .eq("customer_id", customer.id).order("created_at", { ascending: false }).limit(20),
    ]);

    return {
      customer,
      bills: bills.data ?? [],
      payments: payments.data ?? [],
      tickets: tickets.data ?? [],
    };
  });
