import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertOwnedCustomer, auditLog, getAdminClient, requireReseller } from "@/lib/reseller.server";

type Row = Record<string, string | number | boolean | null>;

/* --------------------------------- SMS ---------------------------------- */

export const resellerSmsSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const r = await requireReseller(context.userId, "sms");
    const admin = await getAdminClient();
    const { data: cust } = await admin.from("customers").select("id").eq("reseller_id", r.id);
    const ids = ((cust ?? []) as Array<{ id: string }>).map((c) => c.id);
    let sent = 0;
    let failed = 0;
    let month = 0;
    if (ids.length) {
      const { data: logs } = await admin
        .from("notifications_log")
        .select("status, created_at")
        .in("customer_id", ids)
        .limit(1000);
      const monthStart = new Date();
      monthStart.setDate(1);
      ((logs ?? []) as Array<{ status: string | null; created_at: string }>).forEach((l) => {
        if ((l.status ?? "").startsWith("failed")) failed += 1;
        else sent += 1;
        if (new Date(l.created_at) >= monthStart) month += 1;
      });
    }
    const { data: setRow } = await admin.from("settings").select("sms_api_config").limit(1).maybeSingle();
    const cfg = ((setRow as { sms_api_config?: unknown } | null)?.sms_api_config ?? null) as { url?: string; provider?: string; method?: string } | null;
    return {
      customers: ids.length,
      sent,
      failed,
      this_month: month,
      gateway: {
        configured: !!cfg?.url,
        provider: cfg?.provider ?? null,
        method: cfg?.method ?? "GET",
        host: cfg?.url ? new URL(cfg.url).host : null,
      },
    };
  });

export const resellerSendSms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        message: z.string().trim().min(1).max(600),
        target: z.enum(["all", "status", "selected"]).default("all"),
        status: z.string().max(24).optional().nullable(),
        customer_ids: z.array(z.string().uuid()).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const r = await requireReseller(context.userId, "sms", "create");
    const { sendSms } = await import("@/lib/sms.server");
    type SmsConfig = import("@/lib/sms.server").SmsConfig;
    const admin = await getAdminClient();

    const { data: setRow } = await admin.from("settings").select("sms_api_config").limit(1).maybeSingle();
    const cfg = (((setRow as { sms_api_config?: unknown } | null)?.sms_api_config ?? null) as SmsConfig | null);
    if (!cfg?.url) throw new Error("SMS gateway is not configured by admin");

    let q = admin.from("customers").select("id, mobile, full_name").eq("reseller_id", r.id);
    if (data.target === "status" && data.status) q = q.eq("status", data.status);
    if (data.target === "selected" && data.customer_ids?.length) q = q.in("id", data.customer_ids);
    const { data: rows } = await q;

    let sent = 0;
    let failed = 0;
    for (const c of ((rows ?? []) as Array<{ id: string; mobile: string | null; full_name: string }>)) {
      if (!c.mobile) continue;
      const msg = data.message.replaceAll("{name}", c.full_name ?? "");
      const res = await sendSms(cfg, c.mobile, msg);
      await admin.from("notifications_log").insert({
        channel: "sms",
        recipient: c.mobile,
        message: msg,
        event_type: "reseller_broadcast",
        customer_id: c.id,
        status: res.ok ? "sent" : `failed:${res.error ?? ""}`.slice(0, 200),
      } as never);
      if (res.ok) sent += 1;
      else failed += 1;
    }
    await auditLog({ actor_id: context.userId, reseller_id: r.id, action: "sms.broadcast", resource: "notifications_log", details: { sent, failed } });
    return { sent, failed, total: sent + failed };
  });

/* ------------------------------ bulk actions ----------------------------- */

