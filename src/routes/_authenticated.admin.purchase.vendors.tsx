import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Loader2, Trash2, Pencil, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { listVendors, createVendor, updateVendor, deleteVendor } from "@/lib/purchase.functions";
import { useTx } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/purchase/vendors")({
  head: () => ({ meta: [{ title: "Vendors — Net Bill Pro" }] }),
  component: VendorsPage,
});

type VendorRow = {
  id: string; name: string; contact_person: string | null; mobile: string | null;
  email: string | null; address: string | null; notes: string | null;
};

function VendorsPage() {
  const tx = useTx();
  const qc = useQueryClient();
  const list = useServerFn(listVendors);
  const del = useServerFn(deleteVendor);
  const q = useQuery({ queryKey: ["vendors"], queryFn: () => list() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["vendors"] });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success(tx("মুছে ফেলা হয়েছে", "Deleted")); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{tx("সরবরাহকারী", "Vendors")}</h1>
          <p className="text-muted-foreground">{tx(`মোট ${q.data?.length ?? 0} জন`, `Total ${q.data?.length ?? 0}`)}</p>
        </div>
        <VendorDialog mode="create" onSaved={invalidate} />
      </div>

      <Card>
        <CardContent className="p-0">
          {q.isLoading ? <div className="grid place-items-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>{tx("নাম", "Name")}</TableHead>
                  <TableHead>{tx("যোগাযোগ ব্যক্তি", "Contact")}</TableHead>
                  <TableHead>{tx("মোবাইল", "Mobile")}</TableHead>
                  <TableHead>{tx("ইমেইল", "Email")}</TableHead>
                  <TableHead>{tx("ঠিকানা", "Address")}</TableHead>
                  <TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(q.data ?? []).map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.name}</TableCell>
                      <TableCell>{v.contact_person ?? "—"}</TableCell>
                      <TableCell>{v.mobile ? <a href={`tel:${v.mobile}`} className="flex items-center gap-1 text-primary"><Phone className="h-3 w-3" />{v.mobile}</a> : "—"}</TableCell>
                      <TableCell>{v.email ? <a href={`mailto:${v.email}`} className="flex items-center gap-1 text-primary"><Mail className="h-3 w-3" />{v.email}</a> : "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{v.address ?? "—"}</TableCell>
                      <TableCell className="flex gap-1 justify-end">
                        <VendorDialog mode="edit" initial={v as unknown as VendorRow} onSaved={invalidate} trigger={<Button size="sm" variant="ghost"><Pencil className="h-4 w-4" /></Button>} />
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => delMut.mutate(v.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(q.data ?? []).length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{tx("কোনো ভেন্ডর নেই", "No vendors")}</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function VendorDialog({ mode, initial, onSaved, trigger }: { mode: "create" | "edit"; initial?: VendorRow; onSaved: () => void; trigger?: React.ReactNode }) {
  const tx = useTx();
  const [open, setOpen] = useState(false);
  const create = useServerFn(createVendor);
  const update = useServerFn(updateVendor);
  const empty = { name: "", contact_person: "", mobile: "", email: "", address: "", notes: "" };
  const seed = initial ? {
    name: initial.name, contact_person: initial.contact_person ?? "", mobile: initial.mobile ?? "",
    email: initial.email ?? "", address: initial.address ?? "", notes: initial.notes ?? "",
  } : empty;
  const [f, setF] = useState(seed);
  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        name: f.name.trim(),
        contact_person: f.contact_person || null,
        mobile: f.mobile || null,
        email: f.email || null,
        address: f.address || null,
        notes: f.notes || null,
      };
      if (mode === "create") await create({ data: payload });
      else await update({ data: { id: initial!.id, ...payload } });
    },
    onSuccess: () => { toast.success(tx("সংরক্ষিত", "Saved")); setOpen(false); onSaved(); if (mode === "create") setF(empty); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v && initial) setF(seed); }}>
      <DialogTrigger asChild>{trigger ?? <Button className="bg-gradient-primary text-white"><Plus className="mr-2 h-4 w-4" />{tx("নতুন ভেন্ডর", "New Vendor")}</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{mode === "create" ? tx("নতুন ভেন্ডর", "New Vendor") : tx("এডিট ভেন্ডর", "Edit Vendor")}</DialogTitle></DialogHeader>
        <form className="grid grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
          <div className="col-span-2 space-y-1.5"><Label>{tx("নাম *", "Name *")}</Label>
            <Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>{tx("যোগাযোগ ব্যক্তি", "Contact Person")}</Label>
            <Input value={f.contact_person} onChange={(e) => setF({ ...f, contact_person: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>{tx("মোবাইল", "Mobile")}</Label>
            <Input value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value })} /></div>
          <div className="col-span-2 space-y-1.5"><Label>{tx("ইমেইল", "Email")}</Label>
            <Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div className="col-span-2 space-y-1.5"><Label>{tx("ঠিকানা", "Address")}</Label>
            <Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
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
