import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Plus, Trash2, Radio, Wifi, WifiOff } from "lucide-react";
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
  listOlts, createOlt, deleteOlt,
  listOnus, createOnu, toggleOnu, deleteOnu, listOltsAndCustomers,
} from "@/lib/network.functions";

export const Route = createFileRoute("/_authenticated/admin/olt")({
  head: () => ({ meta: [{ title: "OLT / ONU — Net Bill Pro" }] }),
  component: OltPage,
});

const BRANDS = [
  { v: "vsol", l: "VSOL" }, { v: "cdata", l: "C-Data" }, { v: "huawei", l: "Huawei" },
  { v: "bdcom", l: "BDCOM" }, { v: "zte", l: "ZTE" }, { v: "other", l: "অন্যান্য" },
];

function OltPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">OLT ও ONU ব্যবস্থাপনা</h1>
        <p className="text-muted-foreground">PON নেটওয়ার্ক ডিভাইস কনফিগার ও মনিটর করুন</p>
      </div>

      <Tabs defaultValue="olt">
        <TabsList>
          <TabsTrigger value="olt">OLT ডিভাইস</TabsTrigger>
          <TabsTrigger value="onu">ONU ডিভাইস</TabsTrigger>
        </TabsList>
        <TabsContent value="olt" className="mt-4"><OltList /></TabsContent>
        <TabsContent value="onu" className="mt-4"><OnuList /></TabsContent>
      </Tabs>
    </div>
  );
}

function OltList() {
  const qc = useQueryClient();
  const list = useServerFn(listOlts);
  const del = useServerFn(deleteOlt);
  const q = useQuery({ queryKey: ["olts"], queryFn: () => list() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["olts"] });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("মুছে ফেলা হয়েছে"); invalidate(); },
    onError: (e: Error) => toast.error("ব্যর্থ", { description: e.message }),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><NewOltDialog onCreated={invalidate} /></div>
      {q.isLoading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (q.data ?? []).length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">কোনো OLT নেই।</CardContent></Card>
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
                  <Info label="PON পোর্ট" value={String(o.pon_ports ?? 0)} />
                  <Info label="স্ট্যাটাস" value={o.is_online ? "অনলাইন" : "অফলাইন"} tone={o.is_online ? "emerald" : "rose"} />
                </div>
                <Button variant="ghost" size="sm" className="text-destructive w-full"
                  onClick={() => delMut.mutate(o.id)}>
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

function Info({ label, value, tone }: { label: string; value: string; tone?: "emerald" | "rose" }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-semibold ${tone === "emerald" ? "text-emerald-600" : tone === "rose" ? "text-rose-600" : ""}`}>{value}</div>
    </div>
  );
}

function NewOltDialog({ onCreated }: { onCreated: () => void }) {
  const create = useServerFn(createOlt);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    name: "", ip_address: "", brand: "vsol" as "vsol" | "cdata" | "huawei" | "bdcom" | "zte" | "other",
    pon_ports: "8", username: "", password: "", notes: "",
  });
  const mut = useMutation({
    mutationFn: () => create({
      data: {
        name: f.name.trim(), ip_address: f.ip_address.trim(),
        brand: f.brand, pon_ports: Number(f.pon_ports) || 8,
        username: f.username || null, password: f.password || null,
        notes: f.notes || null,
      },
    }),
    onSuccess: () => {
      toast.success("OLT যুক্ত হয়েছে"); setOpen(false); onCreated();
      setF({ name: "", ip_address: "", brand: "vsol", pon_ports: "8", username: "", password: "", notes: "" });
    },
    onError: (e: Error) => toast.error("ব্যর্থ", { description: e.message }),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary text-white"><Plus className="mr-2 h-4 w-4" />নতুন OLT</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>OLT যোগ করুন</DialogTitle></DialogHeader>
        <form className="grid grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
          <div className="col-span-2 space-y-1.5"><Label>নাম *</Label>
            <Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>IP *</Label>
            <Input required value={f.ip_address} onChange={(e) => setF({ ...f, ip_address: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>ব্র্যান্ড</Label>
            <Select value={f.brand} onValueChange={(v) => setF({ ...f, brand: v as typeof f.brand })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{BRANDS.map((b) => <SelectItem key={b.v} value={b.v}>{b.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>PON পোর্ট সংখ্যা</Label>
            <Input type="number" value={f.pon_ports} onChange={(e) => setF({ ...f, pon_ports: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>ইউজারনেম</Label>
            <Input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>পাসওয়ার্ড</Label>
            <Input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
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

function OnuList() {
  const qc = useQueryClient();
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
    onError: (e: Error) => toast.error("ব্যর্থ", { description: e.message }),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("মুছে ফেলা হয়েছে"); invalidate(); },
    onError: (e: Error) => toast.error("ব্যর্থ", { description: e.message }),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <NewOnuDialog
          olts={optsQ.data?.olts ?? []}
          customers={optsQ.data?.customers ?? []}
          onCreated={invalidate}
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
                  <TableHead>কাস্টমার</TableHead>
                  <TableHead className="text-right">সিগন্যাল</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead>সক্রিয়</TableHead>
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
                    কোনো ONU নেই।
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
                        <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200"><Wifi className="h-3 w-3 mr-1" />অনলাইন</Badge>
                      ) : (
                        <Badge className="bg-rose-100 text-rose-700 border border-rose-200"><WifiOff className="h-3 w-3 mr-1" />অফলাইন</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch checked={!!o.is_enabled}
                        onCheckedChange={(v) => toggleMut.mutate({ id: o.id, is_enabled: v })} />
                    </TableCell>
                    <TableCell className="text-right">
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

function NewOnuDialog({
  olts, customers, onCreated,
}: {
  olts: Array<{ id: string; name: string }>;
  customers: Array<{ id: string; full_name: string; customer_code: string }>;
  onCreated: () => void;
}) {
  const create = useServerFn(createOnu);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    serial_number: "", mac_address: "", pon_port: "", olt_id: "", customer_id: "", signal_strength: "",
  });
  const mut = useMutation({
    mutationFn: () => create({
      data: {
        serial_number: f.serial_number.trim(),
        mac_address: f.mac_address || null,
        pon_port: f.pon_port || null,
        olt_id: f.olt_id || null,
        customer_id: f.customer_id || null,
        signal_strength: f.signal_strength ? Number(f.signal_strength) : null,
      },
    }),
    onSuccess: () => {
      toast.success("ONU যুক্ত হয়েছে"); setOpen(false); onCreated();
      setF({ serial_number: "", mac_address: "", pon_port: "", olt_id: "", customer_id: "", signal_strength: "" });
    },
    onError: (e: Error) => toast.error("ব্যর্থ", { description: e.message }),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary text-white"><Plus className="mr-2 h-4 w-4" />নতুন ONU</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>ONU যোগ করুন</DialogTitle></DialogHeader>
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
