import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  assertAdmin,
  assertOwnedCustomer,
  auditLog,
  defaultPermissionRows,
  getAdminClient,
  getResellerByUser,
  getResellerPerms,
  requireReseller,
  type ResellerRow,
} from "@/lib/reseller.server";
import {
  DEFAULT_RESELLER_MODULES,
  RESELLER_MODULES,
  type ResellerModuleKey,
  type ResellerPerm,
} from "@/lib/reseller-keys";

/* ---------------------------------- admin --------------------------------- */

export const listResellers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as never, context.userId, true);
    const admin = await getAdminClient();
    const [{ data: rows }, { data: custs }, { data: perms }] = await Promise.all([
      admin.from("resellers").select("*").order("created_at", { ascending: false }),
      admin.from("customers").select("reseller_id").not("reseller_id", "is", null),
      admin.from("reseller_permissions").select("reseller_id, can_view"),
    ]);
    const counts = new Map<string, number>();
    (custs ?? []).forEach((c: { reseller_id: string | null }) => {
      if (c.reseller_id) counts.set(c.reseller_id, (counts.get(c.reseller_id) ?? 0) + 1);
    });
    const access = new Map<string, number>();
    (perms ?? []).forEach((p: { reseller_id: string; can_view: boolean }) => {
      if (p.can_view) access.set(p.reseller_id, (access.get(p.reseller_id) ?? 0) + 1);
    });
    return ((rows ?? []) as ResellerRow[]).map((r) => ({
      ...r,
      customer_count: counts.get(r.id) ?? 0,
      module_count: access.get(r.id) ?? 0,
    }));
  });

export const listResellerRefs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as never, context.userId, true);
    const admin = await getAdminClient();
    const [mg, mt, pk, zn] = await Promise.all([
      admin.from("staff").select("id, full_name, designation").eq("status", "active").order("full_name"),
      admin.from("mikrotiks").select("id, name").order("name"),
      admin.from("packages").select("id, name, monthly_price").order("monthly_price"),
      admin.from("zones").select("id, name").order("name"),
    ]);
    return {
      managers: (mg.data ?? []) as Array<{ id: string; full_name: string; designation: string | null }>,
      mikrotiks: (mt.data ?? []) as Array<{ id: string; name: string }>,
      packages: (pk.data ?? []) as Array<{ id: string; name: string; monthly_price: number }>,
      zones: (zn.data ?? []) as Array<{ id: string; name: string }>,
    };
  });

export const createReseller = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().trim().min(2).max(120),
        business_name: z.string().trim().max(160).optional().nullable(),
        username: z.string().trim().regex(/^[a-zA-Z0-9._-]{3,40}$/),
        email: z.string().email(),
        phone: z.string().trim().max(20).optional().nullable(),
        address: z.string().trim().max(300).optional().nullable(),
        status: z.enum(["active", "inactive", "suspended"]).default("active"),
        password: z.string().min(6).max(72),
        opening_balance: z.number().default(0),
        credit_limit: z.number().default(0),
        commission_percent: z.number().min(0).max(100).default(0),
        manager_staff_id: z.string().uuid().optional().nullable(),
        mikrotik_id: z.string().uuid().optional().nullable(),
        package_id: z.string().uuid().optional().nullable(),
        zone_id: z.string().uuid().optional().nullable(),
        notes: z.string().max(1000).optional().nullable(),
        modules: z.array(z.string()).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const admin = await getAdminClient();

    const { data: created, error: authErr } = await (
      admin as unknown as {
        auth: { admin: { createUser: (a: unknown) => Promise<{ data: { user: { id: string } | null }; error: { message: string } | null }> } };
      }
    ).auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.name, mobile: data.phone ?? null },
    });
    if (authErr) throw new Error(authErr.message);
    const userId = created.user?.id;
    if (!userId) throw new Error("রিসেলার লগইন তৈরি ব্যর্থ");

    await admin.from("user_roles").upsert({ user_id: userId, role: "reseller" } as never, { onConflict: "user_id,role" } as never);

    const { data: row, error } = await admin
      .from("resellers")
      .insert({
        user_id: userId,
        name: data.name,
        business_name: data.business_name ?? null,
        username: data.username,
        email: data.email,
        phone: data.phone ?? null,
        address: data.address ?? null,
        status: data.status,
        opening_balance: data.opening_balance,
        current_balance: data.opening_balance,
        credit_limit: data.credit_limit,
        commission_percent: data.commission_percent,
        manager_staff_id: data.manager_staff_id ?? null,
        mikrotik_id: data.mikrotik_id ?? null,
        package_id: data.package_id ?? null,
        zone_id: data.zone_id ?? null,
        notes: data.notes ?? null,
        created_by: context.userId,
      } as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const enabled = ((data.modules?.length ? data.modules : DEFAULT_RESELLER_MODULES) as ResellerModuleKey[]).filter(
      (k) => RESELLER_MODULES.includes(k),
    );
    await admin.from("reseller_permissions").insert(defaultPermissionRows((row as { id: string }).id, enabled) as never);

    await auditLog({
      actor_id: context.userId,
      reseller_id: (row as { id: string }).id,
      action: "reseller.created",
      resource: "resellers",
      resource_id: (row as { id: string }).id,
      details: { username: data.username, modules: enabled },
    });

    return { ok: true, id: (row as { id: string }).id };
  });

