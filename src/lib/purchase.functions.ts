import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============ VENDORS ============
export const listVendors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("vendors").select("*").order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const VendorInput = z.object({
  name: z.string().min(1),
  contact_person: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const createVendor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => VendorInput.parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("vendors").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateVendor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => VendorInput.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("vendors").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteVendor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("vendors").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ PURCHASE ORDERS ============
export const listPOs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("purchase_orders")
      .select("*, vendor:vendor_id(name)")
      .order("order_date", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const POInput = z.object({
  vendor_id: z.string().uuid().optional().nullable(),
  order_date: z.string(),
  expected_date: z.string().optional().nullable(),
  subtotal: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().default(0),
  tax: z.number().nonnegative().default(0),
  total: z.number().nonnegative().default(0),
  notes: z.string().optional().nullable(),
});

export const createPO = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => POInput.parse(d))
  .handler(async ({ context, data }) => {
    const po_number = "PO-" + Date.now().toString(36).toUpperCase();
    const { error } = await context.supabase
      .from("purchase_orders")
      .insert({ ...data, po_number, status: "draft", created_by: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setPOStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["draft", "ordered", "received", "cancelled"]),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("purchase_orders").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePO = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("purchase_orders").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
