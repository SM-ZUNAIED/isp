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

type PackageRow = {
  id: string; name: string; download_speed: number; upload_speed: number;
  monthly_price: number | string; setup_charge?: number | string | null;
  description?: string | null; is_popular?: boolean | null; is_active?: boolean | null;
};

export const Route = createFileRoute("/_authenticated/admin/packages")({
  head: () => ({ meta: [{ title: "প্যাকেজ — Net Bill Pro" }] }),
  component: PackagesPage,
});

const bn = new Intl.NumberFormat("bn-BD");

function PackagesPage() {
  const qc = useQueryClient();
  const list = useServerFn(listPackages);
  const toggle = useServerFn(togglePackage);
  const del = useServerFn(deletePackage);

  const q = useQuery({ queryKey: ["packages"], queryFn: () => list() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["packages"] });

  const toggleMut = useMutation({
    mutationFn: (v: { id: string; is_active: boolean }) => toggle({ data: v }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error("ব্যর্থ", { description: e.message }),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("মুছে ফেলা হয়েছে"); invalidate(); },
    onError: (e: Error) => toast.error("ব্যর্থ", { description: e.message }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">ইন্টারনেট প্যাকেজ</h1>
          <p className="text-muted-foreground">মোট {bn.format(q.data?.length ?? 0)}টি প্যাকেজ</p>
        </div>
        <NewPackageDialog onCreated={invalidate} />
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
                      {p.is_popular && <Badge className="bg-amber-500 text-white"><Star className="h-3 w-3 mr-1" />জনপ্রিয়</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{p.description || "—"}</p>
                  </div>
                  <Switch
                    checked={!!p.is_active}
                    onCheckedChange={(v) => toggleMut.mutate({ id: p.id, is_active: v })}
                  />
                </div>
                <div className="rounded-xl bg-gradient-primary p-4 text-white">
                  <div className="text-3xl font-bold">৳ {bn.format(Number(p.monthly_price))}</div>
                  <div className="text-xs opacity-90">প্রতি মাসে</div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>ডাউনলোড: <b>{bn.format(p.download_speed)} Mbps</b></span>
                  <span>আপলোড: <b>{bn.format(p.upload_speed)} Mbps</b></span>
                </div>
                <Button variant="ghost" size="sm" className="text-destructive w-full"
                  onClick={() => delMut.mutate(p.id)}>
                  <Trash2 className="h-4 w-4 mr-1" /> মুছে ফেলুন
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function NewPackageDialog({ onCreated }: { onCreated: () => void }) {
  const create = useServerFn(createPackage);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    name: "", download_speed: "20", upload_speed: "20", monthly_price: "500",
    setup_charge: "0", description: "", is_popular: false,
  });
  const mut = useMutation({
    mutationFn: () => create({
      data: {
        name: f.name.trim(),
        download_speed: Number(f.download_speed),
        upload_speed: Number(f.upload_speed),
        monthly_price: Number(f.monthly_price),
        setup_charge: Number(f.setup_charge) || null,
        description: f.description || null,
        is_popular: f.is_popular,
        is_active: true,
      },
    }),
    onSuccess: () => {
      toast.success("প্যাকেজ যুক্ত হয়েছে");
      setOpen(false); onCreated();
      setF({ name: "", download_speed: "20", upload_speed: "20", monthly_price: "500", setup_charge: "0", description: "", is_popular: false });
    },
    onError: (e: Error) => toast.error("ব্যর্থ", { description: e.message }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary text-white"><Plus className="mr-2 h-4 w-4" />নতুন প্যাকেজ</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>নতুন প্যাকেজ</DialogTitle></DialogHeader>
        <form className="grid grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
          <div className="col-span-2 space-y-1.5">
            <Label>নাম *</Label>
            <Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </div>
          <div className="space-y-1.5"><Label>ডাউনলোড (Mbps)</Label>
            <Input type="number" value={f.download_speed} onChange={(e) => setF({ ...f, download_speed: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>আপলোড (Mbps)</Label>
            <Input type="number" value={f.upload_speed} onChange={(e) => setF({ ...f, upload_speed: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>মাসিক দাম (৳)</Label>
            <Input type="number" value={f.monthly_price} onChange={(e) => setF({ ...f, monthly_price: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Setup চার্জ</Label>
            <Input type="number" value={f.setup_charge} onChange={(e) => setF({ ...f, setup_charge: e.target.value })} /></div>
          <div className="col-span-2 space-y-1.5">
            <Label>বর্ণনা</Label>
            <Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          </div>
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <Switch checked={f.is_popular} onCheckedChange={(v) => setF({ ...f, is_popular: v })} />
            জনপ্রিয় হিসেবে দেখান
          </label>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>বাতিল</Button>
            <Button type="submit" className="bg-gradient-primary text-white" disabled={mut.isPending}>
              {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} সংরক্ষণ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