export const resellerBulkUpdateCustomers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        ids: z.array(z.string().uuid()).min(1).max(200),
        package_id: z.string().uuid().optional().nullable(),
        expiry_date: z.string().max(20).optional().nullable(),
        status: z.enum(["active", "pending", "suspended", "expired", "no_payment"]).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const r = await requireReseller(context.userId, "customers", "edit");
    const admin = await getAdminClient();
    const patch: Record<string, unknown> = {};
    if (data.package_id) {
      const { data: pkg } = await admin.from("packages").select("monthly_price").eq("id", data.package_id).maybeSingle();
      patch.package_id = data.package_id;
      if (pkg) patch.monthly_bill = (pkg as { monthly_price: number }).monthly_price;
    }
    if (data.expiry_date) patch.expiry_date = data.expiry_date;
    if (data.status) patch.status = data.status;
    if (!Object.keys(patch).length) throw new Error("Nothing to update");

    for (const id of data.ids) await assertOwnedCustomer(r.id, id);
    const { error } = await admin.from("customers").update(patch as never).in("id", data.ids).eq("reseller_id", r.id);
    if (error) throw new Error(error.message);
    await auditLog({ actor_id: context.userId, reseller_id: r.id, action: "customers.bulk_update", resource: "customers", details: { count: data.ids.length, patch } });
    return { updated: data.ids.length };
  });

export const resellerImportCustomers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ text: z.string().min(1).max(200000) }).parse(d))
  .handler(async ({ context, data }) => {
    const r = await requireReseller(context.userId, "customers", "create");
    const admin = await getAdminClient();
    const { data: pkgs } = await admin.from("packages").select("id, name, monthly_price");
    const packages = (pkgs ?? []) as Array<{ id: string; name: string; monthly_price: number }>;
    const { data: existing } = await admin.from("customers").select("customer_code");
    const codes = new Set(((existing ?? []) as Array<{ customer_code: string }>).map((c) => c.customer_code.toLowerCase()));

    const created: string[] = [];
    const skipped: string[] = [];
    for (const raw of data.text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line) continue;
      const parts = line.split(/[,|\t]|\s{2,}/).map((p) => p.trim()).filter(Boolean);
      const code = (parts[0] ?? "").replace(/\s+/g, "");
      if (!code) continue;
      if (codes.has(code.toLowerCase())) { skipped.push(code); continue; }
      const name = parts[1] || code.split(/[_.-]/).pop() || code;
      const pkgName = parts[2] ?? "";
      const pkg = packages.find((p) => p.name.toLowerCase().replace(/\s+/g, "") === pkgName.toLowerCase().replace(/\s+/g, ""));
      const { error } = await admin.from("customers").insert({
        customer_code: code,
        full_name: name.charAt(0).toUpperCase() + name.slice(1),
        mobile: parts[3] ?? "",
        package_id: pkg?.id ?? null,
        monthly_bill: pkg?.monthly_price ?? 0,
        status: "active",
        reseller_id: r.id,
      } as never);
      if (error) { skipped.push(code); continue; }
      codes.add(code.toLowerCase());
      created.push(code);
    }
    await auditLog({ actor_id: context.userId, reseller_id: r.id, action: "customers.import", resource: "customers", details: { created: created.length, skipped: skipped.length } });
    return { created: created.length, skipped: skipped.length, skipped_codes: skipped.slice(0, 30) };
  });

/* -------------------------------- reports -------------------------------- */

