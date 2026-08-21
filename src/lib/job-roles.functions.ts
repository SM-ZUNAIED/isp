import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type JobRoleRow = {
  id: string;
  name: string;
  bn_name: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

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

const RoleInput = z.object({
  name: z.string().trim().min(2).max(80),
  bn_name: z.string().trim().max(80).nullable().optional(),
  description: z.string().trim().max(500).nullable().optional(),
  is_active: z.boolean().default(true),
});

/** Any signed-in user can read the designation list (used by staff form). */
export const listJobRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<JobRoleRow[]> => {
    const { data, error } = await context.supabase
      .from("job_roles")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as JobRoleRow[];
  });

export const createJobRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RoleInput.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { error } = await context.supabase.from("job_roles").insert(data as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateJobRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    RoleInput.partial().extend({ id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { id, ...patch } = data;
    const { error } = await context.supabase
      .from("job_roles")
      .update(patch as never)
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteJobRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { error } = await context.supabase.from("job_roles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