export const updateReseller = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().trim().min(2).max(120).optional(),
        business_name: z.string().trim().max(160).optional().nullable(),
        email: z.string().email().optional(),
        phone: z.string().trim().max(20).optional().nullable(),
        address: z.string().trim().max(300).optional().nullable(),
        status: z.enum(["active", "inactive", "suspended"]).optional(),
        credit_limit: z.number().optional(),
        commission_percent: z.number().min(0).max(100).optional(),
        current_balance: z.number().optional(),
        manager_staff_id: z.string().uuid().optional().nullable(),
        mikrotik_id: z.string().uuid().optional().nullable(),
        package_id: z.string().uuid().optional().nullable(),
        zone_id: z.string().uuid().optional().nullable(),
        notes: z.string().max(1000).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const admin = await getAdminClient();
    const { id, ...patch } = data;
    const { data: before } = await admin.from("resellers").select("*").eq("id", id).maybeSingle();
    const { error } = await admin.from("resellers").update(patch as never).eq("id", id);
    if (error) throw new Error(error.message);
    await auditLog({
      actor_id: context.userId,
      reseller_id: id,
      action: "reseller.updated",
      resource: "resellers",
      resource_id: id,
      details: { before, after: patch },
    });
    return { ok: true };
  });

export const resetResellerPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), password: z.string().min(6).max(72) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const admin = await getAdminClient();
    const { data: r } = await admin.from("resellers").select("user_id").eq("id", data.id).maybeSingle();
    const uid = (r as { user_id: string | null } | null)?.user_id;
    if (!uid) throw new Error("রিসেলারের লগইন অ্যাকাউন্ট নেই");
    const { error } = await (
      admin as unknown as {
        auth: { admin: { updateUserById: (id: string, a: unknown) => Promise<{ error: { message: string } | null }> } };
      }
    ).auth.admin.updateUserById(uid, { password: data.password });
    if (error) throw new Error(error.message);
    await auditLog({ actor_id: context.userId, reseller_id: data.id, action: "reseller.password_reset", resource: "resellers", resource_id: data.id });
    return { ok: true };
  });

export const deleteReseller = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const admin = await getAdminClient();
    // Soft delete — customer data stays intact and admin-visible.
    const { error } = await admin.from("resellers").update({ status: "deleted" } as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    await auditLog({ actor_id: context.userId, reseller_id: data.id, action: "reseller.deleted", resource: "resellers", resource_id: data.id });
    return { ok: true };
  });

export const adminGetResellerPermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ reseller_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<ResellerPerm[]> => {
    await assertAdmin(context.supabase as never, context.userId, true);
    return getResellerPerms(data.reseller_id);
  });

