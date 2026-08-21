import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Wallet, Receipt, PlayCircle, Search, Users } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  listBills, generateMonthlyBills, collectPayment, listBillableCustomers,
} from "@/lib/billing.functions";
import { useTx, useFmt } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/bills")({
  head: () => ({ meta: [{ title: "Bills & Payments — Net Bill Pro" }] }),
  component: BillsPage,
});

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
  const tx = useTx();
  const { n, bdt } = useFmt();
  const STATUS_LABEL: Record<string, string> = {
    paid: tx("পরিশোধিত", "Paid"),
    unpaid: tx("অপরিশোধিত", "Unpaid"),
    partial: tx("আংশিক", "Partial"),
    overdue: tx("মেয়াদোত্তীর্ণ", "Overdue"),
  };
  const list = useServerFn(listBills);
  const generate = useServerFn(generateMonthlyBills);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [month, setMonth] = useState(currentMonth());
  const [genOpen, setGenOpen] = useState(false);

  const bills = useQuery({ queryKey: ["bills"], queryFn: () => list() });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["bills"] });
    qc.invalidateQueries({ queryKey: ["admin", "stats"] });
  };

  const genMut = useMutation({
    mutationFn: (customerIds: string[]) =>
      generate({ data: { billing_month: month, customer_ids: customerIds } }),
    onSuccess: (r) => {
      toast.success(tx(`${n(r.created)}টি বিল তৈরি হয়েছে`, `${n(r.created)} bills created`), {
        description: r.skipped
          ? tx(`${n(r.skipped)}টি বাদ দেওয়া হয়েছে`, `${n(r.skipped)} skipped`)
          : undefined,
      });
      setGenOpen(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
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
          <h1 className="text-2xl md:text-3xl font-bold">{tx("বিল ও পেমেন্ট", "Bills & Payments")}</h1>
          <p className="text-muted-foreground">
            {tx("মাসিক বিল জেনারেট করুন এবং কালেকশন গ্রহণ করুন", "Generate monthly bills and collect payments")}
          </p>
        </div>
        <Card className="p-0">
          <CardContent className="flex flex-col sm:flex-row items-stretch gap-2 p-3">
            <div className="space-y-1">
              <Label className="text-xs">{tx("বিলিং মাস", "Billing Month")}</Label>
              <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" />
            </div>
            <div className="flex items-end">
              <Button onClick={() => setGenOpen(true)}
                className="bg-gradient-primary text-white shadow-soft">
                <PlayCircle className="mr-2 h-4 w-4" />
                {tx("বিল জেনারেট করুন", "Generate Bills")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <GenerateDialog
        open={genOpen}
        onOpenChange={setGenOpen}
        month={month}
        pending={genMut.isPending}
        onConfirm={(ids) => genMut.mutate(ids)}
      />


      <div className="grid gap-4 sm:grid-cols-3">
        <StatMini label={tx("মোট বিল", "Total Billed")} value={bdt(totals.billed)} tone="indigo" />
        <StatMini label={tx("কালেকশন", "Collected")} value={bdt(totals.collected)} tone="emerald" />
        <StatMini label={tx("বকেয়া", "Due")} value={bdt(totals.due)} tone="rose" />
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)}
                placeholder={tx("বিল নং, কাস্টমার নাম বা কোড...", "Bill no., customer name or code...")} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tx("সব স্ট্যাটাস", "All statuses")}</SelectItem>
                <SelectItem value="unpaid">{STATUS_LABEL.unpaid}</SelectItem>
                <SelectItem value="partial">{STATUS_LABEL.partial}</SelectItem>
                <SelectItem value="paid">{STATUS_LABEL.paid}</SelectItem>
                <SelectItem value="overdue">{STATUS_LABEL.overdue}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tx("বিল নং", "Bill No.")}</TableHead>
                  <TableHead>{tx("কাস্টমার", "Customer")}</TableHead>
                  <TableHead>{tx("মাস", "Month")}</TableHead>
                  <TableHead className="text-right">{tx("মোট", "Total")}</TableHead>
                  <TableHead className="text-right">{tx("পরিশোধিত", "Paid")}</TableHead>
                  <TableHead className="text-right">{tx("বকেয়া", "Due")}</TableHead>
                  <TableHead>{tx("স্ট্যাটাস", "Status")}</TableHead>
                  <TableHead className="text-right">{tx("অ্যাকশন", "Action")}</TableHead>
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
                    {tx('কোনো বিল নেই। উপরে "বিল জেনারেট করুন" ক্লিক করুন।', 'No bills. Click "Generate Bills" above.')}
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

function GenerateDialog({
  open, onOpenChange, month, pending, onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  month: string;
  pending: boolean;
  onConfirm: (ids: string[]) => void;
}) {
  const tx = useTx();
  const { n, bdt } = useFmt();
  const fetchCustomers = useServerFn(listBillableCustomers);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const customers = useQuery({
    queryKey: ["billable-customers", month],
    queryFn: () => fetchCustomers({ data: { billing_month: month } }),
    enabled: open,
  });

  const all = customers.data ?? [];
  const eligible = all.filter((c) => !c.already_billed && c.monthly_bill > 0);

  useEffect(() => {
    if (!open) return;
    const next: Record<string, boolean> = {};
    for (const c of eligible) next[c.id] = true;
    setSelected(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, customers.data]);

  const visible = all.filter((c) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(s) ||
      c.customer_code?.toLowerCase().includes(s) ||
      c.mobile?.toLowerCase().includes(s)
    );
  });

  const chosen = eligible.filter((c) => selected[c.id]);
  const totalAmount = chosen.reduce((a, c) => a + c.monthly_bill, 0);
  const allChecked = eligible.length > 0 && chosen.length === eligible.length;

  const toggleAll = (v: boolean) => {
    const next: Record<string, boolean> = {};
    for (const c of eligible) next[c.id] = v;
    setSelected(next);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {tx("কাস্টমার নির্বাচন করুন", "Select Customers")} — {month}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={tx("নাম, ইউজার আইডি বা মোবাইল...", "Name, user ID or mobile...")} className="pl-9" />
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <Checkbox checked={allChecked} onCheckedChange={(v) => toggleAll(Boolean(v))} />
              {tx("সব নির্বাচন", "Select all")}
            </label>
            <div className="text-sm text-muted-foreground">
              {tx(
                `${n(chosen.length)} জন নির্বাচিত • মোট ${bdt(totalAmount)}`,
                `${n(chosen.length)} selected • Total ${bdt(totalAmount)}`,
              )}
            </div>
          </div>

          <div className="max-h-[45vh] overflow-y-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>{tx("কাস্টমার", "Customer")}</TableHead>
                  <TableHead>{tx("মোবাইল", "Mobile")}</TableHead>
                  <TableHead className="text-right">{tx("মাসিক বিল", "Monthly Bill")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.isLoading && (
                  <TableRow><TableCell colSpan={4} className="py-10 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
                  </TableCell></TableRow>
                )}
                {!customers.isLoading && visible.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    {tx("কোনো সক্রিয় কাস্টমার নেই", "No active customers")}
                  </TableCell></TableRow>
                )}
                {visible.map((c) => {
                  const disabled = c.already_billed || c.monthly_bill <= 0;
                  return (
                    <TableRow key={c.id} className={disabled ? "opacity-60" : ""}>
                      <TableCell>
                        <Checkbox
                          disabled={disabled}
                          checked={!disabled && Boolean(selected[c.id])}
                          onCheckedChange={(v) =>
                            setSelected((prev) => ({ ...prev, [c.id]: Boolean(v) }))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{c.full_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {c.customer_code}
                          {c.already_billed && ` • ${tx("এ মাসে বিল হয়েছে", "already billed")}`}
                          {!c.already_billed && c.monthly_bill <= 0 && ` • ${tx("বিল ০", "no amount")}`}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{c.mobile}</TableCell>
                      <TableCell className="text-right">{bdt(c.monthly_bill)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tx("বাতিল", "Cancel")}</Button>
          <Button
            disabled={pending || chosen.length === 0}
            onClick={() => onConfirm(chosen.map((c) => c.id))}
            className="bg-gradient-primary text-white"
          >
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
            {tx(`${n(chosen.length)} জনের বিল তৈরি করুন`, `Generate ${n(chosen.length)} bills`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  const tx = useTx();
  const { bdt } = useFmt();
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
      toast.success(tx("পেমেন্ট গ্রহণ হয়েছে", "Payment received"), {
        description: `${tx("রশিদ", "Receipt")}: ${r.receipt}`,
      });
      setOpen(false); setTxn("");
      onDone();
    },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-gradient-primary text-white">
          <Receipt className="h-4 w-4 mr-1" /> {tx("কালেকশন", "Collect")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{tx("পেমেন্ট গ্রহণ", "Receive Payment")}</DialogTitle></DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
          <div className="space-y-1.5">
            <Label>{tx("টাকার পরিমাণ (৳)", "Amount (BDT)")}</Label>
            <Input type="number" min="1" required value={amount}
              onChange={(e) => setAmount(e.target.value)} />
            <p className="text-xs text-muted-foreground">{tx("বকেয়া", "Due")}: {bdt(due)}</p>
          </div>
          <div className="space-y-1.5">
            <Label>{tx("পেমেন্ট মাধ্যম", "Payment Method")}</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">{tx("নগদ (Cash)", "Cash")}</SelectItem>
                <SelectItem value="bkash">{tx("বিকাশ", "bKash")}</SelectItem>
                <SelectItem value="nagad">{tx("নগদ (Mobile)", "Nagad")}</SelectItem>
                <SelectItem value="rocket">{tx("রকেট", "Rocket")}</SelectItem>
                <SelectItem value="bank">{tx("ব্যাংক", "Bank")}</SelectItem>
                <SelectItem value="other">{tx("অন্যান্য", "Other")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {method !== "cash" && (
            <div className="space-y-1.5">
              <Label>{tx("ট্রানজেকশন আইডি", "Transaction ID")}</Label>
              <Input value={txn} onChange={(e) => setTxn(e.target.value)} placeholder="TrxID" />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{tx("বাতিল", "Cancel")}</Button>
            <Button type="submit" disabled={mut.isPending} className="bg-gradient-primary text-white">
              {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tx("সংরক্ষণ", "Save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
