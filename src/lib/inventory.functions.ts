import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============ ITEMS ============
export const listItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("inventory_items").select("*").order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const ItemInput = z.object({
  name: z.string().min(1),
  sku: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  unit: z.string().default("pcs"),
  reorder_level: z.number().nonnegative().default(0),
  cost_price: z.number().nonnegative().default(0),
  sale_price: z.number().nonnegative().default(0),
  notes: z.string().optional().nullable(),
});

export const createItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ItemInput.parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("inventory_items").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ItemInput.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("inventory_items").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("inventory_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ WAREHOUSES ============
export const listWarehouses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("warehouses").select("*").order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ============ MOVEMENTS ============
export const listMovements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("stock_movements")
      .select("*, item:item_id(name,sku,unit), warehouse:warehouse_id(name)")
      .order("moved_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const MoveInput = z.object({
  item_id: z.string().uuid(),
  warehouse_id: z.string().uuid().optional().nullable(),
  move_type: z.enum(["in", "out", "transfer", "adjust"]),
  quantity: z.number().positive(),
  unit_cost: z.number().nonnegative().default(0),
  notes: z.string().optional().nullable(),
});

export const createMovement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => MoveInput.parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("stock_movements")
      .insert({ ...data, moved_by: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMovement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("stock_movements").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
