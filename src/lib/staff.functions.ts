import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(
  supabase: ReturnType<typeof import("@supabase/supabase-js").createClient>,
  userId: string,
) {
  const { data } = await (
    supabase as unknown as {
      rpc: (name: string, args: unknown) => Promise<{ data: boolean | null }>;
    }
  ).rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("শুধুমাত্র Admin অনুমোদিত");
}

export type StaffRow = {
  id: string;
  user_id: string | null;
  staff_code: string;
  full_name: string;
  mobile: string | null;
  email: string | null;
  designation: string | null;
  department: string | null;
  joining_date: string | null;
  salary: number;
  status: "active" | "inactive";
  address: string | null;
  nid: string | null;
  avatar_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  linked_user_email?: string | null;
};

const StaffInput = z.object({
  staff_code: z.string().trim().min(1).max(40),
  full_name: z.string().trim().min(2).max(120),
  mobile: z.string().trim().max(20).nullable().optional(),
  email: z.string().trim().email().max(200).nullable().optional().or(z.literal("").transform(() => null)),
  designation: z.string().trim().max(120).nullable().optional(),
  department: z.string().trim().max(120).nullable().optional(),
  joining_date: z.string().nullable().optional(),
  salary: z.number().nonnegative().optional().default(0),
  status: z.enum(["active", "inactive"]).default("active"),
  address: z.string().trim().max(500).nullable().optional(),
  nid: z.string().trim().max(40).nullable().optional(),
  avatar_url: z.string().trim().max(500).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
  user_id: z.string().uuid().nullable().optional(),
});

export const listStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<StaffRow[]> => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("staff")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as StaffRow[];
    const userIds = rows.map((r) => r.user_id).filter((v): v is string => !!v);
    if (userIds.length) {
      const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const emailMap = new Map((users?.users ?? []).map((u) => [u.id, u.email ?? null]));
      rows.forEach((r) => {
        r.linked_user_email = r.user_id ? emailMap.get(r.user_id) ?? null : null;
      });
    }
    return rows;
  });

export const createStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => StaffInput.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // If user_id given, ensure not already linked to another staff.
    if (data.user_id) {
      const { data: existing } = await supabaseAdmin
        .from("staff").select("id").eq("user_id", data.user_id).maybeSingle();
      if (existing) throw new Error("এই ইউজার অন্য একজন Staff-এর সাথে যুক্ত");
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("staff")
      .insert({
        staff_code: data.staff_code,
        full_name: data.full_name,
        mobile: data.mobile ?? null,
        email: data.email ?? null,
        designation: data.designation ?? null,
        department: data.department ?? null,
        joining_date: data.joining_date ?? null,
        salary: data.salary ?? 0,
        status: data.status,
        address: data.address ?? null,
        nid: data.nid ?? null,
        avatar_url: data.avatar_url ?? null,
        notes: data.notes ?? null,
        user_id: data.user_id ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: inserted.id };
  });

export const updateStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid() }).merge(StaffInput.partial()).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.user_id) {
      const { data: existing } = await supabaseAdmin
        .from("staff").select("id").eq("user_id", data.user_id).maybeSingle();
      if (existing && existing.id !== data.id) {
        throw new Error("এই ইউজার অন্য একজন Staff-এর সাথে যুক্ত");
      }
    }

    const { id, ...rest } = data;
    const patch: Record<string, unknown> = {};
    Object.entries(rest).forEach(([k, v]) => {
      if (v !== undefined) patch[k] = v === "" ? null : v;
    });

    const { error } = await supabaseAdmin.from("staff").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("staff").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type AssignableUser = { id: string; email: string | null; full_name: string | null };

export const listAssignableUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AssignableUser[]> => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: users }, { data: profiles }, { data: staff }] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 }),
      supabaseAdmin.from("profiles").select("id, full_name"),
      supabaseAdmin.from("staff").select("user_id"),
    ]);
    const usedIds = new Set((staff ?? []).map((s) => s.user_id).filter(Boolean));
    const profMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
    return (users?.users ?? [])
      .filter((u) => !usedIds.has(u.id))
      .map((u) => ({
        id: u.id,
        email: u.email ?? null,
        full_name: profMap.get(u.id) ?? (u.user_metadata?.full_name as string | undefined) ?? null,
      }));
  });
