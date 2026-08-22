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

export const updateNotice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      title: z.string().min(1),
      body: z.string().optional().nullable(),
      is_active: z.boolean().default(true),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("notices").update(patch).eq("id", id);
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
  party_name: z.string().trim().max(200).optional().nullable(),
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

export const updateEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    EntryInput.extend({
      id: z.string().uuid(),
      kind: z.enum(["income", "expense"]),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { id, kind, ...patch } = data;
    const table = kind === "income" ? "incomes" : "expenses";
    const { error } = await context.supabase.from(table).update(patch).eq("id", id);
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

const FeatureItem = z.object({
  icon: z.string().default("zap"),
  title_bn: z.string().default(""),
  title_en: z.string().default(""),
  desc_bn: z.string().default(""),
  desc_en: z.string().default(""),
});
const AboutStat = z.object({
  value: z.string().default(""),
  label_bn: z.string().default(""),
  label_en: z.string().default(""),
});
const ReviewItem = z.object({
  name: z.string().default(""),
  loc_bn: z.string().default(""),
  loc_en: z.string().default(""),
  text_bn: z.string().default(""),
  text_en: z.string().default(""),
});
const FaqItem = z.object({
  q_bn: z.string().default(""),
  q_en: z.string().default(""),
  a_bn: z.string().default(""),
  a_en: z.string().default(""),
});
const LandingContent = z.object({
  hero_badge_bn: z.string().optional().nullable(),
  hero_badge_en: z.string().optional().nullable(),
  hero_title_en: z.string().optional().nullable(),
  hero_subtitle_en: z.string().optional().nullable(),
  about_text_en: z.string().optional().nullable(),
  features: z.array(FeatureItem).default([]),
  about_stats: z.array(AboutStat).default([]),
  reviews: z.array(ReviewItem).default([]),
  faqs: z.array(FaqItem).default([]),
  coverage_title_bn: z.string().optional().nullable(),
  coverage_title_en: z.string().optional().nullable(),
  coverage_subtitle_bn: z.string().optional().nullable(),
  coverage_subtitle_en: z.string().optional().nullable(),
  theme: z.record(z.string(), z.any()).optional().nullable(),
  cities: z.array(z.object({
    name_bn: z.string().default(""),
    name_en: z.string().default(""),
  })).default([]),
}).partial();

const SettingsInput = z.object({
  isp_name: z.string().optional().nullable(),
  logo_url: z.string().optional().nullable(),
  hero_title: z.string().optional().nullable(),
  hero_subtitle: z.string().optional().nullable(),
  about_text: z.string().optional().nullable(),
  hotline: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  site_title: z.string().optional().nullable(),
  site_description: z.string().optional().nullable(),
  landing_content: LandingContent.optional().nullable(),
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
      .select("id, customer_code, full_name, mobile, alt_mobile, email, address, avatar_path, monthly_bill, status, connection_date, expiry_date, pppoe_username, package_id, zone_id, division_id, district_id, upazila_id, union_id, post_office_id, village_id, area_id, road_id, building_id, address_line, packages(name, download_speed, upload_speed, monthly_price), zones(name)")
      .eq("user_id", userId)
      .maybeSingle();

    if (!customer) {
      const [pk, zn] = await Promise.all([
        supabase.from("packages").select("id, name, download_speed, upload_speed, monthly_price").eq("is_active", true).order("monthly_price"),
        supabase.from("zones").select("id, name").order("name"),
      ]);
      return { customer: null, bills: [], payments: [], tickets: [], packages: pk.data ?? [], zones: zn.data ?? [] };
    }

    const [bills, payments, tickets, pk, zn] = await Promise.all([
      supabase.from("bills")
        .select("id, bill_number, billing_month, amount, paid_amount, due_amount, status, due_date")
        .eq("customer_id", customer.id).order("billing_month", { ascending: false }).limit(20),
      supabase.from("payments")
        .select("id, receipt_number, amount, method, paid_at")
        .eq("customer_id", customer.id).order("paid_at", { ascending: false }).limit(20),
      supabase.from("tickets")
        .select("id, ticket_number, subject, description, status, category, created_at")
        .eq("customer_id", customer.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("packages").select("id, name, download_speed, upload_speed, monthly_price").eq("is_active", true).order("monthly_price"),
      supabase.from("zones").select("id, name").order("name"),
    ]);

    return {
      customer,
      bills: bills.data ?? [],
      payments: payments.data ?? [],
      tickets: tickets.data ?? [],
      packages: pk.data ?? [],
      zones: zn.data ?? [],
    };
  });

/** Customer submits a service request (package upgrade or area/zone change). */
export const submitCustomerRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      kind: z.enum(["package_change", "area_change"]),
      target_package_id: z.string().uuid().optional().nullable(),
      target_zone_id: z.string().uuid().optional().nullable(),
      new_address: z.string().trim().max(500).optional().nullable(),
      note: z.string().trim().max(1000).optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: cust, error: cErr } = await supabase
      .from("customers").select("id, customer_code, full_name").eq("user_id", userId).maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!cust) throw new Error("Customer profile not linked");

    let subject = "";
    const lines: string[] = [];
    if (data.kind === "package_change") {
      if (!data.target_package_id) throw new Error("Please select a package");
      const { data: pk } = await supabase.from("packages")
        .select("name, download_speed, upload_speed, monthly_price").eq("id", data.target_package_id).maybeSingle();
      subject = `[Package Change] ${pk?.name ?? "Requested package"}`;
      lines.push(`Requested package: ${pk?.name ?? "-"} (${pk?.download_speed ?? "-"}/${pk?.upload_speed ?? "-"} Mbps, ৳${pk?.monthly_price ?? "-"}/mo)`);
    } else {
      if (!data.target_zone_id) throw new Error("Please select an area");
      const { data: zn } = await supabase.from("zones").select("name").eq("id", data.target_zone_id).maybeSingle();
      subject = `[Area Change] Move to ${zn?.name ?? "new area"}`;
      lines.push(`New area / zone: ${zn?.name ?? "-"}`);
      if (data.new_address) lines.push(`New address: ${data.new_address}`);
    }
    if (data.note) lines.push(`Note: ${data.note}`);

    const ticketNumber = `REQ-${Date.now().toString(36).toUpperCase()}`;
    const { data: row, error } = await supabase.from("tickets").insert({
      ticket_number: ticketNumber,
      customer_id: cust.id,
      category: "other",
      subject,
      description: lines.join("\n"),
      status: "pending",
    }).select().single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id, ticket_number: row.ticket_number };
  });

/* ============= CUSTOMER PROFILE UPDATE ============= */

export const updateCustomerProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      full_name: z.string().trim().min(2).max(120),
      address: z.string().trim().max(500).optional().nullable().or(z.literal("")),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const patch = {
      full_name: data.full_name,
      address: data.address ? data.address : null,
    };
    // RLS "Customers self update" policy scopes this to the caller's own row.
    // Note: mobile and email are admin-managed primary identifiers and NOT editable by the customer.
    const { error } = await supabase
      .from("customers").update(patch).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateCustomerAvatar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      avatar_path: z.string().trim().min(1).max(500).nullable(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("customers").update({ avatar_path: data.avatar_path }).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


