import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getErpOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const monthKey = today.slice(0, 7);

    const [
      staffAll, staffActive, attToday, leavesPending,
      itemsAll, movesToday, vendorsAll, poPending,
      inc, exp,
    ] = await Promise.all([
      context.supabase.from("staff").select("id", { count: "exact", head: true }),
      context.supabase.from("staff").select("id", { count: "exact", head: true }).eq("status", "active"),
      context.supabase.from("attendance").select("status").eq("date", today),
      context.supabase.from("leaves").select("id", { count: "exact", head: true }).eq("status", "pending"),
      context.supabase.from("inventory_items").select("id,current_stock,reorder_level"),
      context.supabase.from("stock_movements").select("id", { count: "exact", head: true }).gte("moved_at", today),
      context.supabase.from("vendors").select("id", { count: "exact", head: true }),
      context.supabase.from("purchase_orders").select("id", { count: "exact", head: true }).in("status", ["draft", "ordered"]),
      context.supabase.from("incomes").select("amount,entry_date"),
      context.supabase.from("expenses").select("amount,entry_date"),
    ]);

    const presentToday = (attToday.data ?? []).filter((r) => r.status === "present" || r.status === "late").length;
    const absentToday = (attToday.data ?? []).filter((r) => r.status === "absent").length;
    const lowStock = (itemsAll.data ?? []).filter((i) => Number(i.current_stock) <= Number(i.reorder_level ?? 0)).length;

    const monthInc = (inc.data ?? []).filter((r) => String(r.entry_date).startsWith(monthKey)).reduce((s, r) => s + Number(r.amount ?? 0), 0);
    const monthExp = (exp.data ?? []).filter((r) => String(r.entry_date).startsWith(monthKey)).reduce((s, r) => s + Number(r.amount ?? 0), 0);

    return {
      staff: { total: staffAll.count ?? 0, active: staffActive.count ?? 0, presentToday, absentToday, leavesPending: leavesPending.count ?? 0 },
      inventory: { items: itemsAll.data?.length ?? 0, lowStock, movesToday: movesToday.count ?? 0 },
      purchase: { vendors: vendorsAll.count ?? 0, pendingPO: poPending.count ?? 0 },
      accounting: { monthIncome: monthInc, monthExpense: monthExp, monthProfit: monthInc - monthExp },
    };
  });