export const adminSetResellerPermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        reseller_id: z.string().uuid(),
        permissions: z.array(
          z.object({
            permission_key: z.string().min(1).max(48),
            can_view: z.boolean(),
            can_create: z.boolean(),
            can_edit: z.boolean(),
            can_delete: z.boolean(),
          }),
        ),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const admin = await getAdminClient();
    const rows = data.permissions
      .filter((p) => RESELLER_MODULES.includes(p.permission_key as ResellerModuleKey))
      .map((p) => ({ ...p, reseller_id: data.reseller_id }));
    const { error } = await admin
      .from("reseller_permissions")
      .upsert(rows as never, { onConflict: "reseller_id,permission_key" } as never);
    if (error) throw new Error(error.message);
    await auditLog({
      actor_id: context.userId,
      reseller_id: data.reseller_id,
      action: "reseller.permissions_changed",
      resource: "reseller_permissions",
      resource_id: data.reseller_id,
      details: { after: rows },
    });
    return { ok: true };
  });

export const listResellerAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as never, context.userId, true);
    const admin = await getAdminClient();
    const { data } = await admin
      .from("reseller_audit_log")
      .select("id, action, resource, resource_id, reseller_id, created_at, details")
      .order("created_at", { ascending: false })
      .limit(100);
    return data ?? [];
  });

/* -------------------------------- reseller -------------------------------- */

export const getMyResellerContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const reseller = await getResellerByUser(context.userId);
    if (!reseller) return { reseller: null, permissions: [] as ResellerPerm[] };
    const permissions = await getResellerPerms(reseller.id);
    return { reseller, permissions };
  });

export const resellerDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const r = await requireReseller(context.userId, "dashboard");
    const admin = await getAdminClient();
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);

    const [{ data: customers }, { data: bills }, { data: payments }] = await Promise.all([
      admin.from("customers").select("id, status, expiry_date, created_at, monthly_bill").eq("reseller_id", r.id),
      admin.from("bills").select("amount, paid_amount, due_amount, status, billing_month").eq("reseller_id", r.id),
      admin.from("payments").select("amount, paid_at").eq("reseller_id", r.id),
    ]);

    const cs = (customers ?? []) as Array<{ status: string; expiry_date: string | null; created_at: string; monthly_bill: number }>;
    const bs = (bills ?? []) as Array<{ amount: number; paid_amount: number | null; due_amount: number | null; status: string }>;
    const ps = (payments ?? []) as Array<{ amount: number; paid_at: string }>;
    const nowIso = today.toISOString().slice(0, 10);

    const count = (fn: (c: (typeof cs)[number]) => boolean) => cs.filter(fn).length;
    return {
      reseller: { name: r.name, balance: Number(r.current_balance) },
      cards: {
        total: cs.length,
        active: count((c) => c.status === "active"),
        deactive: count((c) => c.status === "suspended"),
        pending: count((c) => c.status === "pending"),
        expired: count((c) => c.status === "expired" || (!!c.expiry_date && c.expiry_date < nowIso)),
        disabled: count((c) => c.status === "no_payment"),
        free: count((c) => Number(c.monthly_bill) === 0),
        newThisMonth: count((c) => c.created_at.slice(0, 10) >= monthStart),
      },
      billing: {
        amount: bs.reduce((s, b) => s + Number(b.amount ?? 0), 0),
        collection: ps.reduce((s, p) => s + Number(p.amount ?? 0), 0),
        due: bs.reduce((s, b) => s + Number(b.due_amount ?? Math.max(0, Number(b.amount ?? 0) - Number(b.paid_amount ?? 0))), 0),
      },
      collectionThisMonth: ps.filter((p) => (p.paid_at ?? "").slice(0, 10) >= monthStart).reduce((s, p) => s + Number(p.amount ?? 0), 0),
    };
  });

