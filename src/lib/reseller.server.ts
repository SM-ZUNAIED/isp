// Server-only helpers for the reseller system. Never import from client code.
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  RESELLER_MODULES,
  VIEW_ONLY_MODULES,
  type ResellerModuleKey,
  type ResellerPerm,
} from "./reseller-keys";

type AnyClient = SupabaseClient<never, never, never>;

export type ResellerRow = {
  id: string;
  user_id: string | null;
  name: string;
  business_name: string | null;
  username: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  opening_balance: number;
  current_balance: number;
  credit_limit: number;
  commission_percent: number;
  manager_staff_id: string | null;
  mikrotik_id: string | null;
  package_id: string | null;
  zone_id: string | null;
  notes: string | null;
  last_login_at: string | null;
  created_at: string;
};

export async function getAdminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as AnyClient;
}

export async function hasRole(supabase: AnyClient, userId: string, role: string): Promise<boolean> {
  const { data } = await (supabase as unknown as {
    rpc: (n: string, a: unknown) => Promise<{ data: boolean | null }>;
  }).rpc("has_role", { _user_id: userId, _role: role });
  return !!data;
}

/** Throws unless the caller is a main-system admin (managers allowed for read-only flows). */
export async function assertAdmin(supabase: AnyClient, userId: string, allowManager = false) {
  if (await hasRole(supabase, userId, "admin")) return;
  if (allowManager && (await hasRole(supabase, userId, "manager"))) return;
  throw new Error("শুধুমাত্র Admin অনুমোদিত / Admin only");
}

export async function auditLog(entry: {
  actor_id: string;
  reseller_id?: string | null;
  action: string;
  resource?: string;
  resource_id?: string | null;
  details?: unknown;
}) {
  const admin = await getAdminClient();
  await admin.from("reseller_audit_log").insert({
    actor_id: entry.actor_id,
    reseller_id: entry.reseller_id ?? null,
    action: entry.action,
    resource: entry.resource ?? null,
    resource_id: entry.resource_id ?? null,
    details: (entry.details ?? null) as never,
  } as never);
}

export function defaultPermissionRows(resellerId: string, enabled: ResellerModuleKey[]): Array<Record<string, unknown>> {
  return RESELLER_MODULES.map((k) => {
    const on = enabled.includes(k);
    const viewOnly = VIEW_ONLY_MODULES.includes(k) || k === "admin";
    return {
      reseller_id: resellerId,
      permission_key: k,
      can_view: on,
      can_create: on && !viewOnly,
      can_edit: on && !viewOnly,
      can_delete: false,
    };
  });
}

/** Resolve the reseller identity from the AUTHENTICATED user id only. */
export async function getResellerByUser(userId: string): Promise<ResellerRow | null> {
  const admin = await getAdminClient();
  const { data } = await admin
    .from("resellers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as ResellerRow | null) ?? null;
}

export async function getResellerPerms(resellerId: string): Promise<ResellerPerm[]> {
  const admin = await getAdminClient();
  const { data } = await admin
    .from("reseller_permissions")
    .select("permission_key, can_view, can_create, can_edit, can_delete")
    .eq("reseller_id", resellerId);
  return (data ?? []) as unknown as ResellerPerm[];
}

export type Action = "view" | "create" | "edit" | "delete";

/**
 * Backend authorization gate for every reseller API call.
 * Returns the reseller row scoped to the authenticated session.
 */
export async function requireReseller(
  userId: string,
  moduleKey: ResellerModuleKey,
  action: Action = "view",
): Promise<ResellerRow> {
  const reseller = await getResellerByUser(userId);
  if (!reseller) throw new Error("Unauthorized: reseller account not found");
  if (reseller.status !== "active") throw new Error("Unauthorized: reseller account is not active");

  const perms = await getResellerPerms(reseller.id);
  const p = perms.find((x) => x.permission_key === moduleKey);
  const allowed =
    !!p &&
    (action === "view"
      ? p.can_view
      : action === "create"
        ? p.can_view && p.can_create
        : action === "edit"
          ? p.can_view && p.can_edit
          : p.can_view && p.can_delete);
  if (!allowed) throw new Error(`Forbidden: no ${action} access to ${moduleKey}`);
  return reseller;
}

/** Verify a record belongs to the reseller before returning/modifying it. */
export async function assertOwnedCustomer(resellerId: string, customerId: string) {
  const admin = await getAdminClient();
  const { data } = await admin
    .from("customers")
    .select("id")
    .eq("id", customerId)
    .eq("reseller_id", resellerId)
    .maybeSingle();
  if (!data) throw new Error("Forbidden: record does not belong to this reseller");
}
