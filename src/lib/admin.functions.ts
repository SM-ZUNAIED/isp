import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type DashboardStats = {
  totalCustomers: number;
  activeCustomers: number;
  monthlyRevenue: number;
  pendingBills: number;
  openTickets: number;
  onlineDevices: number;
  role: "admin" | "staff" | "customer" | null;
};

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "staff"])
      .maybeSingle();

    const role = (roleRow?.role ?? "customer") as DashboardStats["role"];

    const [customersAll, customersActive, bills, tickets, mikrotiks] = await Promise.all([
      supabase.from("customers").select("id", { count: "exact", head: true }),
      supabase.from("customers").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("bills").select("amount,status"),
      supabase.from("tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("mikrotiks").select("id", { count: "exact", head: true }).eq("status", "online"),
    ]);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { data: paidThisMonth } = await supabase
      .from("payments")
      .select("amount,paid_at")
      .gte("paid_at", monthStart.toISOString());

    const monthlyRevenue = (paidThisMonth ?? []).reduce(
      (s, r) => s + Number(r.amount ?? 0),
      0,
    );
    const pendingBills = (bills.data ?? []).filter((b) => b.status !== "paid").length;

    return {
      totalCustomers: customersAll.count ?? 0,
      activeCustomers: customersActive.count ?? 0,
      monthlyRevenue,
      pendingBills,
      openTickets: tickets.count ?? 0,
      onlineDevices: mikrotiks.count ?? 0,
      role,
    } satisfies DashboardStats;
  });

export const claimOwnerRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if ((count ?? 0) > 0) {
      return { ok: false, reason: "admin_exists" as const };
    }

    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });

    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