export const resellerCustomers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        q: z.string().trim().max(120).optional(),
        status: z.string().max(24).optional(),
        expire_from: z.string().max(20).optional(),
        expire_to: z.string().max(20).optional(),
        zone_id: z.string().uuid().optional(),
        package_id: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(500).default(200),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ context, data }) => {
    // Customer Search shares data with Customers; either permission unlocks reads.
    const r = await requireReseller(context.userId, "customers").catch(() =>
      requireReseller(context.userId, "customer_search"),
    );
    const admin = await getAdminClient();
    let query = admin
      .from("customers")
      .select(
        "id, customer_code, full_name, mobile, email, address, status, monthly_bill, expiry_date, created_at, package_id, zone_id, pppoe_username, packages(name), zones(name)",
      )
      .eq("reseller_id", r.id)
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (data.status) query = query.eq("status", data.status);
    if (data.zone_id) query = query.eq("zone_id", data.zone_id);
    if (data.package_id) query = query.eq("package_id", data.package_id);
    if (data.expire_from) query = query.gte("expiry_date", data.expire_from);
    if (data.expire_to) query = query.lte("expiry_date", data.expire_to);
    if (data.q) {
      const esc = data.q.replace(/[%,()]/g, "");
      query = query.or(
        `full_name.ilike.%${esc}%,customer_code.ilike.%${esc}%,mobile.ilike.%${esc}%,pppoe_username.ilike.%${esc}%`,
      );
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const resellerCreateCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        customer_code: z.string().trim().min(1).max(64),
        full_name: z.string().trim().min(2).max(160),
        mobile: z.string().trim().max(20).default(""),
        email: z.string().email().optional().nullable().or(z.literal("").transform(() => null)),
        address: z.string().trim().max(300).optional().nullable(),
        package_id: z.string().uuid().optional().nullable(),
        zone_id: z.string().uuid().optional().nullable(),
        monthly_bill: z.number().nonnegative().default(0),
        status: z.enum(["active", "pending", "suspended", "expired", "no_payment"]).default("pending"),
        pppoe_username: z.string().trim().max(64).optional().nullable(),
        pppoe_password: z.string().trim().max(64).optional().nullable(),
        ip_address: z.string().trim().max(64).optional().nullable(),
        onu_mac: z.string().trim().max(64).optional().nullable(),
        notes: z.string().max(1000).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const r = await requireReseller(context.userId, "customers", "create");
    const admin = await getAdminClient();
    // reseller_id always comes from the session, never from the payload.
    const { data: row, error } = await admin
      .from("customers")
      .insert({ ...data, reseller_id: r.id } as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await auditLog({
      actor_id: context.userId, reseller_id: r.id, action: "customer.created",
      resource: "customers", resource_id: (row as { id: string }).id,
    });
    return { ok: true, id: (row as { id: string }).id };
  });

export const resellerUpdateCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        full_name: z.string().trim().min(2).max(160).optional(),
        mobile: z.string().trim().max(20).optional(),
        address: z.string().trim().max(300).optional().nullable(),
        package_id: z.string().uuid().optional().nullable(),
        zone_id: z.string().uuid().optional().nullable(),
        monthly_bill: z.number().nonnegative().optional(),
        status: z.enum(["active", "pending", "suspended", "expired", "no_payment"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const r = await requireReseller(context.userId, "customers", "edit");
    await assertOwnedCustomer(r.id, data.id);
    const admin = await getAdminClient();
    const { id, ...patch } = data;
    const { error } = await admin.from("customers").update(patch as never).eq("id", id).eq("reseller_id", r.id);
    if (error) throw new Error(error.message);
    await auditLog({ actor_id: context.userId, reseller_id: r.id, action: "customer.updated", resource: "customers", resource_id: id, details: patch });
    return { ok: true };
  });

export const resellerDeleteCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const r = await requireReseller(context.userId, "customers", "delete");
    await assertOwnedCustomer(r.id, data.id);
    const admin = await getAdminClient();
    const { error } = await admin.from("customers").delete().eq("id", data.id).eq("reseller_id", r.id);
    if (error) throw new Error(error.message);
    await auditLog({ actor_id: context.userId, reseller_id: r.id, action: "customer.deleted", resource: "customers", resource_id: data.id });
    return { ok: true };
  });

export const resellerPackages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireReseller(context.userId, "package");
    const admin = await getAdminClient();
    const { data } = await admin
      .from("packages")
      .select("id, name, download_speed, upload_speed, monthly_price, setup_charge, is_active, is_popular")
      .order("monthly_price");
    return data ?? [];
  });

export const resellerRefs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const reseller = await getResellerByUser(context.userId);
    if (!reseller || reseller.status !== "active") throw new Error("Unauthorized");
    const admin = await getAdminClient();
    const [pk, zn] = await Promise.all([
      admin.from("packages").select("id, name, monthly_price").eq("is_active", true).order("monthly_price"),
      admin.from("zones").select("id, name").order("name"),
    ]);
    return { packages: pk.data ?? [], zones: zn.data ?? [] };
  });

