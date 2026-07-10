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
        address_line: data.address_line,
        address: data.address_line, // keep legacy field in sync for older reports
      })
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ Quick-add child levels (union → building) ============ */
/* Reads use the browser client with anon SELECT policies.
   These are for signed-in users to append a missing branch on the fly. */

export const createUnionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ upazila_id: z.number().int(), name: z.string().min(1), bn_name: z.string().optional().nullable() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("unions").insert(data).select("id, name, bn_name").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const createPostOfficeFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ union_id: z.string().uuid(), name: z.string().min(1), bn_name: z.string().optional().nullable() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("post_offices").insert(data).select("id, name, bn_name").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const createVillageFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ post_office_id: z.string().uuid(), name: z.string().min(1), bn_name: z.string().optional().nullable() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("villages").insert(data).select("id, name, bn_name").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const createAreaFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ village_id: z.string().uuid(), name: z.string().min(1), bn_name: z.string().optional().nullable() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("areas").insert(data).select("id, name, bn_name").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const createRoadFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ area_id: z.string().uuid(), name: z.string().min(1), bn_name: z.string().optional().nullable() }).parse(d),
  )
  .handler(async ({ context, data }) => {
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
      name: z.string().min(1),
      holding_number: z.string().optional().nullable(),
      house_number: z.string().optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("buildings").insert(data).select("id, name, holding_number, house_number").single();
    if (error) throw new Error(error.message);
    return row;
  });
