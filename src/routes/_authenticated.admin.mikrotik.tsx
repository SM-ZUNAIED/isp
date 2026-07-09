import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Plus, Trash2, Wifi, WifiOff, Activity, Router as RouterIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  listMikrotiks, createMikrotik, pingMikrotik, deleteMikrotik,
} from "@/lib/network.functions";

export const Route = createFileRoute("/_authenticated/admin/mikrotik")({
  head: () => ({ meta: [{ title: "MikroTik — Net Bill Pro" }] }),
  component: MikrotikPage,
});

function MikrotikPage() {
  const qc = useQueryClient();
  const list = useServerFn(listMikrotiks);
  const ping = useServerFn(pingMikrotik);
  const del = useServerFn(deleteMikrotik);

  const q = useQuery({ queryKey: ["mikrotiks"], queryFn: () => list() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["mikrotiks"] });

  const pingMut = useMutation({
    mutationFn: (id: string) => ping({ data: { id } }),
    onSuccess: (r) => { toast[r.online ? "success" : "error"](r.online ? "অনলাইন" : "অফলাইন"); invalidate(); },
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
          <h1 className="text-2xl md:text-3xl font-bold">MikroTik রাউটার</h1>
          <p className="text-muted-foreground">রাউটার যুক্ত করুন এবং স্ট্যাটাস পরীক্ষা করুন</p>
        </div>
        <NewMikrotikDialog onCreated={invalidate} />
      </div>

      {q.isLoading ? (
        <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (q.data ?? []).length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">
          কোনো MikroTik যুক্ত নেই। উপরে "নতুন MikroTik" ক্লিক করে যোগ করুন।
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(q.data ?? []).map((m) => (
            <Card key={m.id}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-white">
                      <RouterIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold">{m.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{m.ip_address}:{m.api_port ?? 8728}</div>
                    </div>
                  </div>
                  {m.is_online ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200"><Wifi className="h-3 w-3 mr-1" />অনলাইন</Badge>
                  ) : (
                    <Badge className="bg-rose-100 text-rose-700 border border-rose-200"><WifiOff className="h-3 w-3 mr-1" />অফলাইন</Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <MetricBar label="CPU" value={Number(m.cpu_load ?? 0)} />
                  <MetricBar label="RAM" value={Number(m.ram_usage ?? 0)} />
                </div>

                <div className="text-xs text-muted-foreground">
                  শেষ চেক: {m.last_checked_at ? new Date(m.last_checked_at).toLocaleString("bn-BD") : "—"}
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1"
                    onClick={() => pingMut.mutate(m.id)} disabled={pingMut.isPending}>
                    {pingMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Activity className="h-4 w-4 mr-1" />}
                    হেলথ চেক
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive"
                    onClick={() => delMut.mutate(m.id)}>
                    <Trash2 className="h-4 w-4" />
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

function MetricBar({ label, value }: { label: string; value: number }) {
  const tone = value > 80 ? "text-rose-600" : value > 60 ? "text-amber-600" : "text-emerald-600";
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-semibold ${tone}`}>{value}%</span>
      </div>
      <Progress value={value} className="h-1.5 mt-1" />
    </div>
  );
}

function NewMikrotikDialog({ onCreated }: { onCreated: () => void }) {
  const create = useServerFn(createMikrotik);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    name: "", ip_address: "", api_port: "8728", username: "admin", password: "", notes: "",
  });
  const mut = useMutation({
    mutationFn: () => create({
      data: {
        name: f.name.trim(), ip_address: f.ip_address.trim(),
        api_port: Number(f.api_port) || 8728,
        username: f.username.trim(), password: f.password,
        notes: f.notes || null,
      },
    }),
    onSuccess: () => {
      toast.success("MikroTik যুক্ত হয়েছে");
      setOpen(false); onCreated();
      setF({ name: "", ip_address: "", api_port: "8728", username: "admin", password: "", notes: "" });
    },
    onError: (e: Error) => toast.error("ব্যর্থ", { description: e.message }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary text-white"><Plus className="mr-2 h-4 w-4" />নতুন MikroTik</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>MikroTik যোগ করুন</DialogTitle></DialogHeader>
        <form className="grid grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
          <div className="col-span-2 space-y-1.5"><Label>নাম *</Label>
            <Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Main Router" /></div>
          <div className="space-y-1.5"><Label>IP অ্যাড্রেস *</Label>
            <Input required value={f.ip_address} onChange={(e) => setF({ ...f, ip_address: e.target.value })} placeholder="192.168.1.1" /></div>
          <div className="space-y-1.5"><Label>API পোর্ট</Label>
            <Input type="number" value={f.api_port} onChange={(e) => setF({ ...f, api_port: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>ইউজারনেম *</Label>
            <Input required value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>পাসওয়ার্ড *</Label>
            <Input required type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
          <div className="col-span-2 space-y-1.5"><Label>নোট</Label>
            <Input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
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
