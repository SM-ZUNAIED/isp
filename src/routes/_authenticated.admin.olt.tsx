import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Plus, Trash2, Radio, Wifi, WifiOff, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  listOlts, createOlt, updateOlt, deleteOlt,
  listOnus, createOnu, updateOnu, toggleOnu, deleteOnu, listOltsAndCustomers,
} from "@/lib/network.functions";
import { useTx } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/olt")({
  head: () => ({ meta: [{ title: "OLT / ONU — Net Bill Pro" }] }),
  component: OltPage,
});

type OltBrand = "vsol" | "cdata" | "huawei" | "bdcom" | "zte" | "other";
type OltRow = {
  id: string; name: string; ip_address: string; brand: OltBrand;
  pon_ports?: number | null; username?: string | null; notes?: string | null;
  is_online?: boolean | null;
};
type OnuRow = {
  id: string; serial_number: string; mac_address?: string | null;
  pon_port?: string | null; olt_id?: string | null; customer_id?: string | null;
  signal_strength?: number | null; is_online?: boolean | null; is_enabled?: boolean | null;
  olts?: { name: string } | null;
  customers?: { full_name: string; customer_code: string } | null;
};

const BRANDS = [
  { v: "vsol", l: "VSOL" }, { v: "cdata", l: "C-Data" }, { v: "huawei", l: "Huawei" },
  { v: "bdcom", l: "BDCOM" }, { v: "zte", l: "ZTE" }, { v: "other", l_bn: "অন্যান্য", l_en: "Other" },
] as Array<{ v: string; l?: string; l_bn?: string; l_en?: string }>;

function OltPage() {
  const tx = useTx();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{tx("OLT ও ONU ব্যবস্থাপনা", "OLT & ONU Management")}</h1>
        <p className="text-muted-foreground">{tx("PON নেটওয়ার্ক ডিভাইস কনফিগার ও মনিটর করুন", "Configure and monitor PON network devices")}</p>
      </div>

      <Tabs defaultValue="olt">
        <TabsList>
          <TabsTrigger value="olt">{tx("OLT ডিভাইস", "OLT Devices")}</TabsTrigger>
          <TabsTrigger value="onu">{tx("ONU ডিভাইস", "ONU Devices")}</TabsTrigger>
        </TabsList>
        <TabsContent value="olt" className="mt-4"><OltList /></TabsContent>
        <TabsContent value="onu" className="mt-4"><OnuList /></TabsContent>
      </Tabs>
    </div>
  );
}

