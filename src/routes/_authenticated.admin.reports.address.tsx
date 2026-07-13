import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart3, TrendingUp, Wallet, AlertTriangle, Users, Loader2, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { getAddressRevenue } from "@/lib/reports.functions";
import { useTx, useFmt } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/reports/address")({
  head: () => ({ meta: [{ title: "Address-based Revenue — Net Bill Pro" }] }),
  component: AddressReportsPage,
});

type GroupBy = "area" | "road" | "building";

function AddressReportsPage() {
  const tx = useTx();
  const { n, bdt } = useFmt();
  const [areaId, setAreaId] = useState<string | null>(null);
  const [roadId, setRoadId] = useState<string | null>(null);
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const groupBy: GroupBy = buildingId ? "building" : roadId ? "road" : "area";
  const currentGroupLabel =
    groupBy === "area" ? tx("এরিয়া অনুযায়ী", "By Area")
    : groupBy === "road" ? tx("রোড অনুযায়ী", "By Road")
    : tx("হাউস নং অনুযায়ী", "By House No");

  const areasQ = useQuery({
    queryKey: ["addr-filter", "areas"],
    queryFn: async () => {
      const { data } = await supabase.from("areas").select("id,name,bn_name").order("name").limit(2000);
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
  const roadsQ = useQuery({
    queryKey: ["addr-filter", "roads", areaId],
    enabled: !!areaId,
    queryFn: async () => {
      const { data } = await supabase.from("roads").select("id,name,bn_name").eq("area_id", areaId!).order("name").limit(2000);
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
  const buildingsQ = useQuery({
    queryKey: ["addr-filter", "buildings", roadId],
    enabled: !!roadId,
    queryFn: async () => {
      const { data } = await supabase.from("buildings").select("id,name,house_number,holding_number").eq("road_id", roadId!).order("name").limit(2000);
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });

  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth() - 5, 1);
  const [from, setFrom] = useState(first.toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10));

  const fetchReport = useServerFn(getAddressRevenue);
  const reportQ = useQuery({
    queryKey: ["addr-report", groupBy, areaId, roadId, buildingId, from, to],
    queryFn: () => fetchReport({ data: { group_by: groupBy, area_id: areaId, road_id: roadId, building_id: buildingId, from, to } }),
  });

  const rows = reportQ.data?.rows ?? [];
  const totals = reportQ.data?.totals ?? { billed: 0, collected: 0, due: 0, customers: 0 };
  const maxBilled = useMemo(() => rows.reduce((m, r) => Math.max(m, r.billed), 0), [rows]);
  const collectionRate = totals.billed > 0 ? (totals.collected / totals.billed) * 100 : 0;

  const exportCsv = () => {
    const header = "Address,Customers,Bills,Billed,Collected,Due,Collection%";
    const lines = rows.map((r) =>
      [r.label, r.customers, r.bills, r.billed, r.collected, r.due, r.collection_rate]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
    );
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `address-revenue-${groupBy}-${from}_${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-white shadow-soft">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{tx("ঠিকানা-ভিত্তিক আয় বিশ্লেষণ", "Address-based Revenue Analysis")}</h1>
          <p className="text-muted-foreground text-sm">
            {tx(
              "জোন-নিরপেক্ষ, সম্পূর্ণ ঠিকানা স্তর অনুযায়ী বিলিং, কালেকশন ও বকেয়া রিপোর্ট।",
              "Zone-agnostic billing, collection, and due report by full address hierarchy.",
            )}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <FilterSelect
              label={tx("এরিয়া", "Area")}
              placeholder={tx("সব এরিয়া", "All areas")}
              value={areaId}
              options={(areasQ.data ?? []).map((r) => ({ id: String(r.id), label: r.bn_name || r.name }))}
              onChange={(v) => { setAreaId(v); setRoadId(null); setBuildingId(null); }}
            />
            <FilterSelect
              label={tx("রোড", "Road")}
              placeholder={areaId ? tx("সব রোড", "All roads") : tx("এরিয়া নির্বাচন করুন", "Select area first")}
              value={roadId}
              disabled={!areaId}
              options={(roadsQ.data ?? []).map((r) => ({ id: String(r.id), label: r.bn_name || r.name }))}
              onChange={(v) => { setRoadId(v); setBuildingId(null); }}
            />
            <FilterSelect
              label={tx("হাউস নং", "House No")}
              placeholder={roadId ? tx("সব হাউস", "All houses") : tx("রোড নির্বাচন করুন", "Select road first")}
              value={buildingId}
              disabled={!roadId}
              options={(buildingsQ.data ?? []).map((r) => ({
                id: String(r.id),
                label: r.house_number ? `${r.name} (${r.house_number})` : r.holding_number ? `${r.name} (${r.holding_number})` : r.name,
              }))}
              onChange={setBuildingId}
            />
            <div className="space-y-1.5">
              <Label className="text-xs">{tx("শুরু (বিলিং মাস)", "From (billing month)")}</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{tx("শেষ", "To")}</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Wallet className="h-5 w-5" />} tone="from-blue-500 to-indigo-600"
          label={tx("মোট বিলিং", "Total Billed")} value={bdt(totals.billed)}
          sub={tx(`${n(rows.length)} টি ${currentGroupLabel}`, `${n(rows.length)} ${currentGroupLabel.toLowerCase()}`)} />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} tone="from-emerald-500 to-teal-600"
          label={tx("মোট কালেকশন", "Total Collected")} value={bdt(totals.collected)}
          sub={tx(`${n(Math.round(collectionRate))}% আদায়`, `${n(Math.round(collectionRate))}% collected`)} />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} tone="from-rose-500 to-orange-500"
          label={tx("বকেয়া", "Due")} value={bdt(totals.due)}
          sub={totals.due > 0 ? tx("অ্যাকশন প্রয়োজন", "Action needed") : tx("সব ক্লিয়ার", "All clear")} />
        <StatCard icon={<Users className="h-5 w-5" />} tone="from-purple-500 to-fuchsia-600"
          label={tx("কাস্টমার", "Customers")} value={n(totals.customers)} sub={tx("এই ফিল্টারে", "In this filter")} />
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm font-semibold">
              {currentGroupLabel} — {tx("বিস্তারিত", "Details")}
            </div>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={rows.length === 0}>
              <Download className="h-4 w-4 mr-1" /> {tx("CSV এক্সপোর্ট", "Export CSV")}
            </Button>
          </div>

          {reportQ.isLoading ? (
            <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              {tx("এই ফিল্টারে কোনো ডেটা নেই।", "No data for this filter.")}
            </div>
          ) : (
            <div className="rounded-xl border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tx("ঠিকানা", "Address")}</TableHead>
                    <TableHead className="text-right">{tx("কাস্টমার", "Customers")}</TableHead>
                    <TableHead className="text-right">{tx("বিল", "Bills")}</TableHead>
                    <TableHead className="text-right">{tx("বিলিং (৳)", "Billed (BDT)")}</TableHead>
                    <TableHead className="text-right">{tx("কালেকশন (৳)", "Collected (BDT)")}</TableHead>
                    <TableHead className="text-right">{tx("বকেয়া (৳)", "Due (BDT)")}</TableHead>
                    <TableHead className="min-w-[160px]">{tx("আদায় হার", "Collection Rate")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.key}>
                      <TableCell className="font-medium">{r.label}</TableCell>
                      <TableCell className="text-right">{n(r.customers)}</TableCell>
                      <TableCell className="text-right">{n(r.bills)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span>{n(Math.round(r.billed))}</span>
                          <div className="h-1 w-24 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-gradient-primary"
                              style={{ width: `${maxBilled > 0 ? (r.billed / maxBilled) * 100 : 0}%` }} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-emerald-600 font-medium">
                        {n(Math.round(r.collected))}
                      </TableCell>
                      <TableCell className="text-right text-rose-600 font-medium">
                        {n(Math.round(r.due))}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={r.collection_rate} className="h-2 flex-1" />
                          <span className="text-xs w-10 text-right">{r.collection_rate}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, sub, tone }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; tone: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex items-start gap-3">
        <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-soft`}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-bold truncate">{value}</div>
          {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  label, placeholder, value, options, onChange, disabled,
}: {
  label: string;
  placeholder: string;
  value: string | null;
  options: Array<{ id: string; label: string }>;
  onChange: (v: string | null) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Select
        disabled={disabled}
        value={value ?? "__all__"}
        onValueChange={(v) => onChange(v === "__all__" ? null : v)}
      >
        <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{placeholder}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

