import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CustomerStatus = z.enum(["active", "pending", "suspended", "expired"]);

export const listCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("customers")
      .select("id, customer_code, full_name, mobile, alt_mobile, email, address, address_line, division_id, district_id, upazila_id, union_id, post_office_id, village_id, area_id, road_id, building_id, mohalla, road_name, holding_no, status, monthly_bill, package_id, zone_id, expiry_date, created_at, packages(name), zones(name)")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listPackagesAndZones = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [pk, zn] = await Promise.all([
      context.supabase.from("packages").select("id, name, monthly_price").order("monthly_price"),
      context.supabase.from("zones").select("id, name").order("name"),
    ]);
    return { packages: pk.data ?? [], zones: zn.data ?? [] };
  });

const CreateInput = z.object({
  customer_code: z.string().min(1),
  full_name: z.string().min(1),
  mobile: z.string().min(1),
  alt_mobile: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("").transform(() => null)),
  address: z.string().optional().nullable(),
  address_line: z.string().optional().nullable(),
  division_id: z.number().int().optional().nullable(),
  district_id: z.number().int().optional().nullable(),
  upazila_id: z.number().int().optional().nullable(),
  union_id: z.string().uuid().optional().nullable(),
  post_office_id: z.string().uuid().optional().nullable(),
  village_id: z.string().uuid().optional().nullable(),
  area_id: z.string().uuid().optional().nullable(),
  road_id: z.string().uuid().optional().nullable(),
  building_id: z.string().uuid().optional().nullable(),
  mohalla: z.string().optional().nullable(),
  road_name: z.string().optional().nullable(),
  holding_no: z.string().optional().nullable(),
  package_id: z.string().uuid().optional().nullable(),
  zone_id: z.string().uuid().optional().nullable(),
  monthly_bill: z.number().nonnegative().default(0),
  status: CustomerStatus.default("pending"),
  pppoe_username: z.string().optional().nullable(),
  pppoe_password: z.string().optional().nullable(),
});

export const createCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateInput.parse(d))
  .handler(async ({ context, data }) => {
    const { error, data: row } = await context.supabase
      .from("customers")
      .insert(data)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateCustomerStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), status: CustomerStatus }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("customers")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const UpdateInput = CreateInput.extend({ id: z.string().uuid() });

export const updateCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateInput.parse(d))
  .handler(async ({ context, data }) => {
    const { id, ...patch } = data;
    const { error } = await context.supabase
      .from("customers").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("customers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getCustomerDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: c, error } = await supabase.from("customers").select(
      "id, customer_code, full_name, mobile, alt_mobile, address, address_line, status, monthly_bill, expiry_date, created_at, pppoe_username, pppoe_password, division_id, district_id, upazila_id, union_id, post_office_id, village_id, area_id, road_id, building_id, mohalla, road_name, holding_no, packages(name, monthly_price), zones(name)",
    ).eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!c) throw new Error("কাস্টমার পাওয়া যায়নি");

    const [dv, ds, up, un, po, vi, ar, rd, bd, bills, pays] = await Promise.all([
      c.division_id != null ? supabase.from("divisions").select("id,name,bn_name").eq("id", c.division_id).maybeSingle() : Promise.resolve({ data: null }),
      c.district_id != null ? supabase.from("districts").select("id,name,bn_name").eq("id", c.district_id).maybeSingle() : Promise.resolve({ data: null }),
      c.upazila_id != null ? supabase.from("upazilas").select("id,name,bn_name").eq("id", c.upazila_id).maybeSingle() : Promise.resolve({ data: null }),
      c.union_id ? supabase.from("unions").select("id,name,bn_name").eq("id", c.union_id).maybeSingle() : Promise.resolve({ data: null }),
      c.post_office_id ? supabase.from("post_offices").select("id,name,bn_name,code").eq("id", c.post_office_id).maybeSingle() : Promise.resolve({ data: null }),
      c.village_id ? supabase.from("villages").select("id,name,bn_name").eq("id", c.village_id).maybeSingle() : Promise.resolve({ data: null }),
      c.area_id ? supabase.from("areas").select("id,name,bn_name").eq("id", c.area_id).maybeSingle() : Promise.resolve({ data: null }),
      c.road_id ? supabase.from("roads").select("id,name,bn_name").eq("id", c.road_id).maybeSingle() : Promise.resolve({ data: null }),
      c.building_id ? supabase.from("buildings").select("id,name,holding_number,house_number,google_map_url").eq("id", c.building_id).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from("bills").select("id, bill_number, billing_month, amount, paid_amount, due_amount, due_date, status").eq("customer_id", c.id).order("billing_month", { ascending: false }).limit(24),
      supabase.from("payments").select("id, receipt_number, amount, method, paid_at, transaction_id").eq("customer_id", c.id).order("paid_at", { ascending: false }).limit(24),
    ]);

    return {
      customer: c,
      address: {
        division: dv.data, district: ds.data, upazila: up.data,
        union: un.data, post_office: po.data, village: vi.data,
        area: ar.data, road: rd.data, building: bd.data,
      },
      bills: bills.data ?? [],
      payments: pays.data ?? [],
    };
  });

const BulkRow = z.object({
  customer_code: z.string().min(1).max(64),
  full_name: z.string().min(1).max(200),
  package_name: z.string().min(1).max(200),
});

export const bulkImportCustomers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ rows: z.array(BulkRow).min(1).max(500) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;

    const [pkgRes, custRes] = await Promise.all([
      supabase.from("packages").select("id, name, monthly_price"),
      supabase.from("customers").select("customer_code"),
    ]);
    if (pkgRes.error) throw new Error(pkgRes.error.message);
    if (custRes.error) throw new Error(custRes.error.message);

    const pkgByName = new Map<string, { id: string; monthly_price: number | string }>();
    for (const p of pkgRes.data ?? []) {
      pkgByName.set(String(p.name).trim().toLowerCase(), { id: p.id, monthly_price: p.monthly_price });
    }
    const existing = new Set<string>(
      (custRes.data ?? []).map((c) => String(c.customer_code).trim().toLowerCase()),
    );

    const toInsert: Array<Record<string, unknown>> = [];
    const failed: Array<{ line: number; reason: string }> = [];
    let skipped = 0;
    const seenInBatch = new Set<string>();

    data.rows.forEach((r, idx) => {
      const line = idx + 1;
      const code = r.customer_code.trim();
      const name = r.full_name.trim();
      const pkgKey = r.package_name.trim().toLowerCase();
      const codeKey = code.toLowerCase();

      if (existing.has(codeKey) || seenInBatch.has(codeKey)) {
        skipped++;
        return;
      }
      const pkg = pkgByName.get(pkgKey);
      if (!pkg) {
        failed.push({ line, reason: `Package not found: ${r.package_name}` });
        return;
      }
      seenInBatch.add(codeKey);
      toInsert.push({
        customer_code: code,
        full_name: name,
        mobile: "",
        package_id: pkg.id,
        monthly_bill: Number(pkg.monthly_price) || 0,
        status: "pending",
      });
    });

    let added = 0;
    if (toInsert.length > 0) {
      const { error, data: inserted } = await supabase
        .from("customers")
        .insert(toInsert)
        .select("id");
      if (error) throw new Error(error.message);
      added = inserted?.length ?? 0;
    }

    return { added, skipped, failed };
  });