function OltList() {
  const qc = useQueryClient();
  const tx = useTx();
  const list = useServerFn(listOlts);
  const del = useServerFn(deleteOlt);
  const q = useQuery({ queryKey: ["olts"], queryFn: () => list() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["olts"] });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success(tx("মুছে ফেলা হয়েছে", "Deleted")); invalidate(); },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><OltFormDialog mode="create" onSaved={invalidate} /></div>
      {q.isLoading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (q.data ?? []).length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">{tx("কোনো OLT নেই।", "No OLT found.")}</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(q.data ?? []).map((o) => (
            <Card key={o.id}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-white">
                      <Radio className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold">{o.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{o.ip_address}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="uppercase">{o.brand}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Info label={tx("PON পোর্ট", "PON Ports")} value={String(o.pon_ports ?? 0)} />
                  <Info label={tx("স্ট্যাটাস", "Status")} value={o.is_online ? tx("অনলাইন", "Online") : tx("অফলাইন", "Offline")} tone={o.is_online ? "emerald" : "rose"} />
                </div>
                <div className="flex gap-2">
                  <OltFormDialog
                    mode="edit"
                    initial={o as unknown as OltRow}
                    onSaved={invalidate}
                    trigger={<Button variant="outline" size="sm" className="flex-1"><Pencil className="h-4 w-4 mr-1" /> {tx("এডিট", "Edit")}</Button>}
                  />
                  <Button variant="ghost" size="sm" className="text-destructive flex-1"
                    onClick={() => delMut.mutate(o.id)}>
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

function Info({ label, value, tone }: { label: string; value: string; tone?: "emerald" | "rose" }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-semibold ${tone === "emerald" ? "text-emerald-600" : tone === "rose" ? "text-rose-600" : ""}`}>{value}</div>
    </div>
  );
}

function OltFormDialog({
  mode, initial, onSaved, trigger,
}: {
  mode: "create" | "edit";
  initial?: OltRow;
  onSaved: () => void;
  trigger?: React.ReactNode;
}) {
  const tx = useTx();
  const create = useServerFn(createOlt);
  const update = useServerFn(updateOlt);
  const [open, setOpen] = useState(false);
  const empty = {
    name: "", ip_address: "", brand: "vsol" as OltBrand,
    pon_ports: "8", username: "", password: "", notes: "",
  };
  const seed = initial ? {
    name: initial.name, ip_address: initial.ip_address,
    brand: initial.brand, pon_ports: String(initial.pon_ports ?? 8),
    username: initial.username ?? "", password: "",
    notes: initial.notes ?? "",
  } : empty;
  const [f, setF] = useState(seed);
  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        name: f.name.trim(), ip_address: f.ip_address.trim(),
        brand: f.brand, pon_ports: Number(f.pon_ports) || 8,
        username: f.username || null, password: f.password || null,
        notes: f.notes || null,
      };
      if (mode === "create") await create({ data: payload });
      else await update({ data: { id: initial!.id, ...payload } });
    },
    onSuccess: () => {
      toast.success(mode === "create" ? tx("OLT যুক্ত হয়েছে", "OLT added") : tx("আপডেট হয়েছে", "Updated"));
      setOpen(false); onSaved();
      if (mode === "create") setF(empty);
    },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });
  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v && initial) setF(seed); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-gradient-primary text-white"><Plus className="mr-2 h-4 w-4" />{tx("নতুন OLT", "New OLT")}</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{mode === "create" ? tx("OLT যোগ করুন", "Add OLT") : tx("OLT এডিট", "Edit OLT")}</DialogTitle></DialogHeader>
        <form className="grid grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
          <div className="col-span-2 space-y-1.5"><Label>{tx("নাম", "Name")} *</Label>
            <Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>IP *</Label>
            <Input required value={f.ip_address} onChange={(e) => setF({ ...f, ip_address: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>{tx("ব্র্যান্ড", "Brand")}</Label>
            <Select value={f.brand} onValueChange={(v) => setF({ ...f, brand: v as OltBrand })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{BRANDS.map((b) => <SelectItem key={b.v} value={b.v}>{b.l ?? tx(b.l_bn!, b.l_en!)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>{tx("PON পোর্ট সংখ্যা", "PON Port Count")}</Label>
            <Input type="number" value={f.pon_ports} onChange={(e) => setF({ ...f, pon_ports: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>{tx("ইউজারনেম", "Username")}</Label>
            <Input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>{tx("পাসওয়ার্ড", "Password")} {mode === "edit" && tx("(পরিবর্তনে নতুন দিন)", "(enter new to change)")}</Label>
            <Input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
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

function OnuList() {
  const qc = useQueryClient();
  const tx = useTx();
  const list = useServerFn(listOnus);
  const toggle = useServerFn(toggleOnu);
  const del = useServerFn(deleteOnu);
  const opts = useServerFn(listOltsAndCustomers);

  const q = useQuery({ queryKey: ["onus"], queryFn: () => list() });
  const optsQ = useQuery({ queryKey: ["olts-customers"], queryFn: () => opts() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["onus"] });

  const toggleMut = useMutation({
    mutationFn: (v: { id: string; is_enabled: boolean }) => toggle({ data: v }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success(tx("মুছে ফেলা হয়েছে", "Deleted")); invalidate(); },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <OnuFormDialog
          mode="create"
          olts={optsQ.data?.olts ?? []}
          customers={optsQ.data?.customers ?? []}
          onSaved={invalidate}
        />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serial</TableHead>
                  <TableHead>MAC</TableHead>
                  <TableHead>OLT / PON</TableHead>
                  <TableHead>{tx("কাস্টমার", "Customer")}</TableHead>
                  <TableHead className="text-right">{tx("সিগন্যাল", "Signal")}</TableHead>
                  <TableHead>{tx("স্ট্যাটাস", "Status")}</TableHead>
                  <TableHead>{tx("সক্রিয়", "Active")}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.isLoading && (
                  <TableRow><TableCell colSpan={8} className="py-10 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
                  </TableCell></TableRow>
                )}
                {!q.isLoading && (q.data ?? []).length === 0 && (
                  <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    {tx("কোনো ONU নেই।", "No ONU found.")}
                  </TableCell></TableRow>
                )}
                {(q.data ?? []).map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.serial_number}</TableCell>
                    <TableCell className="font-mono text-xs">{o.mac_address ?? "—"}</TableCell>
                    <TableCell className="text-sm">{o.olts?.name ?? "—"} {o.pon_port ? `/ ${o.pon_port}` : ""}</TableCell>
                    <TableCell>
                      {o.customers ? (
                        <>
                          <div className="text-sm font-medium">{o.customers.full_name}</div>
                          <div className="text-xs text-muted-foreground">{o.customers.customer_code}</div>
                        </>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {o.signal_strength != null ? `${o.signal_strength} dBm` : "—"}
                    </TableCell>
                    <TableCell>
                      {o.is_online ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200"><Wifi className="h-3 w-3 mr-1" />{tx("অনলাইন", "Online")}</Badge>
                      ) : (
                        <Badge className="bg-rose-100 text-rose-700 border border-rose-200"><WifiOff className="h-3 w-3 mr-1" />{tx("অফলাইন", "Offline")}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch checked={!!o.is_enabled}
                        onCheckedChange={(v) => toggleMut.mutate({ id: o.id, is_enabled: v })} />
                    </TableCell>
                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                      <OnuFormDialog
                        mode="edit"
                        initial={o as unknown as OnuRow}
                        olts={optsQ.data?.olts ?? []}
                        customers={optsQ.data?.customers ?? []}
                        onSaved={invalidate}
                        trigger={<Button size="sm" variant="ghost"><Pencil className="h-4 w-4" /></Button>}
                      />
                      <Button size="sm" variant="ghost" className="text-destructive"
                        onClick={() => delMut.mutate(o.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OnuFormDialog({
  mode, initial, olts, customers, onSaved, trigger,
}: {
  mode: "create" | "edit";
  initial?: OnuRow;
  olts: Array<{ id: string; name: string }>;
  customers: Array<{ id: string; full_name: string; customer_code: string }>;
  onSaved: () => void;
  trigger?: React.ReactNode;
}) {
  const create = useServerFn(createOnu);
  const update = useServerFn(updateOnu);
  const [open, setOpen] = useState(false);
  const empty = { serial_number: "", mac_address: "", pon_port: "", olt_id: "", customer_id: "", signal_strength: "" };
  const seed = initial ? {
    serial_number: initial.serial_number,
    mac_address: initial.mac_address ?? "",
    pon_port: initial.pon_port ?? "",
    olt_id: initial.olt_id ?? "",
    customer_id: initial.customer_id ?? "",
    signal_strength: initial.signal_strength != null ? String(initial.signal_strength) : "",
  } : empty;
  const [f, setF] = useState(seed);
  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        serial_number: f.serial_number.trim(),
        mac_address: f.mac_address || null,
        pon_port: f.pon_port || null,
        olt_id: f.olt_id || null,
        customer_id: f.customer_id || null,
        signal_strength: f.signal_strength ? Number(f.signal_strength) : null,
      };
      if (mode === "create") await create({ data: payload });
      else await update({ data: { id: initial!.id, ...payload } });
    },
    onSuccess: () => {
      toast.success(mode === "create" ? "ONU যুক্ত হয়েছে" : "আপডেট হয়েছে");
      setOpen(false); onSaved();
      if (mode === "create") setF(empty);
    },
    onError: (e: Error) => toast.error("ব্যর্থ", { description: e.message }),
  });
  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v && initial) setF(seed); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-gradient-primary text-white"><Plus className="mr-2 h-4 w-4" />নতুন ONU</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{mode === "create" ? "ONU যোগ করুন" : "ONU এডিট"}</DialogTitle></DialogHeader>
        <form className="grid grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
          <div className="col-span-2 space-y-1.5"><Label>Serial *</Label>
            <Input required value={f.serial_number} onChange={(e) => setF({ ...f, serial_number: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>MAC</Label>
            <Input value={f.mac_address} onChange={(e) => setF({ ...f, mac_address: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>PON পোর্ট</Label>
            <Input value={f.pon_port} onChange={(e) => setF({ ...f, pon_port: e.target.value })} placeholder="1/1" /></div>
          <div className="space-y-1.5"><Label>OLT</Label>
            <Select value={f.olt_id} onValueChange={(v) => setF({ ...f, olt_id: v })}>
              <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
              <SelectContent>{olts.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>সিগন্যাল (dBm)</Label>
            <Input type="number" step="0.1" value={f.signal_strength} onChange={(e) => setF({ ...f, signal_strength: e.target.value })} placeholder="-24" /></div>
          <div className="col-span-2 space-y-1.5"><Label>কাস্টমার</Label>
            <Select value={f.customer_id} onValueChange={(v) => setF({ ...f, customer_id: v })}>
              <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.full_name} ({c.customer_code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
