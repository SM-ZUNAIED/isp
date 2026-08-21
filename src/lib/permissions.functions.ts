import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PermissionKey =
  | "dashboard"
  | "customers"
  | "packages"
  | "zones"
  | "address"
  | "address_report"
  | "bills"
  | "payments"
  | "mikrotik"
  | "olt"
  | "tickets"
  | "notices"
  | "hr"
  | "call_center"
  | "staff"
  | "accounts"
  | "users"
  | "settings";

export const PERMISSION_KEYS: PermissionKey[] = [
  "dashboard",
  "customers",
  "packages",
  "zones",
  "address",
  "address_report",
  "bills",
  "payments",
  "mikrotik",
  "olt",
  "tickets",
  "notices",
  "hr",
  "call_center",
  "staff",
  "accounts",
  "users",
  "settings",
];

export const PERMISSION_LABELS: Record<PermissionKey, { bn: string; en: string }> = {
  dashboard: { bn: "ড্যাশবোর্ড", en: "Dashboard" },
  customers: { bn: "কাস্টমার", en: "Customers" },
  packages: { bn: "প্যাকেজ", en: "Packages" },
  zones: { bn: "জোন / এরিয়া", en: "Zones / Areas" },
  address: { bn: "ঠিকানা (BD)", en: "Address (BD)" },
  address_report: { bn: "এরিয়া রিপোর্ট", en: "Area Report" },
  bills: { bn: "বিল", en: "Bills" },
  payments: { bn: "পেমেন্ট লগ", en: "Payment Log" },
  mikrotik: { bn: "MikroTik", en: "MikroTik" },
  olt: { bn: "OLT / ONU", en: "OLT / ONU" },
  tickets: { bn: "সাপোর্ট টিকেট", en: "Support Tickets" },
  notices: { bn: "নোটিশ", en: "Notices" },
  hr: { bn: "এইচআর ম্যানেজমেন্ট", en: "HR Management" },
  call_center: { bn: "স্মার্ট কল সেন্টার", en: "Smart Call Center" },
  staff: { bn: "স্টাফ", en: "Staff" },
  accounts: { bn: "অ্যাকাউন্টস", en: "Accounts" },
  users: { bn: "ইউজার ও রোল", en: "Users & Roles" },
  settings: { bn: "সেটিংস", en: "Settings" },
};

export type PermissionRow = {
  permission_key: PermissionKey;
  can_view: boolean;
  can_edit: boolean;
};

async function isAdmin(
  supabase: ReturnType<typeof import("@supabase/supabase-js").createClient>,
  userId: string,
): Promise<boolean> {
  const { data } = await (
    supabase as unknown as {
      rpc: (name: string, args: unknown) => Promise<{ data: boolean | null }>;
    }
  ).rpc("has_role", { _user_id: userId, _role: "admin" });
  return !!data;
}

async function assertAdmin(
  supabase: ReturnType<typeof import("@supabase/supabase-js").createClient>,
  userId: string,
) {
  if (!(await isAdmin(supabase, userId))) throw new Error("শুধুমাত্র Admin অনুমোদিত");
}

/** Current user's own permission map. Admin gets all-true. */
export const getMyPermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{
    isAdmin: boolean;
    permissions: Record<string, { can_view: boolean; can_edit: boolean }>;
  }> => {
    const admin = await isAdmin(context.supabase as never, context.userId);
    if (admin) {
      const map: Record<string, { can_view: boolean; can_edit: boolean }> = {};
      PERMISSION_KEYS.forEach((k) => (map[k] = { can_view: true, can_edit: true }));
      return { isAdmin: true, permissions: map };
    }
    const { data } = await context.supabase
      .from("user_permissions")
      .select("permission_key, can_view, can_edit")
      .eq("user_id", context.userId);
    const map: Record<string, { can_view: boolean; can_edit: boolean }> = {};
    (data ?? []).forEach((r) => {
      map[r.permission_key as string] = { can_view: !!r.can_view, can_edit: !!r.can_edit };
    });
    return { isAdmin: false, permissions: map };
  });

/** Admin: fetch permissions for a specific user. */
export const getUserPermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<PermissionRow[]> => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("user_permissions")
      .select("permission_key, can_view, can_edit")
      .eq("user_id", data.user_id);
    if (error) throw new Error(error.message);
    return (rows ?? []) as PermissionRow[];
  });

/** Admin: replace all permissions for a user. */
export const setUserPermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      user_id: z.string().uuid(),
      permissions: z.array(
        z.object({
          permission_key: z.string().min(1).max(64),
          can_view: z.boolean(),
          can_edit: z.boolean(),
        }),
      ),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Keep only rows where at least one flag is true; delete the rest.
    const keep = data.permissions.filter((p) => p.can_view || p.can_edit);
    const keepKeys = keep.map((p) => p.permission_key);

    // Delete rows not in keep set
    if (keepKeys.length > 0) {
      const { error: delErr } = await supabaseAdmin
        .from("user_permissions")
        .delete()
        .eq("user_id", data.user_id)
        .not("permission_key", "in", `(${keepKeys.map((k) => `"${k}"`).join(",")})`);
      if (delErr) throw new Error(delErr.message);
    } else {
      const { error: delErr } = await supabaseAdmin
        .from("user_permissions")
        .delete()
        .eq("user_id", data.user_id);
      if (delErr) throw new Error(delErr.message);
    }

    if (keep.length > 0) {
      const rows = keep.map((p) => ({
        user_id: data.user_id,
        permission_key: p.permission_key,
        can_view: p.can_view,
        can_edit: p.can_edit,
      }));
      const { error: upErr } = await supabaseAdmin
        .from("user_permissions")
        .upsert(rows as never, { onConflict: "user_id,permission_key" });
      if (upErr) throw new Error(upErr.message);
    }

    return { ok: true };
  });