export const resellerReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        key: z.enum([
          "bill_generate",
          "bill_sheet",
          "btrc_export",
          "due_customers",
          "manager_balance_log",
          "manager_recharge",
          "otc",
          "payment_history",
          "permanent_discount",
          "s_manager_balance_log",
          "s_manager_recharge",
          "money_receipt",
        ]),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const r = await requireReseller(context.userId, "reports");
    const admin = await getAdminClient();
    const k = data.key;

    if (k === "btrc_export" || k === "bill_generate") {
      const { data: rows } = await admin
        .from("customers")
        .select("id, customer_code, full_name, mobile, nid_number, address, status, monthly_bill, expiry_date, packages(name)")
        .eq("reseller_id", r.id)
        .order("customer_code");
      const list = ((rows ?? []) as unknown as Array<Record<string, unknown>>).map((c) => ({
        customer_code: (c.customer_code as string) ?? null,
        full_name: (c.full_name as string) ?? null,
        mobile: (c.mobile as string) ?? null,
        nid_number: (c.nid_number as string) ?? null,
        address: (c.address as string) ?? null,
        package: ((c.packages as { name?: string } | null)?.name ?? null) as string | null,
        monthly_bill: Number(c.monthly_bill ?? 0),
        status: (c.status as string) ?? null,
        expiry_date: (c.expiry_date as string) ?? null,
      })) as Row[];
      return { rows: list };
    }

    if (k === "bill_sheet" || k === "due_customers" || k === "permanent_discount") {
      let q = admin
        .from("bills")
        .select("id, bill_number, billing_month, amount, discount, paid_amount, due_amount, status, due_date, customers(full_name, customer_code)")
        .eq("reseller_id", r.id)
        .order("billing_month", { ascending: false })
        .limit(500);
      if (k === "due_customers") q = q.gt("due_amount", 0);
      if (k === "permanent_discount") q = q.gt("discount", 0);
      const { data: rows } = await q;
      const list = ((rows ?? []) as unknown as Array<Record<string, unknown>>).map((b) => ({
        bill_number: (b.bill_number as string) ?? null,
        customer: ((b.customers as { full_name?: string } | null)?.full_name ?? null) as string | null,
        customer_code: ((b.customers as { customer_code?: string } | null)?.customer_code ?? null) as string | null,
        billing_month: (b.billing_month as string) ?? null,
        amount: Number(b.amount ?? 0),
        discount: Number(b.discount ?? 0),
        paid_amount: Number(b.paid_amount ?? 0),
        due_amount: Number(b.due_amount ?? 0),
        status: (b.status as string) ?? null,
        due_date: (b.due_date as string) ?? null,
      })) as Row[];
      return { rows: list };
    }

    if (k === "payment_history" || k === "money_receipt" || k === "otc") {
      let q = admin
        .from("payments")
        .select("id, receipt_number, amount, method, paid_at, transaction_id, bill_id, notes, customers(full_name, customer_code)")
        .eq("reseller_id", r.id)
        .order("paid_at", { ascending: false })
        .limit(500);
      if (k === "otc") q = q.is("bill_id", null);
      const { data: rows } = await q;
      const list = ((rows ?? []) as unknown as Array<Record<string, unknown>>).map((p) => ({
        receipt_number: (p.receipt_number as string) ?? null,
        customer: ((p.customers as { full_name?: string } | null)?.full_name ?? null) as string | null,
        customer_code: ((p.customers as { customer_code?: string } | null)?.customer_code ?? null) as string | null,
        amount: Number(p.amount ?? 0),
        method: (p.method as string) ?? null,
        transaction_id: (p.transaction_id as string) ?? null,
        paid_at: ((p.paid_at as string) ?? "").slice(0, 19).replace("T", " "),
        notes: (p.notes as string) ?? null,
      })) as Row[];
      return { rows: list };
    }

    // balance logs & recharges come from the audit trail
    const { data: rows } = await admin
      .from("reseller_audit_log")
      .select("id, action, resource, actor_email, details, created_at")
      .eq("reseller_id", r.id)
      .order("created_at", { ascending: false })
      .limit(300);
    const all = ((rows ?? []) as unknown as Array<Record<string, unknown>>).map((a) => ({
      action: (a.action as string) ?? null,
      resource: (a.resource as string) ?? null,
      actor: (a.actor_email as string) ?? null,
      details: a.details ? JSON.stringify(a.details) : null,
      created_at: ((a.created_at as string) ?? "").slice(0, 19).replace("T", " "),
    })) as Row[];
    const isRecharge = k === "manager_recharge" || k === "s_manager_recharge";
    return {
      rows: all.filter((a) =>
        isRecharge
          ? String(a.action ?? "").includes("balance")
          : String(a.action ?? "").includes("balance") || String(a.action ?? "").includes("reseller"),
      ),
    };
  });

/* ------------------------------ admin section ---------------------------- */

