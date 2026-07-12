import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getPnL, getTrialBalance } from "@/lib/accounting.functions";
import { useTx, useFmt } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/accounting/reports")({
  head: () => ({ meta: [{ title: "Accounting Reports — Net Bill Pro" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const tx = useTx();
  const { bdt } = useFmt();
  const pnl = useQuery({ queryKey: ["pnl"], queryFn: useServerFn(getPnL) });
  const tb = useQuery({ queryKey: ["tb"], queryFn: useServerFn(getTrialBalance) });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{tx("অ্যাকাউন্টিং রিপোর্ট", "Accounting Reports")}</h1>
        <p className="text-muted-foreground">{tx("P&L, ট্রায়াল ব্যালেন্স", "P&L, Trial Balance")}</p>
      </div>

      {pnl.isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : pnl.data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard tone="emerald" icon={TrendingUp} label={tx("এই মাসের আয়", "Month Income")} value={bdt(pnl.data.monthIncome)} />
            <StatCard tone="rose" icon={TrendingDown} label={tx("এই মাসের ব্যয়", "Month Expense")} value={bdt(pnl.data.monthExpense)} />
            <StatCard tone={pnl.data.monthProfit >= 0 ? "emerald" : "rose"} icon={DollarSign} label={tx("এই মাসের নেট", "Month Net")} value={bdt(pnl.data.monthProfit)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>{tx("আয় ভাঙন", "Income Breakdown")}</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    {Object.entries(pnl.data.byCategoryIncome).map(([k, v]) => (
                      <TableRow key={k}><TableCell>{k}</TableCell><TableCell className="text-right font-medium">{bdt(Number(v))}</TableCell></TableRow>
                    ))}
                    <TableRow className="font-bold border-t-2"><TableCell>{tx("মোট", "Total")}</TableCell><TableCell className="text-right">{bdt(pnl.data.totalIncome)}</TableCell></TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{tx("ব্যয় ভাঙন", "Expense Breakdown")}</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    {Object.entries(pnl.data.byCategoryExpense).map(([k, v]) => (
                      <TableRow key={k}><TableCell>{k}</TableCell><TableCell className="text-right font-medium">{bdt(Number(v))}</TableCell></TableRow>
                    ))}
                    <TableRow className="font-bold border-t-2"><TableCell>{tx("মোট", "Total")}</TableCell><TableCell className="text-right">{bdt(pnl.data.totalExpense)}</TableCell></TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Card>
        <CardHeader><CardTitle>{tx("ট্রায়াল ব্যালেন্স", "Trial Balance")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          {tb.isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary m-6" /> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>{tx("কোড", "Code")}</TableHead>
                  <TableHead>{tx("অ্যাকাউন্ট", "Account")}</TableHead>
                  <TableHead>{tx("ধরন", "Type")}</TableHead>
                  <TableHead className="text-right">{tx("ডেবিট", "Debit")}</TableHead>
                  <TableHead className="text-right">{tx("ক্রেডিট", "Credit")}</TableHead>
                  <TableHead className="text-right">{tx("ব্যালেন্স", "Balance")}</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(tb.data ?? []).filter((a) => a.debit > 0 || a.credit > 0).map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono">{a.code}</TableCell>
                      <TableCell>{a.name}</TableCell>
                      <TableCell><Badge variant="outline">{a.account_type}</Badge></TableCell>
                      <TableCell className="text-right">{a.debit > 0 ? bdt(a.debit) : "—"}</TableCell>
                      <TableCell className="text-right">{a.credit > 0 ? bdt(a.credit) : "—"}</TableCell>
                      <TableCell className="text-right font-medium">{bdt(a.balance)}</TableCell>
                    </TableRow>
                  ))}
                  {(tb.data ?? []).filter((a) => a.debit > 0 || a.credit > 0).length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{tx("কোনো এন্ট্রি নেই", "No entries")}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const TONES: Record<string, string> = {
  indigo: "from-indigo-500 to-indigo-600",
  emerald: "from-emerald-500 to-emerald-600",
  amber: "from-amber-500 to-orange-500",
  rose: "from-rose-500 to-rose-600",
};

function StatCard({ tone, icon: Icon, label, value }: { tone: keyof typeof TONES; icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <Card><CardContent className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-bold">{value}</div>
        </div>
        <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white ${TONES[tone]}`}><Icon className="h-5 w-5" /></div>
      </div>
    </CardContent></Card>
  );
}
