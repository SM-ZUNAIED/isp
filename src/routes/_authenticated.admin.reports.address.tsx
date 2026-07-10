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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { getAddressRevenue } from "@/lib/reports.functions";

export const Route = createFileRoute("/_authenticated/admin/reports/address")({
  head: () => ({ meta: [{ title: "ঠিকানা-ভিত্তিক আয় — Net Bill Pro" }] }),
  component: AddressReportsPage,
});

const bn = new Intl.NumberFormat("bn-BD");
const bdt = (n: number) => `৳ ${bn.format(Math.round(n))}`;

type GroupBy = "division" | "district" | "upazila" | "union" | "area";
const GROUPS: { value: GroupBy; label: string }[] = [
  { value: "division", label: "বিভাগ অনুযায়ী" },
  { value: "district", label: "জেলা অনুযায়ী" },
  { value: "upazila", label: "উপজেলা অনুযায়ী" },
  { value: "union", label: "ইউনিয়ন অনুযায়ী" },
  { value: "area", label: "এরিয়া/মহল্লা অনুযায়ী" },
];

function AddressReportsPage() {
  const [groupBy, setGroupBy] = useState<GroupBy>("district");
  const [divisionId, setDivisionId] = useState<number | null>(null);
  const [districtId, setDistrictId] = useState<number | null>(null);
  const [upazilaId, setUpazilaId] = useState<number | null>(null);
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth() - 5, 1);
  const [from, setFrom] = useState(first.toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10));

  const divQ = useQuery({
    queryKey: ["addr", "divisions"],
    queryFn: async () => {
      const { data } = await supabase.from("divisions").select("id,name,bn_name").order("name");
      return data ?? [];
    },
    staleTime: 10 * 60_000,
  });
  const disQ = useQuery({
    queryKey: ["addr", "districts", divisionId],
    enabled: divisionId != null,
    queryFn: async () => {
      const { data } = await supabase.from("districts")
        .select("id,name,bn_name").eq("division_id", divisionId!).order("name");
      return data ?? [];
    },
    staleTime: 10 * 60_000,
  });
  const upzQ = useQuery({
    queryKey: ["addr", "upazilas", districtId],
    enabled: districtId != null,
    queryFn: async () => {
      const { data } = await supabase.from("upazilas")
        .select("id,name,bn_name").eq("district_id", districtId!).order("name");
      return data ?? [];
    },
    staleTime: 10 * 60_000,
  });

  const fetchReport = useServerFn(getAddressRevenue);
  const reportQ = useQuery({
    queryKey: ["addr-report", groupBy, divisionId, districtId, upazilaId, from, to],
    queryFn: () => fetchReport({ data: { group_by: groupBy, division_id: divisionId, district_id: districtId, upazila_id: upazilaId, from, to } }),
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
          <h1 className="text-2xl md:text-3xl font-bold">ঠিকানা-ভিত্তিক আয় বিশ্লেষণ</h1>
          <p className="text-muted-foreground text-sm">
            জোন-নিরপেক্ষ, সম্পূর্ণ ঠিকানা স্তর অনুযায়ী বিলিং, কালেকশন ও বকেয়া রিপোর্ট।
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="space-y-1.5">
            <Label className="text-xs">গ্রুপিং</Label>
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {GROUPS.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <FilterCombo label="বিভাগ" rows={divQ.data ?? []} value={divisionId}
            onChange={(v) => { setDivisionId(v); setDistrictId(null); setUpazilaId(null); }} />
          <FilterCombo label="জেলা" rows={disQ.data ?? []} value={districtId}
            disabled={divisionId == null}
            onChange={(v) => { setDistrictId(v); setUpazilaId(null); }} />
          <FilterCombo label="উপজেলা" rows={upzQ.data ?? []} value={upazilaId}
            disabled={districtId == null} onChange={setUpazilaId} />
          <div className="space-y-1.5">
            <Label className="text-xs">From (billing month)</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Wallet className="h-5 w-5" />} tone="from-blue-500 to-indigo-600"
          label="মোট বিলিং" value={bdt(totals.billed)} sub={`${bn.format(rows.length)} টি ${GROUPS.find(g => g.value === groupBy)?.label ?? ""}`} />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} tone="from-emerald-500 to-teal-600"
          label="মোট কালেকশন" value={bdt(totals.collected)} sub={`${bn.format(Math.round(collectionRate))}% আদায়`} />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} tone="from-rose-500 to-orange-500"
          label="বকেয়া" value={bdt(totals.due)} sub={totals.due > 0 ? "অ্যাকশন প্রয়োজন" : "সব ক্লিয়ার"} />
        <StatCard icon={<Users className="h-5 w-5" />} tone="from-purple-500 to-fuchsia-600"
          label="কাস্টমার" value={bn.format(totals.customers)} sub="এই ফিল্টারে" />
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm font-semibold">
              {GROUPS.find(g => g.value === groupBy)?.label} — বিস্তারিত
            </div>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={rows.length === 0}>
              <Download className="h-4 w-4 mr-1" /> CSV এক্সপোর্ট
            </Button>
          </div>

          {reportQ.isLoading ? (
            <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">এই ফিল্টারে কোনো ডেটা নেই।</div>
          ) : (
            <div className="rounded-xl border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ঠিকানা</TableHead>
                    <TableHead className="text-right">কাস্টমার</TableHead>
                    <TableHead className="text-right">বিল</TableHead>
                    <TableHead className="text-right">বিলিং (৳)</TableHead>
                    <TableHead className="text-right">কালেকশন (৳)</TableHead>
                    <TableHead className="text-right">বকেয়া (৳)</TableHead>
                    <TableHead className="min-w-[160px]">আদায় হার</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.key}>
                      <TableCell className="font-medium">{r.label}</TableCell>
                      <TableCell className="text-right">{bn.format(r.customers)}</TableCell>
                      <TableCell className="text-right">{bn.format(r.bills)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span>{bn.format(Math.round(r.billed))}</span>
                          <div className="h-1 w-24 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-gradient-primary"
                              style={{ width: `${maxBilled > 0 ? (r.billed / maxBilled) * 100 : 0}%` }} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-emerald-600 font-medium">
                        {bn.format(Math.round(r.collected))}
                      </TableCell>
                      <TableCell className="text-right text-rose-600 font-medium">
                        {bn.format(Math.round(r.due))}
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

function FilterCombo({
  label, rows, value, onChange, disabled,
}: {
  label: string;
  rows: Array<{ id: number | string; name: string; bn_name: string | null }>;
  value: number | null;
  onChange: (v: number | null) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Select disabled={disabled}
        value={value == null ? "__all__" : String(value)}
        onValueChange={(v) => onChange(v === "__all__" ? null : Number(v))}>
        <SelectTrigger><SelectValue placeholder={disabled ? "নিষ্ক্রিয়" : "সব"} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">সব {label}</SelectItem>
          {rows.map((r) => (
            <SelectItem key={String(r.id)} value={String(r.id)}>{r.bn_name || r.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
