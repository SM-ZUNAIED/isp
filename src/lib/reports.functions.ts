import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const FilterInput = z.object({
  division_id: z.number().int().nullable().optional(),
  district_id: z.number().int().nullable().optional(),
  upazila_id: z.number().int().nullable().optional(),
  group_by: z.enum(["division", "district", "upazila", "union", "area"]).default("district"),
  from: z.string().nullable().optional(),
  to: z.string().nullable().optional(),
});

type BillRow = {
  amount: number | null;
  paid_amount: number | null;
  due_amount: number | null;
  status: string | null;
  billing_month: string | null;
  customer_id: string;
};

type CustRow = {
  id: string;
  division_id: number | null;
  district_id: number | null;
  upazila_id: number | null;
  union_id: string | null;
  area_id: string | null;
};

export const getAddressRevenue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => FilterInput.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase } = context;

    // 1) fetch customers with address ids (apply upstream filters)
    let cq = supabase.from("customers").select(
      "id, division_id, district_id, upazila_id, union_id, area_id",
    ).limit(20000);
    if (data.division_id != null) cq = cq.eq("division_id", data.division_id);
    if (data.district_id != null) cq = cq.eq("district_id", data.district_id);
    if (data.upazila_id != null) cq = cq.eq("upazila_id", data.upazila_id);
    const { data: custs, error: cErr } = await cq;
    if (cErr) throw new Error(cErr.message);
    const customers = (custs ?? []) as CustRow[];
    const custMap = new Map(customers.map((c) => [c.id, c]));
    const custIds = customers.map((c) => c.id);
    if (custIds.length === 0) {
      return { rows: [], totals: { billed: 0, collected: 0, due: 0, customers: 0 } };
    }

    // 2) fetch bills for those customers (batched IN)
    let bq = supabase.from("bills")
      .select("amount, paid_amount, due_amount, status, billing_month, customer_id")
      .in("customer_id", custIds).limit(50000);
    if (data.from) bq = bq.gte("billing_month", data.from);
    if (data.to) bq = bq.lte("billing_month", data.to);
    const { data: bills, error: bErr } = await bq;
    if (bErr) throw new Error(bErr.message);

    // 3) collect distinct address ids to fetch names
    const divIds = new Set<number>(), disIds = new Set<number>(), upzIds = new Set<number>();
    const unionIds = new Set<string>(), areaIds = new Set<string>();
    for (const c of customers) {
      if (c.division_id != null) divIds.add(c.division_id);
      if (c.district_id != null) disIds.add(c.district_id);
      if (c.upazila_id != null) upzIds.add(c.upazila_id);
      if (c.union_id) unionIds.add(c.union_id);
      if (c.area_id) areaIds.add(c.area_id);
    }
    const [dv, ds, up, un, ar] = await Promise.all([
      divIds.size ? supabase.from("divisions").select("id,name,bn_name").in("id", [...divIds]) : Promise.resolve({ data: [] as { id: number; name: string; bn_name: string | null }[] }),
      disIds.size ? supabase.from("districts").select("id,name,bn_name").in("id", [...disIds]) : Promise.resolve({ data: [] as { id: number; name: string; bn_name: string | null }[] }),
      upzIds.size ? supabase.from("upazilas").select("id,name,bn_name").in("id", [...upzIds]) : Promise.resolve({ data: [] as { id: number; name: string; bn_name: string | null }[] }),
      unionIds.size ? supabase.from("unions").select("id,name,bn_name").in("id", [...unionIds]) : Promise.resolve({ data: [] as { id: string; name: string; bn_name: string | null }[] }),
      areaIds.size ? supabase.from("areas").select("id,name,bn_name").in("id", [...areaIds]) : Promise.resolve({ data: [] as { id: string; name: string; bn_name: string | null }[] }),
    ]);
    const nameOf = (rows: Array<{ id: number | string; name: string; bn_name: string | null }>) => {
      const m = new Map<string, string>();
      for (const r of rows) m.set(String(r.id), r.bn_name || r.name);
      return m;
    };
    const names = {
      division: nameOf(dv.data ?? []),
      district: nameOf(ds.data ?? []),
      upazila: nameOf(up.data ?? []),
      union: nameOf(un.data ?? []),
      area: nameOf(ar.data ?? []),
    };

    // 4) aggregate
    type Bucket = { key: string; label: string; billed: number; collected: number; due: number; customers: Set<string>; bills: number };
    const buckets = new Map<string, Bucket>();
    const totals = { billed: 0, collected: 0, due: 0 };
    const gb = data.group_by;

    for (const b of (bills ?? []) as BillRow[]) {
      const cust = custMap.get(b.customer_id);
      if (!cust) continue;
      const rawId =
        gb === "division" ? cust.division_id :
        gb === "district" ? cust.district_id :
        gb === "upazila" ? cust.upazila_id :
        gb === "union" ? cust.union_id :
        cust.area_id;
      const key = rawId == null ? "__none__" : String(rawId);
      const label = rawId == null ? "— অজানা —" : (names[gb].get(String(rawId)) || `#${rawId}`);
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = { key, label, billed: 0, collected: 0, due: 0, customers: new Set(), bills: 0 };
        buckets.set(key, bucket);
      }
      const amt = Number(b.amount ?? 0);
      const paid = Number(b.paid_amount ?? 0);
      const due = Number(b.due_amount ?? Math.max(0, amt - paid));
      bucket.billed += amt;
      bucket.collected += paid;
      bucket.due += due;
      bucket.customers.add(b.customer_id);
      bucket.bills += 1;
      totals.billed += amt;
      totals.collected += paid;
      totals.due += due;
    }

    const rows = [...buckets.values()]
      .map((b) => ({
        key: b.key, label: b.label,
        billed: Math.round(b.billed * 100) / 100,
        collected: Math.round(b.collected * 100) / 100,
        due: Math.round(b.due * 100) / 100,
        customers: b.customers.size,
        bills: b.bills,
        collection_rate: b.billed > 0 ? Math.round((b.collected / b.billed) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.billed - a.billed);

    return {
      rows,
      totals: {
        billed: Math.round(totals.billed * 100) / 100,
        collected: Math.round(totals.collected * 100) / 100,
        due: Math.round(totals.due * 100) / 100,
        customers: customers.length,
      },
    };
  });
