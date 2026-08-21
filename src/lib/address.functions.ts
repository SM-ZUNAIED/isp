import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const AddressInput = z.object({
  division_id: z.number().int().nullable(),
  district_id: z.number().int().nullable(),
  upazila_id: z.number().int().nullable(),
  union_id: z.string().uuid().nullable(),
  post_office_id: z.string().uuid().nullable(),
  village_id: z.string().uuid().nullable(),
  area_id: z.string().uuid().nullable(),
  road_id: z.string().uuid().nullable(),
  building_id: z.string().uuid().nullable(),
  mohalla: z.string().trim().max(200).nullable().optional(),
  road_name: z.string().trim().max(200).nullable().optional(),
  holding_no: z.string().trim().max(200).nullable().optional(),
  address_line: z.string().trim().max(500).nullable(),
});

/** Direct update of the signed-in customer's present address. */
export const updateMyAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AddressInput.parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("customers")
      .update({
        division_id: data.division_id,
        district_id: data.district_id,
        upazila_id: data.upazila_id,
        union_id: data.union_id,
        post_office_id: data.post_office_id,
        village_id: data.village_id,
        area_id: data.area_id,
        road_id: data.road_id,
        building_id: data.building_id,
        mohalla: data.mohalla ?? null,
        road_name: data.road_name ?? null,
        holding_no: data.holding_no ?? null,
        address_line: data.address_line,
        address: data.address_line, // keep legacy field in sync for older reports
      })
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ Quick-add child levels (union → building) ============ */
/* Shared reference catalogue: only admin/manager/staff may append rows.
   Name fields are strictly length-capped to prevent abuse. */

const nameField = z.string().trim().min(1).max(100);
const optName = z.string().trim().max(100).optional().nullable();

type Ctx = { supabase: unknown; userId: string };

async function assertStaff(context: Ctx) {
  const sb = context.supabase as {
    rpc: (name: string, args: unknown) => Promise<{ data: boolean | null }>;
  };
  for (const role of ["admin", "manager", "staff"] as const) {
    const { data } = await sb.rpc("has_role", { _user_id: context.userId, _role: role });
    if (data) return;
  }
  throw new Error("শুধুমাত্র Admin / Manager / Staff অনুমোদিত");
}

export const createUnionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ upazila_id: z.number().int(), name: nameField, bn_name: optName }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertStaff(context as unknown as Ctx);
    const { data: row, error } = await context.supabase
      .from("unions").insert(data).select("id, name, bn_name").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const createPostOfficeFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ union_id: z.string().uuid(), name: nameField, bn_name: optName }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertStaff(context as unknown as Ctx);
    const { data: row, error } = await context.supabase
      .from("post_offices").insert(data).select("id, name, bn_name").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const createVillageFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ post_office_id: z.string().uuid(), name: nameField, bn_name: optName }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertStaff(context as unknown as Ctx);
    const { data: row, error } = await context.supabase
      .from("villages").insert(data).select("id, name, bn_name").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const createAreaFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ village_id: z.string().uuid(), name: nameField, bn_name: optName }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertStaff(context as unknown as Ctx);
    const { data: row, error } = await context.supabase
      .from("areas").insert(data).select("id, name, bn_name").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const createRoadFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ area_id: z.string().uuid(), name: nameField, bn_name: optName }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertStaff(context as unknown as Ctx);
    const { data: row, error } = await context.supabase
      .from("roads").insert(data).select("id, name, bn_name").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const createBuildingFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      road_id: z.string().uuid(),
      name: nameField,
      holding_number: z.string().trim().max(50).optional().nullable(),
      house_number: z.string().trim().max(50).optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertStaff(context as unknown as Ctx);
    const { data: row, error } = await context.supabase
      .from("buildings").insert(data).select("id, name, holding_number, house_number").single();
    if (error) throw new Error(error.message);
    return row;
  });