export const resellerAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const r = await requireReseller(context.userId, "accounts");
    const admin = await getAdminClient();
    const [{ data: bills }, { data: pays }] = await Promise.all([
      admin.from("bills").select("id, bill_number, billing_month, amount, paid_amount, due_amount, status, due_date, customer_id").eq("reseller_id", r.id).order("billing_month", { ascending: false }).limit(300),
      admin.from("payments").select("id, receipt_number, amount, method, paid_at, transaction_id, customer_id").eq("reseller_id", r.id).order("paid_at", { ascending: false }).limit(300),
    ]);
    const bs = (bills ?? []) as Array<{ amount: number; paid_amount: number | null; due_amount: number | null }>;
    const ps = (pays ?? []) as Array<{ amount: number }>;
    return {
      summary: {
        opening_balance: Number(r.opening_balance),
        current_balance: Number(r.current_balance),
        credit_limit: Number(r.credit_limit),
        commission_percent: Number(r.commission_percent),
        billed: bs.reduce((s, b) => s + Number(b.amount ?? 0), 0),
        collected: ps.reduce((s, p) => s + Number(p.amount ?? 0), 0),
        due: bs.reduce((s, b) => s + Number(b.due_amount ?? 0), 0),
      },
      bills: bills ?? [],
      payments: pays ?? [],
    };
  });

export const resellerAccountsHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      from: z.string().max(20).optional(),
      to: z.string().max(20).optional(),
      q: z.string().max(120).optional(),
    }).parse(d ?? {}),
  )
  .handler(async ({ context, data }) => {
    const r = await requireReseller(context.userId, "accounts_history");
    const admin = await getAdminClient();
    let q = admin
      .from("payments")
      .select("id, receipt_number, amount, method, paid_at, transaction_id, notes, customer_id, customers(full_name, customer_code)")
      .eq("reseller_id", r.id)
      .order("paid_at", { ascending: false })
      .limit(300);
    if (data.from) q = q.gte("paid_at", data.from);
    if (data.to) q = q.lte("paid_at", `${data.to}T23:59:59`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const term = (data.q ?? "").toLowerCase();
    const list = (rows ?? []) as unknown as Array<Record<string, string | number | null>>;
    return term
      ? list.filter((x) => JSON.stringify(x).toLowerCase().includes(term))
      : list;
  });

export const resellerReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const r = await requireReseller(context.userId, "reports");
    const admin = await getAdminClient();
    const [{ data: customers }, { data: bills }, { data: pays }] = await Promise.all([
      admin.from("customers").select("status, monthly_bill, package_id, packages(name)").eq("reseller_id", r.id),
      admin.from("bills").select("billing_month, amount, due_amount").eq("reseller_id", r.id),
      admin.from("payments").select("amount, paid_at, method").eq("reseller_id", r.id),
    ]);
    const byPackage = new Map<string, number>();
    ((customers ?? []) as Array<{ packages: { name: string } | null }>).forEach((c) => {
      const n = c.packages?.name ?? "—";
      byPackage.set(n, (byPackage.get(n) ?? 0) + 1);
    });
    const byMonth = new Map<string, { billed: number; due: number }>();
    ((bills ?? []) as Array<{ billing_month: string; amount: number; due_amount: number | null }>).forEach((b) => {
      const m = (b.billing_month ?? "").slice(0, 7);
      const cur = byMonth.get(m) ?? { billed: 0, due: 0 };
      cur.billed += Number(b.amount ?? 0);
      cur.due += Number(b.due_amount ?? 0);
      byMonth.set(m, cur);
    });
    const byMethod = new Map<string, number>();
    ((pays ?? []) as Array<{ method: string; amount: number }>).forEach((p) => {
      byMethod.set(p.method, (byMethod.get(p.method) ?? 0) + Number(p.amount ?? 0));
    });
    return {
      byPackage: [...byPackage].map(([name, count]) => ({ name, count })),
      byMonth: [...byMonth].map(([month, v]) => ({ month, ...v })).sort((a, b) => (a.month < b.month ? 1 : -1)).slice(0, 12),
      byMethod: [...byMethod].map(([method, total]) => ({ method, total })),
      totals: {
        customers: (customers ?? []).length,
        mrr: ((customers ?? []) as Array<{ monthly_bill: number }>).reduce((s, c) => s + Number(c.monthly_bill ?? 0), 0),
      },
    };
  });

