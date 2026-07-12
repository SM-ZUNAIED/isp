import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Loader2, Trash2, ArrowUpFromLine, ArrowDownToLine } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { listMovements, createMovement, deleteMovement, listItems, listWarehouses } from "@/lib/inventory.functions";
import { useTx, useFmt } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/inventory/movements")({
  head: () => ({ meta: [{ title: "Stock Movements — Net Bill Pro" }] }),
  component: MovementsPage,
});

type MoveType = "in" | "out" | "transfer" | "adjust";

function MovementsPage() {
  const tx = useTx();
  const { n } = useFmt();
  const qc = useQueryClient();
  const list = useServerFn(listMovements);
  const del = useServerFn(deleteMovement);
  const q = useQuery({ queryKey: ["inv", "moves"], queryFn: () => list() });
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["inv", "moves"] });
    qc.invalidateQueries({ queryKey: ["inv", "items"] });
  };
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success(tx("মুছে ফেলা হয়েছে", "Deleted")); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{tx("স্টক মুভমেন্ট", "Stock Movements")}</h1>
          <p className="text-muted-foreground">{tx("ইন / আউট / অ্যাডজাস্ট", "In / Out / Adjust")}</p>
        </div>
        <MoveDialog onSaved={invalidate} />
      </div>

      <Card>
        <CardContent className="p-0">
          {q.isLoading ? <div className="grid place-items-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>{tx("তারিখ", "Date")}</TableHead>
                  <TableHead>{tx("আইটেম", "Item")}</TableHead>
                  <TableHead>{tx("গোডাউন", "Warehouse")}</TableHead>
                  <TableHead>{tx("ধরন", "Type")}</TableHead>
                  <TableHead className="text-right">{tx("পরিমাণ", "Qty")}</TableHead>
                  <TableHead>{tx("নোট", "Notes")}</TableHead>
                  <TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(q.data ?? []).map((m) => {
                    const item = (m as unknown as { item?: { name?: string; unit?: string } }).item;
                    const wh = (m as unknown as { warehouse?: { name?: string } }).warehouse;
                    const t = m.move_type as MoveType;
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="text-sm">{new Date(m.moved_at).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{item?.name ?? "—"}</TableCell>
                        <TableCell>{wh?.name ?? "—"}</TableCell>
                        <TableCell>
                          <Badge className={t === "in" ? "bg-emerald-500 text-white" : t === "out" ? "bg-rose-500 text-white" : "bg-amber-500 text-white"}>
                            {t === "in" ? <ArrowDownToLine className="h-3 w-3 mr-1" /> : t === "out" ? <ArrowUpFromLine className="h-3 w-3 mr-1" /> : null}
                            {t}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{n(Number(m.quantity))} {item?.unit ?? ""}</TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{m.notes ?? "—"}</TableCell>
                        <TableCell><Button size="sm" variant="ghost" className="text-destructive" onClick={() => delMut.mutate(m.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    );
                  })}
                  {(q.data ?? []).length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">{tx("কোনো মুভমেন্ট নেই", "No movements")}</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MoveDialog({ onSaved }: { onSaved: () => void }) {
  const tx = useTx();
  const [open, setOpen] = useState(false);
  const itemsQ = useQuery({ queryKey: ["inv", "items"], queryFn: useServerFn(listItems), enabled: open });
  const whQ = useQuery({ queryKey: ["inv", "warehouses"], queryFn: useServerFn(listWarehouses), enabled: open });
  const create = useServerFn(createMovement);
  const [f, setF] = useState({ item_id: "", warehouse_id: "", move_type: "in" as MoveType, quantity: "1", unit_cost: "0", notes: "" });
  const mut = useMutation({
    mutationFn: () => create({ data: {
      item_id: f.item_id,
      warehouse_id: f.warehouse_id || null,
      move_type: f.move_type,
      quantity: Number(f.quantity),
      unit_cost: Number(f.unit_cost) || 0,
      notes: f.notes || null,
    } }),
    onSuccess: () => { toast.success(tx("যোগ হয়েছে", "Added")); setOpen(false); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="bg-gradient-primary text-white"><Plus className="mr-2 h-4 w-4" />{tx("নতুন মুভমেন্ট", "New Movement")}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{tx("স্টক মুভমেন্ট", "Stock Movement")}</DialogTitle></DialogHeader>
        <form className="grid grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
          <div className="col-span-2 space-y-1.5"><Label>{tx("আইটেম *", "Item *")}</Label>
            <Select value={f.item_id} onValueChange={(v) => setF({ ...f, item_id: v })}>
              <SelectTrigger><SelectValue placeholder={tx("বাছাই করুন", "Select")} /></SelectTrigger>
              <SelectContent>{(itemsQ.data ?? []).map((i) => <SelectItem key={i.id} value={i.id}>{i.name} ({i.unit})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>{tx("গোডাউন", "Warehouse")}</Label>
            <Select value={f.warehouse_id} onValueChange={(v) => setF({ ...f, warehouse_id: v })}>
              <SelectTrigger><SelectValue placeholder={tx("বাছাই", "Select")} /></SelectTrigger>
              <SelectContent>{(whQ.data ?? []).map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>{tx("ধরন", "Type")}</Label>
            <Select value={f.move_type} onValueChange={(v) => setF({ ...f, move_type: v as MoveType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="in">In</SelectItem>
                <SelectItem value="out">Out</SelectItem>
                <SelectItem value="adjust">Adjust (+/-)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>{tx("পরিমাণ", "Quantity")}</Label>
            <Input type="number" step="any" value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>{tx("ইউনিট কস্ট", "Unit Cost")}</Label>
            <Input type="number" step="any" value={f.unit_cost} onChange={(e) => setF({ ...f, unit_cost: e.target.value })} /></div>
          <div className="col-span-2 space-y-1.5"><Label>{tx("নোট", "Notes")}</Label>
            <Input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{tx("বাতিল", "Cancel")}</Button>
            <Button type="submit" className="bg-gradient-primary text-white" disabled={mut.isPending || !f.item_id}>
              {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{tx("সংরক্ষণ", "Save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
