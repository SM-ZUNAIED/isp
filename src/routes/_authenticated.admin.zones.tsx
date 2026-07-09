import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Loader2, Trash2, MapPin, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { listZones, createZone, updateZone, deleteZone } from "@/lib/catalog.functions";

export const Route = createFileRoute("/_authenticated/admin/zones")({
  head: () => ({ meta: [{ title: "জোন — Net Bill Pro" }] }),
  component: ZonesPage,
});

type ZoneRow = { id: string; name: string; description?: string | null };

function ZonesPage() {
  const qc = useQueryClient();
  const list = useServerFn(listZones);
  const create = useServerFn(createZone);
  const del = useServerFn(deleteZone);

  const q = useQuery({ queryKey: ["zones"], queryFn: () => list() });
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const invalidate = () => qc.invalidateQueries({ queryKey: ["zones"] });

  const createMut = useMutation({
    mutationFn: () => create({ data: { name: name.trim(), description: desc || null } }),
    onSuccess: () => { toast.success("জোন যুক্ত হয়েছে"); setName(""); setDesc(""); invalidate(); },
    onError: (e: Error) => toast.error("ব্যর্থ", { description: e.message }),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("মুছে ফেলা হয়েছে"); invalidate(); },
    onError: (e: Error) => toast.error("ব্যর্থ", { description: e.message }),
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">জোন / এলাকা</h1>
        <p className="text-muted-foreground">সার্ভিস এলাকাসমূহ যোগ করুন</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <form className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3"
            onSubmit={(e) => { e.preventDefault(); if (name.trim()) createMut.mutate(); }}>
            <Input placeholder="জোনের নাম" required value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="বর্ণনা (ঐচ্ছিক)" value={desc} onChange={(e) => setDesc(e.target.value)} />
            <Button type="submit" disabled={createMut.isPending} className="bg-gradient-primary text-white">
              {createMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              যোগ করুন
            </Button>
          </form>
        </CardContent>
      </Card>

      {q.isLoading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(q.data ?? []).map((z) => (
            <Card key={z.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-white">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{z.name}</div>
                    <div className="text-xs text-muted-foreground">{z.description || "—"}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <EditZoneDialog zone={z as ZoneRow} onSaved={invalidate} />
                  <Button variant="ghost" size="icon" className="text-destructive"
                    onClick={() => delMut.mutate(z.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {(q.data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6 sm:col-span-2">কোনো জোন নেই।</p>
          )}
        </div>
      )}
    </div>
  );
}

function EditZoneDialog({ zone, onSaved }: { zone: ZoneRow; onSaved: () => void }) {
  const update = useServerFn(updateZone);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(zone.name);
  const [desc, setDesc] = useState(zone.description ?? "");
  const mut = useMutation({
    mutationFn: () => update({ data: { id: zone.id, name: name.trim(), description: desc || null } }),
    onSuccess: () => { toast.success("আপডেট হয়েছে"); setOpen(false); onSaved(); },
    onError: (e: Error) => toast.error("ব্যর্থ", { description: e.message }),
  });
  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) { setName(zone.name); setDesc(zone.description ?? ""); } }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>জোন এডিট</DialogTitle></DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
          <div className="space-y-1.5"><Label>নাম *</Label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>বর্ণনা</Label>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
          <DialogFooter>
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
