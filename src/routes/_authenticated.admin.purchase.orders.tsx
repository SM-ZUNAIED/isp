import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { listPOs, createPO, setPOStatus, deletePO, listVendors } from "@/lib/purchase.functions";
import { useTx, useFmt } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/purchase/orders")({
  head: () => ({ meta: [{ title: "Purchase Orders — Net Bill Pro" }] }),
  component: PoPage,
});

type POStatus = "draft" | "ordered" | "received" | "cancelled";
const TONE: Record<POStatus, string> = {
  draft: "bg-muted text-foreground", ordered: "bg-indigo-500 text-white",
  received: "bg-emerald-500 text-white", cancelled: "bg-rose-500 text-white",
};

function PoPage() {
  const tx = useTx();
  const { bdt } = useFmt();
  const qc = useQueryClient();
  const list = useServerFn(listPOs);
  const setStatus = useServerFn(setPOStatus);
  const del = useServerFn(deletePO);
  const q = useQuery({ queryKey: ["pos"], queryFn: () => list() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["pos"] });
  const statusMut = useMutation({
    mutationFn: (v: { id: string; status: POStatus }) => setStatus({ data: v }),
    onSuccess: () => { toast.success(tx("আপডেট", "Updated")); invalidate(); },
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
          <h1 className="text-2xl md:text-3xl font-bold">{tx("পারচেজ অর্ডার", "Purchase Orders")}</h1>
          <p className="text-muted-foreground">{tx(`মোট ${q.data?.length ?? 0}টি`, `Total ${q.data?.length ?? 0}`)}</p>
        </div>
        <PODialog onSaved={invalidate} />
      </div>

      <Card>
        <CardContent className="p-0">
          {q.isLoading ? <div className="grid place-items-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>PO#</TableHead>
                  <TableHead>{tx("ভেন্ডর", "Vendor")}</TableHead>
                  <TableHead>{tx("তারিখ", "Date")}</TableHead>
                  <TableHead className="text-right">{tx("মোট", "Total")}</TableHead>
                  <TableHead>{tx("স্ট্যাটাস", "Status")}</TableHead>
                  <TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(q.data ?? []).map((p) => {
                    const v = (p as unknown as { vendor?: { name?: string } }).vendor;
                    const s = p.status as POStatus;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.po_number}</TableCell>
                        <TableCell className="font-medium">{v?.name ?? "—"}</TableCell>
                        <TableCell>{p.order_date}</TableCell>
                        <TableCell className="text-right">{bdt(Number(p.total ?? 0))}</TableCell>
                        <TableCell>
                          <Select value={s} onValueChange={(nv) => statusMut.mutate({ id: p.id, status: nv as POStatus })}>
                            <SelectTrigger className="h-8 w-32"><Badge className={TONE[s]}>{s}</Badge></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">draft</SelectItem>
                              <SelectItem value="ordered">ordered</SelectItem>
                              <SelectItem value="received">received</SelectItem>
                              <SelectItem value="cancelled">cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell><Button size="sm" variant="ghost" className="text-destructive" onClick={() => delMut.mutate(p.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    );
                  })}
                  {(q.data ?? []).length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{tx("কোনো PO নেই", "No POs")}</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PODialog({ onSaved }: { onSaved: () => void }) {
  const tx = useTx();
  const [open, setOpen] = useState(false);
  const vq = useQuery({ queryKey: ["vendors"], queryFn: useServerFn(listVendors), enabled: open });
  const create = useServerFn(createPO);
  const [f, setF] = useState({
    vendor_id: "", order_date: new Date().toISOString().slice(0, 10),
    expected_date: "", subtotal: "0", discount: "0", tax: "0", notes: "",
  });
  const total = Math.max(0, Number(f.subtotal || 0) - Number(f.discount || 0) + Number(f.tax || 0));
  const mut = useMutation({
    mutationFn: () => create({ data: {
      vendor_id: f.vendor_id || null,
      order_date: f.order_date,
      expected_date: f.expected_date || null,
      subtotal: Number(f.subtotal) || 0,
      discount: Number(f.discount) || 0,
      tax: Number(f.tax) || 0,
      total,
      notes: f.notes || null,
    } }),
    onSuccess: () => { toast.success(tx("যোগ হয়েছে", "Added")); setOpen(false); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="bg-gradient-primary text-white"><Plus className="mr-2 h-4 w-4" />{tx("নতুন PO", "New PO")}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{tx("নতুন পারচেজ অর্ডার", "New Purchase Order")}</DialogTitle></DialogHeader>
        <form className="grid grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
          <div className="col-span-2 space-y-1.5"><Label>{tx("ভেন্ডর", "Vendor")}</Label>
            <Select value={f.vendor_id} onValueChange={(v) => setF({ ...f, vendor_id: v })}>
              <SelectTrigger><SelectValue placeholder={tx("বাছাই", "Select")} /></SelectTrigger>
              <SelectContent>{(vq.data ?? []).map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>{tx("অর্ডার তারিখ", "Order Date")}</Label>
            <Input type="date" value={f.order_date} onChange={(e) => setF({ ...f, order_date: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>{tx("প্রত্যাশিত", "Expected")}</Label>
            <Input type="date" value={f.expected_date} onChange={(e) => setF({ ...f, expected_date: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>{tx("সাবটোটাল", "Subtotal")}</Label>
            <Input type="number" value={f.subtotal} onChange={(e) => setF({ ...f, subtotal: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>{tx("ডিসকাউন্ট", "Discount")}</Label>
            <Input type="number" value={f.discount} onChange={(e) => setF({ ...f, discount: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>{tx("ট্যাক্স", "Tax")}</Label>
            <Input type="number" value={f.tax} onChange={(e) => setF({ ...f, tax: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>{tx("মোট", "Total")}</Label>
            <Input value={total.toFixed(2)} readOnly /></div>
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
