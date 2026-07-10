import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Loader2, Plus, Trash2, TrendingUp, TrendingDown, Wallet, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  listAccounts, addIncome, addExpense, updateEntry, deleteEntry,
} from "@/lib/support.functions";
import { useTx, useFmt } from "@/hooks/use-i18n";

type EntryRow = { id: string; amount: number; category: string; description: string | null; entry_date: string };

export const Route = createFileRoute("/_authenticated/admin/accounts")({
  head: () => ({ meta: [{ title: "একাউন্টস — Net Bill Pro" }] }),
  component: AccountsPage,
});

const today = () => new Date().toISOString().slice(0, 10);

function AccountsPage() {
  const qc = useQueryClient();
  const tx = useTx();
  const { n, bdt } = useFmt();
  const list = useServerFn(listAccounts);
  const q = useQuery({ queryKey: ["accounts"], queryFn: () => list() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["accounts"] });

  const totals = useMemo(() => {
    const inc = (q.data?.incomes ?? []).reduce((s, r) => s + Number(r.amount), 0);
    const exp = (q.data?.expenses ?? []).reduce((s, r) => s + Number(r.amount), 0);
    return { inc, exp, net: inc - exp };
  }, [q.data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{tx("একাউন্টস", "Accounts")}</h1>
        <p className="text-muted-foreground">{tx("অন্যান্য আয় ও ব্যয় ম্যানেজ করুন", "Manage other income and expenses")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatMini label={tx("মোট আয়", "Total Income")} value={bdt(totals.inc)} icon={TrendingUp} tone="emerald" />
        <StatMini label={tx("মোট ব্যয়", "Total Expense")} value={bdt(totals.exp)} icon={TrendingDown} tone="rose" />
        <StatMini label={tx("নেট প্রফিট", "Net Profit")} value={bdt(totals.net)} icon={Wallet} tone={totals.net >= 0 ? "indigo" : "rose"} />
      </div>

      <Tabs defaultValue="income">
        <TabsList>
          <TabsTrigger value="income">{tx("আয়", "Income")}</TabsTrigger>
          <TabsTrigger value="expense">{tx("ব্যয়", "Expense")}</TabsTrigger>
        </TabsList>
        <TabsContent value="income" className="mt-4">
          <EntrySection kind="income" rows={q.data?.incomes ?? []} loading={q.isLoading} onChange={invalidate} />
        </TabsContent>
        <TabsContent value="expense" className="mt-4">
          <EntrySection kind="expense" rows={q.data?.expenses ?? []} loading={q.isLoading} onChange={invalidate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatMini({ label, value, icon: Icon, tone }: {
  label: string; value: string; icon: React.ComponentType<{ className?: string }>;
  tone: "emerald" | "rose" | "indigo";
}) {
  const map = { emerald: "from-emerald-500 to-emerald-600", rose: "from-rose-500 to-rose-600", indigo: "from-indigo-500 to-indigo-600" } as const;
  return (
    <Card><CardContent className="p-5 flex items-center justify-between">
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-1 text-xl font-bold">{value}</div>
      </div>
      <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white ${map[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
    </CardContent></Card>
  );
}

function EntrySection({
  kind, rows, loading, onChange,
}: {
  kind: "income" | "expense";
  rows: Array<{ id: string; amount: number; category: string; description: string | null; entry_date: string }>;
  loading: boolean; onChange: () => void;
}) {
  const tx = useTx();
  const { n } = useFmt();
  const addFn = useServerFn(kind === "income" ? addIncome : addExpense);
  const del = useServerFn(deleteEntry);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today());

  const addMut = useMutation({
    mutationFn: () => addFn({
      data: { amount: Number(amount), category: category.trim(), description: description || null, entry_date: date },
    }),
    onSuccess: () => {
      toast.success(tx("সংরক্ষিত", "Saved")); setAmount(""); setCategory(""); setDescription(""); setDate(today()); onChange();
    },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id, kind } }),
    onSuccess: () => { toast.success(tx("মুছে ফেলা হয়েছে", "Deleted")); onChange(); },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <form onSubmit={(e) => { e.preventDefault(); if (amount && category.trim()) addMut.mutate(); }}
            className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="space-y-1"><Label className="text-xs">টাকা (৳)</Label>
              <Input required type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">বিভাগ</Label>
              <Input required value={category} onChange={(e) => setCategory(e.target.value)}
                placeholder={kind === "income" ? "কানেকশন ফি" : "বিদ্যুৎ বিল"} /></div>
            <div className="space-y-1 md:col-span-2"><Label className="text-xs">বর্ণনা</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">তারিখ</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <Button type="submit" disabled={addMut.isPending} className="bg-gradient-primary text-white md:col-span-5">
              {addMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              যোগ করুন
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>তারিখ</TableHead>
                  <TableHead>বিভাগ</TableHead>
                  <TableHead>বর্ণনা</TableHead>
                  <TableHead className="text-right">পরিমাণ (৳)</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={5} className="py-10 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
                </TableCell></TableRow>}
                {!loading && rows.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    কোনো এন্ট্রি নেই।
                  </TableCell></TableRow>
                )}
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">{r.entry_date}</TableCell>
                    <TableCell className="font-medium">{r.category}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.description ?? "—"}</TableCell>
                    <TableCell className="text-right font-semibold">{bn.format(Number(r.amount))}</TableCell>
                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                      <EditEntryDialog kind={kind} row={r} onSaved={onChange} />
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => delMut.mutate(r.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

function EditEntryDialog({
  kind, row, onSaved,
}: {
  kind: "income" | "expense";
  row: EntryRow;
  onSaved: () => void;
}) {
  const update = useServerFn(updateEntry);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(row.amount));
  const [category, setCategory] = useState(row.category);
  const [description, setDescription] = useState(row.description ?? "");
  const [date, setDate] = useState(row.entry_date);
  const mut = useMutation({
    mutationFn: () => update({
      data: {
        id: row.id, kind,
        amount: Number(amount), category: category.trim(),
        description: description || null, entry_date: date,
      },
    }),
    onSuccess: () => { toast.success("আপডেট হয়েছে"); setOpen(false); onSaved(); },
    onError: (e: Error) => toast.error("ব্যর্থ", { description: e.message }),
  });
  return (
    <Dialog open={open} onOpenChange={(v) => {
      setOpen(v);
      if (v) { setAmount(String(row.amount)); setCategory(row.category); setDescription(row.description ?? ""); setDate(row.entry_date); }
    }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost"><Pencil className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>এন্ট্রি এডিট</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">টাকা (৳)</Label>
            <Input required type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div className="space-y-1"><Label className="text-xs">তারিখ</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="space-y-1 col-span-2"><Label className="text-xs">বিভাগ</Label>
            <Input required value={category} onChange={(e) => setCategory(e.target.value)} /></div>
          <div className="space-y-1 col-span-2"><Label className="text-xs">বর্ণনা</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>বাতিল</Button>
            <Button type="submit" disabled={mut.isPending} className="bg-gradient-primary text-white">
              {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} সংরক্ষণ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