export const resellerAdminData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ section: z.enum(["employees", "location", "users"]) }).parse(d))
  .handler(async ({ context, data }) => {
    const r = await requireReseller(context.userId, "admin");
    const admin = await getAdminClient();

    if (data.section === "employees") {
      if (!r.manager_staff_id) return { rows: [] as Row[] };
      const { data: rows } = await admin
        .from("staff")
        .select("id, staff_code, full_name, designation, department, mobile, email, status")
        .eq("id", r.manager_staff_id);
      return { rows: (rows ?? []) as Row[] };
    }

    if (data.section === "location") {
      const { data: zones } = await admin.from("zones").select("id, name, description").order("name");
      const { data: custs } = await admin.from("customers").select("zone_id").eq("reseller_id", r.id);
      const counts = new Map<string, number>();
      ((custs ?? []) as Array<{ zone_id: string | null }>).forEach((c) => {
        if (c.zone_id) counts.set(c.zone_id, (counts.get(c.zone_id) ?? 0) + 1);
      });
      const list = ((zones ?? []) as Array<{ id: string; name: string; description: string | null }>)
        .filter((z) => !r.zone_id || z.id === r.zone_id || counts.has(z.id))
        .map((z) => ({ id: z.id, name: z.name, description: z.description, customers: counts.get(z.id) ?? 0 })) as Row[];
      return { rows: list };
    }

    const { data: rows } = await admin
      .from("customers")
      .select("id, customer_code, full_name, email, mobile, user_id, status")
      .eq("reseller_id", r.id)
      .order("created_at", { ascending: false })
      .limit(300);
    return {
      rows: ((rows ?? []) as unknown as Array<Record<string, unknown>>).map((c) => ({
        id: (c.id as string) ?? null,
        customer_code: (c.customer_code as string) ?? null,
        full_name: (c.full_name as string) ?? null,
        email: (c.email as string) ?? null,
        mobile: (c.mobile as string) ?? null,
        status: (c.status as string) ?? null,
        has_login: !!c.user_id,
      })) as Row[],
    };
  });

/** Create a customer-portal login for one of the reseller's own customers. */
export const resellerCreateCustomerUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ customer_id: z.string().uuid(), email: z.string().email(), password: z.string().min(6).max(72) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const r = await requireReseller(context.userId, "customers", "create");
    await assertOwnedCustomer(r.id, data.customer_id);
    const admin = await getAdminClient();
    const { data: created, error } = await (
      admin as unknown as {
        auth: { admin: { createUser: (a: unknown) => Promise<{ data: { user: { id: string } | null }; error: { message: string } | null }> } };
      }
    ).auth.admin.createUser({ email: data.email, password: data.password, email_confirm: true });
    if (error) throw new Error(error.message);
    const uid = created.user?.id;
    if (!uid) throw new Error("Login creation failed");
    await admin.from("user_roles").upsert({ user_id: uid, role: "customer" } as never, { onConflict: "user_id,role" } as never);
    await admin.from("customers").update({ user_id: uid, email: data.email } as never).eq("id", data.customer_id);
    await auditLog({ actor_id: context.userId, reseller_id: r.id, action: "customer.login_created", resource: "customers", resource_id: data.customer_id });
    return { ok: true };
  });

/** Areas under the reseller's POP / zone. */
export const resellerAreas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const r = await requireReseller(context.userId, "pop");
    const admin = await getAdminClient();
    const { data: custs } = await admin
      .from("customers")
      .select("mohalla, road_name, zones(name)")
      .eq("reseller_id", r.id);
    const map = new Map<string, Row>();
    ((custs ?? []) as unknown as Array<Record<string, unknown>>).forEach((c) => {
      const area = (c.mohalla as string) || "—";
      const zone = ((c.zones as { name?: string } | null)?.name ?? "—") as string;
      const key = `${zone}|${area}`;
      const cur = map.get(key) ?? { zone, area, customers: 0 };
      cur.customers = Number(cur.customers ?? 0) + 1;
      map.set(key, cur);
    });
    return { rows: [...map.values()] };
  });
