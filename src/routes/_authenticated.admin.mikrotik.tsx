import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Plus, Trash2, Wifi, WifiOff, Activity, Router as RouterIcon, Pencil } from "lucide-react";
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
  listMikrotiks, createMikrotik, updateMikrotik, pingMikrotik, deleteMikrotik,
} from "@/lib/network.functions";
import { useTx, useFmt } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/mikrotik")({
  head: () => ({ meta: [{ title: "MikroTik — Net Bill Pro" }] }),
  component: MikrotikPage,
});

type MtRow = {
  id: string; name: string; ip_address: string; api_port?: number | null;
  username: string; notes?: string | null; is_online?: boolean | null;
  cpu_load?: number | null; ram_usage?: number | null; last_checked_at?: string | null;
};

function MikrotikPage() {
  const qc = useQueryClient();
  const tx = useTx();
  const { lang } = useFmt();
  const list = useServerFn(listMikrotiks);
  const ping = useServerFn(pingMikrotik);
  const del = useServerFn(deleteMikrotik);

  const q = useQuery({ queryKey: ["mikrotiks"], queryFn: () => list() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["mikrotiks"] });

  const pingMut = useMutation({
    mutationFn: (id: string) => ping({ data: { id } }),
    onSuccess: (r) => { toast[r.online ? "success" : "error"](r.online ? tx("অনলাইন", "Online") : tx("অফলাইন", "Offline")); invalidate(); },
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
          <h1 className="text-2xl md:text-3xl font-bold">{tx("MikroTik রাউটার", "MikroTik Routers")}</h1>
          <p className="text-muted-foreground">{tx("রাউটার যুক্ত করুন এবং স্ট্যাটাস পরীক্ষা করুন", "Add routers and check status")}</p>
        </div>
        <MikrotikFormDialog mode="create" onSaved={invalidate} />
      </div>

      {q.isLoading ? (
        <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (q.data ?? []).length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">
          {tx('কোনো MikroTik যুক্ত নেই। উপরে "নতুন MikroTik" ক্লিক করে যোগ করুন।', 'No MikroTik added. Click "New MikroTik" above to add.')}
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
                    <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200"><Wifi className="h-3 w-3 mr-1" />{tx("অনলাইন", "Online")}</Badge>
                  ) : (
                    <Badge className="bg-rose-100 text-rose-700 border border-rose-200"><WifiOff className="h-3 w-3 mr-1" />{tx("অফলাইন", "Offline")}</Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <MetricBar label="CPU" value={Number(m.cpu_load ?? 0)} />
                  <MetricBar label="RAM" value={Number(m.ram_usage ?? 0)} />
                </div>

                <div className="text-xs text-muted-foreground">
                  {tx("শেষ চেক", "Last checked")}: {m.last_checked_at ? new Date(m.last_checked_at).toLocaleString(lang === "bn" ? "bn-BD" : "en-US") : "—"}
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1"
                    onClick={() => pingMut.mutate(m.id)} disabled={pingMut.isPending}>
                    {pingMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Activity className="h-4 w-4 mr-1" />}
                    {tx("হেলথ চেক", "Health Check")}
                  </Button>
                  <MikrotikFormDialog
                    mode="edit"
                    initial={m as unknown as MtRow}
                    onSaved={invalidate}
                    trigger={<Button size="sm" variant="ghost"><Pencil className="h-4 w-4" /></Button>}
                  />
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

function MikrotikFormDialog({
  mode, initial, onSaved, trigger,
}: {
  mode: "create" | "edit";
  initial?: MtRow;
  onSaved: () => void;
  trigger?: React.ReactNode;
}) {
  const tx = useTx();
  const create = useServerFn(createMikrotik);
  const update = useServerFn(updateMikrotik);
  const [open, setOpen] = useState(false);
  const empty = { name: "", ip_address: "", api_port: "8728", username: "admin", password: "", notes: "" };
  const seed = initial ? {
    name: initial.name, ip_address: initial.ip_address,
    api_port: String(initial.api_port ?? 8728),
    username: initial.username, password: "",
    notes: initial.notes ?? "",
  } : empty;
  const [f, setF] = useState(seed);
  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        name: f.name.trim(), ip_address: f.ip_address.trim(),
        api_port: Number(f.api_port) || 8728,
        username: f.username.trim(), password: f.password,
        notes: f.notes || null,
      };
      if (mode === "create") await create({ data: payload });
      else await update({ data: { id: initial!.id, ...payload } });
    },
    onSuccess: () => {
      toast.success(mode === "create" ? tx("MikroTik যুক্ত হয়েছে", "MikroTik added") : tx("আপডেট হয়েছে", "Updated"));
      setOpen(false); onSaved();
      if (mode === "create") setF(empty);
    },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v && initial) setF(seed); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-gradient-primary text-white"><Plus className="mr-2 h-4 w-4" />{tx("নতুন MikroTik", "New MikroTik")}</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{mode === "create" ? tx("MikroTik যোগ করুন", "Add MikroTik") : tx("MikroTik এডিট", "Edit MikroTik")}</DialogTitle></DialogHeader>
        <form className="grid grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
          <div className="col-span-2 space-y-1.5"><Label>{tx("নাম", "Name")} *</Label>
            <Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Main Router" /></div>
          <div className="space-y-1.5"><Label>{tx("IP অ্যাড্রেস", "IP Address")} *</Label>
            <Input required value={f.ip_address} onChange={(e) => setF({ ...f, ip_address: e.target.value })} placeholder="192.168.1.1" /></div>
          <div className="space-y-1.5"><Label>{tx("API পোর্ট", "API Port")}</Label>
            <Input type="number" value={f.api_port} onChange={(e) => setF({ ...f, api_port: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>{tx("ইউজারনেম", "Username")} *</Label>
            <Input required value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>{tx("পাসওয়ার্ড", "Password")} {mode === "create" ? "*" : tx("(পরিবর্তনে নতুন দিন)", "(enter new to change)")}</Label>
            <Input required={mode === "create"} type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
          <div className="col-span-2 space-y-1.5"><Label>{tx("নোট", "Notes")}</Label>
            <Input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{tx("বাতিল", "Cancel")}</Button>
            <Button type="submit" disabled={mut.isPending} className="bg-gradient-primary text-white">
              {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {tx("সংরক্ষণ", "Save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
