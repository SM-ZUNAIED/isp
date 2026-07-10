import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CustomerStatus = z.enum(["active", "pending", "suspended", "expired"]);

export const listCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("customers")
      .select("id, customer_code, full_name, mobile, alt_mobile, address, address_line, division_id, district_id, upazila_id, union_id, post_office_id, village_id, area_id, road_id, building_id, status, monthly_bill, package_id, zone_id, expiry_date, created_at, packages(name), zones(name)")
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
      "id, customer_code, full_name, mobile, address, address_line, status, monthly_bill, expiry_date, created_at, pppoe_username, pppoe_password, division_id, district_id, upazila_id, union_id, post_office_id, village_id, area_id, road_id, building_id, packages(name, monthly_price), zones(name)",
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
