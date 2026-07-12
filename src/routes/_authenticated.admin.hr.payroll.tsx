import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Loader2, Trash2, CheckCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { listPayrollRuns, generatePayrollRun, finalizePayrollRun, listPayrollItems, deletePayrollRun } from "@/lib/hr.functions";
import { useTx, useFmt } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/hr/payroll")({
  head: () => ({ meta: [{ title: "Payroll — Net Bill Pro" }] }),
  component: PayrollPage,
});

type Status = "draft" | "finalized" | "paid";
const TONE: Record<Status, string> = { draft: "bg-muted", finalized: "bg-indigo-500 text-white", paid: "bg-emerald-500 text-white" };

function PayrollPage() {
  const tx = useTx();
  const { bdt } = useFmt();
  const qc = useQueryClient();
  const list = useServerFn(listPayrollRuns);
  const gen = useServerFn(generatePayrollRun);
  const finalize = useServerFn(finalizePayrollRun);
  const del = useServerFn(deletePayrollRun);
  const q = useQuery({ queryKey: ["payroll", "runs"], queryFn: () => list() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["payroll", "runs"] });

  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const genMut = useMutation({
    mutationFn: () => gen({ data: { period_month: month + "-01" } }),
    onSuccess: () => { toast.success(tx("পেরোল তৈরি", "Payroll generated")); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const finMut = useMutation({
    mutationFn: (id: string) => finalize({ data: { run_id: id } }),
    onSuccess: () => { toast.success(tx("চূড়ান্ত করা হয়েছে", "Finalized")); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success(tx("মুছে ফেলা হয়েছে", "Deleted")); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{tx("পেরোল", "Payroll")}</h1>
          <p className="text-muted-foreground">{tx("মাসিক বেতন প্রক্রিয়া", "Monthly salary processing")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" />
          <Button className="bg-gradient-primary text-white" onClick={() => genMut.mutate()} disabled={genMut.isPending}>
            {genMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            {tx("পেরোল জেনারেট", "Generate Payroll")}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {q.isLoading ? <div className="grid place-items-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>{tx("মাস", "Month")}</TableHead>
                  <TableHead>{tx("স্ট্যাটাস", "Status")}</TableHead>
                  <TableHead className="text-right">{tx("মোট", "Total")}</TableHead>
                  <TableHead>{tx("চূড়ান্ত", "Finalized At")}</TableHead>
                  <TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(q.data ?? []).map((r) => {
                    const s = r.status as Status;
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{String(r.period_month).slice(0, 7)}</TableCell>
                        <TableCell><Badge className={TONE[s]}>{s}</Badge></TableCell>
                        <TableCell className="text-right">{bdt(Number(r.total_amount ?? 0))}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.finalized_at ? new Date(r.finalized_at).toLocaleDateString() : "—"}</TableCell>
                        <TableCell className="flex gap-1 justify-end">
                          <PayrollItemsDialog run={r} />
                          {s === "draft" && <Button size="sm" variant="ghost" className="text-emerald-600" onClick={() => finMut.mutate(r.id)}><CheckCircle className="h-4 w-4" /></Button>}
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => delMut.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(q.data ?? []).length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{tx("কোনো পেরোল রান নেই", "No payroll runs")}</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PayrollItemsDialog({ run }: { run: { id: string; period_month: string | Date } }) {
  const tx = useTx();
  const { bdt } = useFmt();
  const [open, setOpen] = useState(false);
  const list = useServerFn(listPayrollItems);
  const q = useQuery({ queryKey: ["payroll", "items", run.id], queryFn: () => list({ data: { run_id: run.id } }), enabled: open });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button></DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>{tx("পেরোল বিস্তারিত", "Payroll Details")} — {String(run.period_month).slice(0, 7)}</DialogTitle></DialogHeader>
        {q.isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : (
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>{tx("স্টাফ", "Staff")}</TableHead>
                <TableHead className="text-right">{tx("বেসিক", "Basic")}</TableHead>
                <TableHead className="text-right">{tx("অ্যালাউন্স", "Allow.")}</TableHead>
                <TableHead className="text-right">{tx("ডিডাক", "Deduct")}</TableHead>
                <TableHead className="text-right">{tx("নেট", "Net")}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(q.data ?? []).map((it) => {
                  const st = (it as unknown as { staff?: { full_name?: string; staff_code?: string } }).staff;
                  return (
                    <TableRow key={it.id}>
                      <TableCell><div className="font-medium">{st?.full_name}</div><div className="text-xs text-muted-foreground">{st?.staff_code}</div></TableCell>
                      <TableCell className="text-right">{bdt(Number(it.basic))}</TableCell>
                      <TableCell className="text-right">{bdt(Number(it.allowances))}</TableCell>
                      <TableCell className="text-right">{bdt(Number(it.deductions))}</TableCell>
                      <TableCell className="text-right font-bold">{bdt(Number(it.net_amount))}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>{tx("বন্ধ", "Close")}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
