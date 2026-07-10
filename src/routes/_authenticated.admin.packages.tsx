import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Loader2, Trash2, Star, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  listPackages, createPackage, updatePackage, togglePackage, deletePackage,
} from "@/lib/catalog.functions";
import { useTx, useFmt } from "@/hooks/use-i18n";

type PackageRow = {
  id: string; name: string; download_speed: number; upload_speed: number;
  monthly_price: number | string; setup_charge?: number | string | null;
  description?: string | null; is_popular?: boolean | null; is_active?: boolean | null;
};

export const Route = createFileRoute("/_authenticated/admin/packages")({
  head: () => ({ meta: [{ title: "Packages — Net Bill Pro" }] }),
  component: PackagesPage,
});

function PackagesPage() {
  const qc = useQueryClient();
  const tx = useTx();
  const { n, bdt } = useFmt();
  const list = useServerFn(listPackages);
  const toggle = useServerFn(togglePackage);
  const del = useServerFn(deletePackage);

  const q = useQuery({ queryKey: ["packages"], queryFn: () => list() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["packages"] });

  const toggleMut = useMutation({
    mutationFn: (v: { id: string; is_active: boolean }) => toggle({ data: v }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success(tx("মুছে ফেলা হয়েছে", "Deleted")); invalidate(); },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{tx("ইন্টারনেট প্যাকেজ", "Internet Packages")}</h1>
          <p className="text-muted-foreground">
            {tx(`মোট ${n(q.data?.length ?? 0)}টি প্যাকেজ`, `Total ${n(q.data?.length ?? 0)} packages`)}
          </p>
        </div>
        <PackageFormDialog mode="create" onSaved={invalidate} />
      </div>

      {q.isLoading ? (
        <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(q.data ?? []).map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{p.name}</h3>
                      {p.is_popular && (
                        <Badge className="bg-amber-500 text-white">
                          <Star className="h-3 w-3 mr-1" />{tx("জনপ্রিয়", "Popular")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{p.description || "—"}</p>
                  </div>
                  <Switch
                    checked={!!p.is_active}
                    onCheckedChange={(v) => toggleMut.mutate({ id: p.id, is_active: v })}
                  />
                </div>
                <div className="rounded-xl bg-gradient-primary p-4 text-white">
                  <div className="text-3xl font-bold">{bdt(Number(p.monthly_price))}</div>
                  <div className="text-xs opacity-90">{tx("প্রতি মাসে", "per month")}</div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{tx("ডাউনলোড", "Download")}: <b>{n(p.download_speed)} Mbps</b></span>
                  <span>{tx("আপলোড", "Upload")}: <b>{n(p.upload_speed)} Mbps</b></span>
                </div>
                <div className="flex gap-2">
                  <PackageFormDialog
                    mode="edit"
                    initial={p as unknown as PackageRow}
                    onSaved={invalidate}
                    trigger={
                      <Button variant="outline" size="sm" className="flex-1">
                        <Pencil className="h-4 w-4 mr-1" /> {tx("এডিট", "Edit")}
                      </Button>
                    }
                  />
                  <Button variant="ghost" size="sm" className="text-destructive flex-1"
                    onClick={() => delMut.mutate(p.id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> {tx("মুছুন", "Delete")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PackageFormDialog({
  mode, initial, onSaved, trigger,
}: {
  mode: "create" | "edit";
  initial?: PackageRow;
  onSaved: () => void;
  trigger?: React.ReactNode;
}) {
  const tx = useTx();
  const create = useServerFn(createPackage);
  const update = useServerFn(updatePackage);
  const [open, setOpen] = useState(false);
  const empty = {
    name: "", download_speed: "20", upload_speed: "20", monthly_price: "500",
    setup_charge: "0", description: "", is_popular: false, is_active: true,
  };
  const seed = initial ? {
    name: initial.name,
    download_speed: String(initial.download_speed),
    upload_speed: String(initial.upload_speed),
    monthly_price: String(initial.monthly_price),
    setup_charge: String(initial.setup_charge ?? "0"),
    description: initial.description ?? "",
    is_popular: !!initial.is_popular,
    is_active: initial.is_active !== false,
  } : empty;
  const [f, setF] = useState(seed);
  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        name: f.name.trim(),
        download_speed: Number(f.download_speed),
        upload_speed: Number(f.upload_speed),
        monthly_price: Number(f.monthly_price),
        setup_charge: Number(f.setup_charge) || null,
        description: f.description || null,
        is_popular: f.is_popular,
        is_active: f.is_active,
      };
      if (mode === "create") await create({ data: payload });
      else await update({ data: { id: initial!.id, ...payload } });
    },
    onSuccess: () => {
      toast.success(mode === "create" ? tx("প্যাকেজ যুক্ত হয়েছে", "Package added") : tx("আপডেট হয়েছে", "Updated"));
      setOpen(false); onSaved();
      if (mode === "create") setF(empty);
    },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v && initial) setF(seed); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-gradient-primary text-white">
            <Plus className="mr-2 h-4 w-4" />{tx("নতুন প্যাকেজ", "New Package")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? tx("নতুন প্যাকেজ", "New Package") : tx("প্যাকেজ এডিট", "Edit Package")}</DialogTitle>
        </DialogHeader>
        <form className="grid grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
          <div className="col-span-2 space-y-1.5">
            <Label>{tx("নাম *", "Name *")}</Label>
            <Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </div>
          <div className="space-y-1.5"><Label>{tx("ডাউনলোড (Mbps)", "Download (Mbps)")}</Label>
            <Input type="number" value={f.download_speed} onChange={(e) => setF({ ...f, download_speed: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>{tx("আপলোড (Mbps)", "Upload (Mbps)")}</Label>
            <Input type="number" value={f.upload_speed} onChange={(e) => setF({ ...f, upload_speed: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>{tx("মাসিক দাম (৳)", "Monthly Price (BDT)")}</Label>
            <Input type="number" value={f.monthly_price} onChange={(e) => setF({ ...f, monthly_price: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>{tx("Setup চার্জ", "Setup Charge")}</Label>
            <Input type="number" value={f.setup_charge} onChange={(e) => setF({ ...f, setup_charge: e.target.value })} /></div>
          <div className="col-span-2 space-y-1.5">
            <Label>{tx("বর্ণনা", "Description")}</Label>
            <Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          </div>
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <Switch checked={f.is_popular} onCheckedChange={(v) => setF({ ...f, is_popular: v })} />
            {tx("জনপ্রিয় হিসেবে দেখান", "Show as Popular")}
          </label>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{tx("বাতিল", "Cancel")}</Button>
            <Button type="submit" className="bg-gradient-primary text-white" disabled={mut.isPending}>
              {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {tx("সংরক্ষণ", "Save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
