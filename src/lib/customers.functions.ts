import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CustomerStatus = z.enum(["active", "pending", "suspended", "expired"]);

export const listCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("customers")
      .select("id, customer_code, full_name, mobile, address, address_line, division_id, district_id, upazila_id, union_id, post_office_id, village_id, area_id, road_id, building_id, status, monthly_bill, package_id, zone_id, expiry_date, created_at, packages(name), zones(name)")
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