export const resellerTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const r = await requireReseller(context.userId, "support");
    const admin = await getAdminClient();
    const { data } = await admin
      .from("tickets")
      .select("id, ticket_number, subject, category, status, created_at, customer_id, customers(full_name, customer_code)")
      .eq("reseller_id", r.id)
      .order("created_at", { ascending: false })
      .limit(200);
    return data ?? [];
  });

export const resellerCreateTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      customer_id: z.string().uuid(),
      subject: z.string().trim().min(3).max(160),
      description: z.string().trim().max(2000).optional().nullable(),
      category: z.enum(["no_internet", "slow_speed", "payment_issue", "router_issue", "onu_issue", "other"]).default("other"),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const r = await requireReseller(context.userId, "support", "create");
    await assertOwnedCustomer(r.id, data.customer_id);
    const admin = await getAdminClient();
    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;
    const { error } = await admin.from("tickets").insert({
      ...data, ticket_number: ticketNumber, status: "pending", reseller_id: r.id,
    } as never);
    if (error) throw new Error(error.message);
    await auditLog({ actor_id: context.userId, reseller_id: r.id, action: "ticket.created", resource: "tickets", resource_id: ticketNumber });
    return { ok: true, ticket_number: ticketNumber };
  });

export const resellerNetwork = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ module: z.enum(["mikrotik", "manager", "pop"]) }).parse(d))
  .handler(async ({ context, data }) => {
    const r = await requireReseller(context.userId, data.module);
    const admin = await getAdminClient();
    if (data.module === "mikrotik") {
      if (!r.mikrotik_id) return { rows: [] as Array<Record<string, unknown>> };
      // Credentials are never exposed to the reseller.
      const { data: rows } = await admin
        .from("mikrotiks")
        .select("id, name, ip_address, is_online, cpu_load, ram_usage, last_checked_at")
        .eq("id", r.mikrotik_id);
      return { rows: (rows ?? []) as Array<Record<string, unknown>> };
    }
    if (data.module === "manager") {
      if (!r.manager_staff_id) return { rows: [] as Array<Record<string, unknown>> };
      const { data: rows } = await admin
        .from("staff")
        .select("id, staff_code, full_name, designation, mobile, email, status")
        .eq("id", r.manager_staff_id);
      return { rows: (rows ?? []) as Array<Record<string, unknown>> };
    }
    // POP = Point of Presence, modelled by zones in this system.
    const { data: rows } = await admin
      .from("zones")
      .select("id, name, description")
      .eq(r.zone_id ? "id" : "id", r.zone_id ?? "00000000-0000-0000-0000-000000000000");
    return { rows: (rows ?? []) as Array<Record<string, unknown>> };
  });

export const resellerSmsLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const r = await requireReseller(context.userId, "sms");
    const admin = await getAdminClient();
    const { data: cust } = await admin.from("customers").select("id").eq("reseller_id", r.id);
    const ids = ((cust ?? []) as Array<{ id: string }>).map((c) => c.id);
    if (!ids.length) return [];
    const { data } = await admin
      .from("notifications_log")
      .select("id, channel, recipient, message, event_type, status, created_at")
      .in("customer_id", ids)
      .order("created_at", { ascending: false })
      .limit(200);
    return data ?? [];
  });

export const updateMyResellerProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      name: z.string().trim().min(2).max(120),
      business_name: z.string().trim().max(160).optional().nullable(),
      phone: z.string().trim().max(20).optional().nullable(),
      address: z.string().trim().max(300).optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const reseller = await getResellerByUser(context.userId);
    if (!reseller || reseller.status !== "active") throw new Error("Unauthorized");
    const admin = await getAdminClient();
    // Permissions, balance, status and username are never self-editable.
    const { error } = await admin.from("resellers").update(data as never).eq("id", reseller.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
