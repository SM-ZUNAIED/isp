import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Loader2, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { listAccounts, createAccount, updateAccount, deleteAccount } from "@/lib/accounting.functions";
import { useTx } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/accounting/chart")({
  head: () => ({ meta: [{ title: "Chart of Accounts — Net Bill Pro" }] }),
  component: ChartPage,
});

type AType = "asset" | "liability" | "equity" | "income" | "expense";
type Row = { id: string; code: string; name: string; account_type: AType; parent_id: string | null; is_active: boolean; notes: string | null };
const TONE: Record<AType, string> = {
  asset: "bg-emerald-500 text-white", liability: "bg-rose-500 text-white",
  equity: "bg-indigo-500 text-white", income: "bg-amber-500 text-white",
  expense: "bg-slate-600 text-white",
};

function ChartPage() {
  const tx = useTx();
  const qc = useQueryClient();
  const list = useServerFn(listAccounts);
  const del = useServerFn(deleteAccount);
  const q = useQuery({ queryKey: ["accounts"], queryFn: () => list() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["accounts"] });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success(tx("মুছে ফেলা হয়েছে", "Deleted")); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{tx("চার্ট অফ অ্যাকাউন্টস", "Chart of Accounts")}</h1>
          <p className="text-muted-foreground">{tx(`মোট ${q.data?.length ?? 0}টি অ্যাকাউন্ট`, `Total ${q.data?.length ?? 0} accounts`)}</p>
        </div>
        <AcctDialog mode="create" onSaved={invalidate} />
      </div>

      <Card>
        <CardContent className="p-0">
          {q.isLoading ? <div className="grid place-items-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>{tx("কোড", "Code")}</TableHead>
                  <TableHead>{tx("নাম", "Name")}</TableHead>
                  <TableHead>{tx("ধরন", "Type")}</TableHead>
                  <TableHead>{tx("অ্যাক্টিভ", "Active")}</TableHead>
                  <TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(q.data ?? []).map((a) => {
                    const t = a.account_type as AType;
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-mono">{a.code}</TableCell>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell><Badge className={TONE[t]}>{t}</Badge></TableCell>
                        <TableCell>{a.is_active ? tx("হ্যাঁ", "Yes") : tx("না", "No")}</TableCell>
                        <TableCell className="flex gap-1 justify-end">
                          <AcctDialog mode="edit" initial={a as unknown as Row} onSaved={invalidate} trigger={<Button size="sm" variant="ghost"><Pencil className="h-4 w-4" /></Button>} />
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => delMut.mutate(a.id)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AcctDialog({ mode, initial, onSaved, trigger }: { mode: "create" | "edit"; initial?: Row; onSaved: () => void; trigger?: React.ReactNode }) {
  const tx = useTx();
  const [open, setOpen] = useState(false);
  const create = useServerFn(createAccount);
  const update = useServerFn(updateAccount);
  const empty = { code: "", name: "", account_type: "asset" as AType, is_active: true, notes: "" };
  const seed = initial ? { code: initial.code, name: initial.name, account_type: initial.account_type, is_active: initial.is_active, notes: initial.notes ?? "" } : empty;
  const [f, setF] = useState(seed);
  const mut = useMutation({
    mutationFn: async () => {
      const payload = { code: f.code.trim(), name: f.name.trim(), account_type: f.account_type, is_active: f.is_active, notes: f.notes || null };
      if (mode === "create") await create({ data: payload });
      else await update({ data: { id: initial!.id, ...payload } });
    },
    onSuccess: () => { toast.success(tx("সংরক্ষিত", "Saved")); setOpen(false); onSaved(); if (mode === "create") setF(empty); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v && initial) setF(seed); }}>
      <DialogTrigger asChild>{trigger ?? <Button className="bg-gradient-primary text-white"><Plus className="mr-2 h-4 w-4" />{tx("নতুন অ্যাকাউন্ট", "New Account")}</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{mode === "create" ? tx("নতুন অ্যাকাউন্ট", "New Account") : tx("এডিট অ্যাকাউন্ট", "Edit Account")}</DialogTitle></DialogHeader>
        <form className="grid grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
          <div className="space-y-1.5"><Label>{tx("কোড *", "Code *")}</Label>
            <Input required value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>{tx("ধরন", "Type")}</Label>
            <Select value={f.account_type} onValueChange={(v) => setF({ ...f, account_type: v as AType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="asset">Asset</SelectItem>
                <SelectItem value="liability">Liability</SelectItem>
                <SelectItem value="equity">Equity</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5"><Label>{tx("নাম *", "Name *")}</Label>
            <Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="col-span-2 space-y-1.5"><Label>{tx("নোট", "Notes")}</Label>
            <Input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{tx("বাতিল", "Cancel")}</Button>
            <Button type="submit" className="bg-gradient-primary text-white" disabled={mut.isPending}>
              {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{tx("সংরক্ষণ", "Save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
