import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Loader2, Wallet, Receipt, PlayCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  listBills, generateMonthlyBills, collectPayment,
} from "@/lib/billing.functions";

export const Route = createFileRoute("/_authenticated/admin/bills")({
  head: () => ({ meta: [{ title: "বিল ও পেমেন্ট — Net Bill Pro" }] }),
  component: BillsPage,
});

const bn = new Intl.NumberFormat("bn-BD");
const bdt = (n: number) => `৳ ${bn.format(Math.round(n))}`;

const STATUS_LABEL: Record<string, string> = {
  paid: "পরিশোধিত", unpaid: "অপরিশোধিত", partial: "আংশিক", overdue: "মেয়াদোত্তীর্ণ",
};
const STATUS_TONE: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  unpaid: "bg-rose-100 text-rose-700 border-rose-200",
  partial: "bg-amber-100 text-amber-700 border-amber-200",
  overdue: "bg-slate-200 text-slate-700 border-slate-300",
};

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function BillsPage() {
  const qc = useQueryClient();
  const list = useServerFn(listBills);
  const generate = useServerFn(generateMonthlyBills);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [month, setMonth] = useState(currentMonth());

  const bills = useQuery({ queryKey: ["bills"], queryFn: () => list() });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["bills"] });
    qc.invalidateQueries({ queryKey: ["admin", "stats"] });
  };

  const genMut = useMutation({
    mutationFn: () => generate({ data: { billing_month: month } }),
    onSuccess: (r) => {
      toast.success(`${bn.format(r.created)}টি বিল তৈরি হয়েছে`, {
        description: r.skipped ? `${bn.format(r.skipped)}টি ইতিমধ্যে ছিল` : undefined,
      });
      invalidate();
    },
    onError: (e: Error) => toast.error("ব্যর্থ", { description: e.message }),
  });

  const rows = useMemo(() => {
    const all = bills.data ?? [];
    return all.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (!q.trim()) return true;
      const s = q.toLowerCase();
      return (
        b.bill_number?.toLowerCase().includes(s) ||
        b.customers?.full_name?.toLowerCase().includes(s) ||
        b.customers?.customer_code?.toLowerCase().includes(s)
      );
    });
  }, [bills.data, q, statusFilter]);

  const totals = useMemo(() => {
    const all = bills.data ?? [];
    return all.reduce(
      (a, b) => ({
        billed: a.billed + Number(b.amount),
        collected: a.collected + Number(b.paid_amount ?? 0),
        due: a.due + Number(b.due_amount ?? 0),
      }),
      { billed: 0, collected: 0, due: 0 },
    );
  }, [bills.data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">বিল ও পেমেন্ট</h1>
          <p className="text-muted-foreground">মাসিক বিল জেনারেট করুন এবং কালেকশন গ্রহণ করুন</p>
        </div>
        <Card className="p-0">
          <CardContent className="flex flex-col sm:flex-row items-stretch gap-2 p-3">
            <div className="space-y-1">
              <Label className="text-xs">বিলিং মাস</Label>
              <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" />
            </div>
            <div className="flex items-end">
              <Button onClick={() => genMut.mutate()} disabled={genMut.isPending}
                className="bg-gradient-primary text-white shadow-soft">
                {genMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                বিল জেনারেট করুন
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatMini label="মোট বিল" value={bdt(totals.billed)} tone="indigo" />
        <StatMini label="কালেকশন" value={bdt(totals.collected)} tone="emerald" />
        <StatMini label="বকেয়া" value={bdt(totals.due)} tone="rose" />
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="বিল নং, কাস্টমার নাম বা কোড..." className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব স্ট্যাটাস</SelectItem>
                <SelectItem value="unpaid">অপরিশোধিত</SelectItem>
                <SelectItem value="partial">আংশিক</SelectItem>
                <SelectItem value="paid">পরিশোধিত</SelectItem>
                <SelectItem value="overdue">মেয়াদোত্তীর্ণ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>বিল নং</TableHead>
                  <TableHead>কাস্টমার</TableHead>
                  <TableHead>মাস</TableHead>
                  <TableHead className="text-right">মোট</TableHead>
                  <TableHead className="text-right">পরিশোধিত</TableHead>
                  <TableHead className="text-right">বকেয়া</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.isLoading && (
                  <TableRow><TableCell colSpan={8} className="py-10 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
                  </TableCell></TableRow>
                )}
                {!bills.isLoading && rows.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    কোনো বিল নেই। উপরে "বিল জেনারেট করুন" ক্লিক করুন।
                  </TableCell></TableRow>
                )}
                {rows.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">{b.bill_number}</TableCell>
                    <TableCell>
                      <div className="font-medium">{b.customers?.full_name}</div>
                      <div className="text-xs text-muted-foreground">{b.customers?.customer_code}</div>
                    </TableCell>
                    <TableCell className="text-sm">{b.billing_month?.slice(0, 7)}</TableCell>
                    <TableCell className="text-right">{bdt(Number(b.amount))}</TableCell>
                    <TableCell className="text-right">{bdt(Number(b.paid_amount ?? 0))}</TableCell>
                    <TableCell className="text-right font-semibold">{bdt(Number(b.due_amount ?? 0))}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_TONE[b.status]}>
                        {STATUS_LABEL[b.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {b.status !== "paid" && (
                        <CollectDialog
                          billId={b.id}
                          due={Number(b.due_amount ?? b.amount)}
                          onDone={invalidate}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatMini({ label, value, tone }: { label: string; value: string; tone: "indigo" | "emerald" | "rose" }) {
  const map = {
    indigo: "from-indigo-500 to-indigo-600",
    emerald: "from-emerald-500 to-emerald-600",
    rose: "from-rose-500 to-rose-600",
  } as const;
  return (
    <Card>
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="mt-1 text-xl font-bold">{value}</div>
        </div>
        <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white ${map[tone]}`}>
          <Wallet className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function CollectDialog({
  billId, due, onDone,
}: { billId: string; due: number; onDone: () => void }) {
  const collect = useServerFn(collectPayment);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(Math.round(due)));
  const [method, setMethod] = useState<"cash" | "bkash" | "nagad" | "rocket" | "bank" | "other">("cash");
  const [txn, setTxn] = useState("");

  const mut = useMutation({
    mutationFn: () => collect({
      data: {
        bill_id: billId,
        amount: Number(amount),
        method,
        transaction_id: txn || null,
      },
    }),
    onSuccess: (r) => {
      toast.success("পেমেন্ট গ্রহণ হয়েছে", { description: `রশিদ: ${r.receipt}` });
      setOpen(false); setTxn("");
      onDone();
    },
    onError: (e: Error) => toast.error("ব্যর্থ", { description: e.message }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-gradient-primary text-white">
          <Receipt className="h-4 w-4 mr-1" /> কালেকশন
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>পেমেন্ট গ্রহণ</DialogTitle></DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
          <div className="space-y-1.5">
            <Label>টাকার পরিমাণ (৳)</Label>
            <Input type="number" min="1" required value={amount}
              onChange={(e) => setAmount(e.target.value)} />
            <p className="text-xs text-muted-foreground">বকেয়া: {bdt(due)}</p>
          </div>
          <div className="space-y-1.5">
            <Label>পেমেন্ট মাধ্যম</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">নগদ (Cash)</SelectItem>
                <SelectItem value="bkash">বিকাশ</SelectItem>
                <SelectItem value="nagad">নগদ (Mobile)</SelectItem>
                <SelectItem value="rocket">রকেট</SelectItem>
                <SelectItem value="bank">ব্যাংক</SelectItem>
                <SelectItem value="other">অন্যান্য</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {method !== "cash" && (
            <div className="space-y-1.5">
              <Label>ট্রানজেকশন আইডি</Label>
              <Input value={txn} onChange={(e) => setTxn(e.target.value)} placeholder="TrxID" />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>বাতিল</Button>
            <Button type="submit" disabled={mut.isPending} className="bg-gradient-primary text-white">
              {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              সংরক্ষণ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
