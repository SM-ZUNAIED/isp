import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Loader2, Trash2, Pencil, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { listItems, createItem, updateItem, deleteItem } from "@/lib/inventory.functions";
import { useTx, useFmt } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/inventory/items")({
  head: () => ({ meta: [{ title: "Inventory — Net Bill Pro" }] }),
  component: ItemsPage,
});

type ItemRow = {
  id: string; name: string; sku: string | null; category: string | null;
  unit: string; reorder_level: number | string; current_stock: number | string;
  cost_price: number | string; sale_price: number | string; notes: string | null;
};

function ItemsPage() {
  const tx = useTx();
  const { n, bdt } = useFmt();
  const qc = useQueryClient();
  const list = useServerFn(listItems);
  const del = useServerFn(deleteItem);
  const q = useQuery({ queryKey: ["inv", "items"], queryFn: () => list() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["inv", "items"] });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success(tx("মুছে ফেলা হয়েছে", "Deleted")); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{tx("ইনভেন্টরি আইটেম", "Inventory Items")}</h1>
          <p className="text-muted-foreground">{tx(`মোট ${n(q.data?.length ?? 0)}টি আইটেম`, `Total ${n(q.data?.length ?? 0)} items`)}</p>
        </div>
        <ItemDialog mode="create" onSaved={invalidate} />
      </div>

      <Card>
        <CardContent className="p-0">
          {q.isLoading ? (
            <div className="grid place-items-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tx("নাম", "Name")}</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>{tx("ক্যাটাগরি", "Category")}</TableHead>
                    <TableHead>{tx("ইউনিট", "Unit")}</TableHead>
                    <TableHead className="text-right">{tx("স্টক", "Stock")}</TableHead>
                    <TableHead className="text-right">{tx("রিঅর্ডার", "Reorder")}</TableHead>
                    <TableHead className="text-right">{tx("দাম", "Price")}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(q.data ?? []).map((it) => {
                    const low = Number(it.current_stock) <= Number(it.reorder_level ?? 0);
                    return (
                      <TableRow key={it.id}>
                        <TableCell className="font-medium">{it.name}</TableCell>
                        <TableCell className="font-mono text-xs">{it.sku ?? "—"}</TableCell>
                        <TableCell>{it.category ?? "—"}</TableCell>
                        <TableCell>{it.unit}</TableCell>
                        <TableCell className="text-right">
                          <span className="flex items-center justify-end gap-1">
                            {low && <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />}
                            <Badge variant={low ? "destructive" : "secondary"}>{n(Number(it.current_stock))}</Badge>
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{n(Number(it.reorder_level))}</TableCell>
                        <TableCell className="text-right">{bdt(Number(it.sale_price))}</TableCell>
                        <TableCell className="flex gap-1 justify-end">
                          <ItemDialog mode="edit" initial={it as unknown as ItemRow} onSaved={invalidate} trigger={<Button size="sm" variant="ghost"><Pencil className="h-4 w-4" /></Button>} />
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => delMut.mutate(it.id)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(q.data ?? []).length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">{tx("কোনো আইটেম নেই", "No items")}</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ItemDialog({ mode, initial, onSaved, trigger }: { mode: "create" | "edit"; initial?: ItemRow; onSaved: () => void; trigger?: React.ReactNode }) {
  const tx = useTx();
  const [open, setOpen] = useState(false);
  const create = useServerFn(createItem);
  const update = useServerFn(updateItem);
  const empty = { name: "", sku: "", category: "", unit: "pcs", reorder_level: "0", cost_price: "0", sale_price: "0", notes: "" };
  const seed = initial ? {
    name: initial.name, sku: initial.sku ?? "", category: initial.category ?? "", unit: initial.unit,
    reorder_level: String(initial.reorder_level), cost_price: String(initial.cost_price), sale_price: String(initial.sale_price),
    notes: initial.notes ?? "",
  } : empty;
  const [f, setF] = useState(seed);
  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        name: f.name.trim(), sku: f.sku || null, category: f.category || null, unit: f.unit || "pcs",
        reorder_level: Number(f.reorder_level) || 0, cost_price: Number(f.cost_price) || 0,
        sale_price: Number(f.sale_price) || 0, notes: f.notes || null,
      };
      if (mode === "create") await create({ data: payload });
      else await update({ data: { id: initial!.id, ...payload } });
    },
    onSuccess: () => { toast.success(tx("সংরক্ষিত", "Saved")); setOpen(false); onSaved(); if (mode === "create") setF(empty); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v && initial) setF(seed); }}>
      <DialogTrigger asChild>
        {trigger ?? <Button className="bg-gradient-primary text-white"><Plus className="mr-2 h-4 w-4" />{tx("নতুন আইটেম", "New Item")}</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{mode === "create" ? tx("নতুন আইটেম", "New Item") : tx("এডিট আইটেম", "Edit Item")}</DialogTitle></DialogHeader>
        <form className="grid grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
          <div className="col-span-2 space-y-1.5"><Label>{tx("নাম *", "Name *")}</Label>
            <Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>SKU</Label>
            <Input value={f.sku} onChange={(e) => setF({ ...f, sku: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>{tx("ক্যাটাগরি", "Category")}</Label>
            <Input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>{tx("ইউনিট", "Unit")}</Label>
            <Input value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>{tx("রিঅর্ডার লেভেল", "Reorder Level")}</Label>
            <Input type="number" value={f.reorder_level} onChange={(e) => setF({ ...f, reorder_level: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>{tx("ক্রয় মূল্য", "Cost Price")}</Label>
            <Input type="number" value={f.cost_price} onChange={(e) => setF({ ...f, cost_price: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>{tx("বিক্রয় মূল্য", "Sale Price")}</Label>
            <Input type="number" value={f.sale_price} onChange={(e) => setF({ ...f, sale_price: e.target.value })} /></div>
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
