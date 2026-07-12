import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { listJournalEntries, createJournalEntry, deleteJournalEntry, listAccounts } from "@/lib/accounting.functions";
import { useTx, useFmt } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/accounting/journal")({
  head: () => ({ meta: [{ title: "Journal — Net Bill Pro" }] }),
  component: JournalPage,
});

function JournalPage() {
  const tx = useTx();
  const { bdt } = useFmt();
  const qc = useQueryClient();
  const list = useServerFn(listJournalEntries);
  const del = useServerFn(deleteJournalEntry);
  const q = useQuery({ queryKey: ["journal"], queryFn: () => list() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["journal"] });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success(tx("মুছে ফেলা হয়েছে", "Deleted")); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{tx("জার্নাল এন্ট্রি", "Journal Entries")}</h1>
          <p className="text-muted-foreground">{tx("ডাবল-এন্ট্রি বুককিপিং", "Double-entry bookkeeping")}</p>
        </div>
        <JournalDialog onSaved={invalidate} />
      </div>

      {q.isLoading ? <div className="grid place-items-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
        <div className="space-y-3">
          {(q.data ?? []).map((e) => {
            const lines = (e as unknown as { lines?: Array<{ id: string; debit: number|string; credit: number|string; memo: string|null; account?: { code:string;name:string } }> }).lines ?? [];
            return (
              <Card key={e.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{e.entry_no}</span>
                        <span className="text-muted-foreground">{e.entry_date}</span>
                      </div>
                      <div className="font-medium mt-1">{e.description ?? "—"}</div>
                      {e.reference && <div className="text-xs text-muted-foreground">Ref: {e.reference}</div>}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{bdt(Number(e.total_amount ?? 0))}</div>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => delMut.mutate(e.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>{tx("অ্যাকাউন্ট", "Account")}</TableHead>
                      <TableHead className="text-right">{tx("ডেবিট", "Debit")}</TableHead>
                      <TableHead className="text-right">{tx("ক্রেডিট", "Credit")}</TableHead>
                      <TableHead>{tx("মেমো", "Memo")}</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {lines.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="text-sm"><span className="font-mono text-xs">{l.account?.code}</span> {l.account?.name}</TableCell>
                          <TableCell className="text-right">{Number(l.debit) > 0 ? bdt(Number(l.debit)) : "—"}</TableCell>
                          <TableCell className="text-right">{Number(l.credit) > 0 ? bdt(Number(l.credit)) : "—"}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{l.memo ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
          {(q.data ?? []).length === 0 && <Card><CardContent className="text-center text-muted-foreground py-12">{tx("কোনো জার্নাল এন্ট্রি নেই", "No journal entries")}</CardContent></Card>}
        </div>
      )}
    </div>
  );
}

type LineDraft = { account_id: string; debit: string; credit: string; memo: string };

function JournalDialog({ onSaved }: { onSaved: () => void }) {
  const tx = useTx();
  const [open, setOpen] = useState(false);
  const accountsQ = useQuery({ queryKey: ["accounts"], queryFn: useServerFn(listAccounts), enabled: open });
  const create = useServerFn(createJournalEntry);
  const [meta, setMeta] = useState({ entry_date: new Date().toISOString().slice(0, 10), description: "", reference: "" });
  const [lines, setLines] = useState<LineDraft[]>([
    { account_id: "", debit: "0", credit: "0", memo: "" },
    { account_id: "", debit: "0", credit: "0", memo: "" },
  ]);
  const totalD = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalC = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const balanced = Math.abs(totalD - totalC) < 0.01 && totalD > 0;

  const mut = useMutation({
    mutationFn: () => create({ data: {
      entry_date: meta.entry_date,
      description: meta.description || null,
      reference: meta.reference || null,
      lines: lines.filter((l) => l.account_id).map((l) => ({
        account_id: l.account_id,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
        memo: l.memo || null,
      })),
    } }),
    onSuccess: () => { toast.success(tx("যোগ হয়েছে", "Added")); setOpen(false); onSaved(); setLines([{ account_id: "", debit: "0", credit: "0", memo: "" }, { account_id: "", debit: "0", credit: "0", memo: "" }]); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="bg-gradient-primary text-white"><Plus className="mr-2 h-4 w-4" />{tx("নতুন জার্নাল", "New Journal")}</Button></DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>{tx("জার্নাল এন্ট্রি", "Journal Entry")}</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label>{tx("তারিখ", "Date")}</Label>
              <Input type="date" value={meta.entry_date} onChange={(e) => setMeta({ ...meta, entry_date: e.target.value })} /></div>
            <div className="col-span-2 space-y-1.5"><Label>{tx("বর্ণনা", "Description")}</Label>
              <Input value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} /></div>
          </div>

          <div className="space-y-2">
            <Label>{tx("লাইন সমূহ", "Lines")}</Label>
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4">
                  <Select value={l.account_id} onValueChange={(v) => { const c = [...lines]; c[i] = { ...c[i], account_id: v }; setLines(c); }}>
                    <SelectTrigger><SelectValue placeholder={tx("অ্যাকাউন্ট", "Account")} /></SelectTrigger>
                    <SelectContent>{(accountsQ.data ?? []).map((a) => <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Input className="col-span-2" type="number" placeholder="Debit" value={l.debit} onChange={(e) => { const c = [...lines]; c[i] = { ...c[i], debit: e.target.value }; setLines(c); }} />
                <Input className="col-span-2" type="number" placeholder="Credit" value={l.credit} onChange={(e) => { const c = [...lines]; c[i] = { ...c[i], credit: e.target.value }; setLines(c); }} />
                <Input className="col-span-3" placeholder="Memo" value={l.memo} onChange={(e) => { const c = [...lines]; c[i] = { ...c[i], memo: e.target.value }; setLines(c); }} />
                <Button type="button" size="sm" variant="ghost" className="col-span-1 text-destructive" onClick={() => setLines(lines.filter((_, j) => j !== i))} disabled={lines.length <= 2}><X className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setLines([...lines, { account_id: "", debit: "0", credit: "0", memo: "" }])}>
              <Plus className="mr-2 h-4 w-4" />{tx("লাইন যোগ", "Add line")}
            </Button>
          </div>

          <div className="flex justify-between text-sm bg-muted rounded-xl p-3">
            <span>{tx("মোট ডেবিট", "Total Debit")}: <b>{totalD.toFixed(2)}</b></span>
            <span>{tx("মোট ক্রেডিট", "Total Credit")}: <b>{totalC.toFixed(2)}</b></span>
            <span className={balanced ? "text-emerald-600" : "text-rose-600"}>{balanced ? tx("সমান", "Balanced ✓") : tx("অসমান", "Not balanced")}</span>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{tx("বাতিল", "Cancel")}</Button>
            <Button type="submit" className="bg-gradient-primary text-white" disabled={!balanced || mut.isPending}>
              {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{tx("সংরক্ষণ", "Save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
