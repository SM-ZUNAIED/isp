import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Plus, Search, Loader2, Trash2, Power, PowerOff, Pencil, MapPin, X, Eye, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  listCustomers, createCustomer, updateCustomer, updateCustomerStatus, deleteCustomer, listPackagesAndZones,
  bulkImportCustomers,
} from "@/lib/customers.functions";
import { Textarea } from "@/components/ui/textarea";
import { AddressSelector, emptyAddress, type AddressValue } from "@/components/address-selector";
import { useTx, useFmt } from "@/hooks/use-i18n";

type CustomerStatus = "pending" | "active" | "suspended" | "expired";
type CustomerRow = {
  id: string; customer_code: string; full_name: string; mobile: string; alt_mobile?: string | null;
  email?: string | null;
  address?: string | null; address_line?: string | null;
  division_id?: number | null; district_id?: number | null; upazila_id?: number | null;
  union_id?: string | null; post_office_id?: string | null; village_id?: string | null;
  area_id?: string | null; road_id?: string | null; building_id?: string | null;
  mohalla?: string | null; road_name?: string | null; holding_no?: string | null;
  package_id?: string | null; zone_id?: string | null;
  monthly_bill: number | string; status: CustomerStatus;
  pppoe_username?: string | null; pppoe_password?: string | null;
};

export const Route = createFileRoute("/_authenticated/admin/customers")({
  head: () => ({ meta: [{ title: "Customers — Net Bill Pro" }] }),
  component: CustomersPage,
});

const STATUS_TONE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  suspended: "bg-rose-100 text-rose-700 border-rose-200",
  expired: "bg-slate-200 text-slate-700 border-slate-300",
  no_payment: "bg-orange-100 text-orange-700 border-orange-200",
};

function CustomersPage() {
  const qc = useQueryClient();
  const tx = useTx();
  const { n } = useFmt();
  const STATUS_LABEL: Record<string, string> = {
    active: tx("সক্রিয়", "Active"),
    pending: tx("অপেক্ষমাণ", "Pending"),
    suspended: tx("স্থগিত", "Suspended"),
    expired: tx("মেয়াদ শেষ", "Expired"),
    no_payment: tx("পেমেন্ট নেই", "No Payment"),
  };
  const list = useServerFn(listCustomers);
  const opts = useServerFn(listPackagesAndZones);
  const setStatus = useServerFn(updateCustomerStatus);
  const del = useServerFn(deleteCustomer);

  const [q, setQ] = useState("");
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [mohalla, setMohalla] = useState<string | null>(null);
  const [roadName, setRoadName] = useState<string | null>(null);

  const customersQ = useQuery({ queryKey: ["customers"], queryFn: () => list() });
  const optsQ = useQuery({ queryKey: ["catalog", "customers-opts"], queryFn: () => opts() });

  // Auto-sync filter options from the current customers list + zones catalog.
  const zoneOptions = useMemo(() => {
    const zonesById = new Map((optsQ.data?.zones ?? []).map((z) => [z.id, z.name]));
    const usedIds = new Set<string>();
    for (const r of customersQ.data ?? []) if (r.zone_id) usedIds.add(r.zone_id);
    return Array.from(usedIds)
      .map((id) => ({ id, name: zonesById.get(id) ?? id }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [customersQ.data, optsQ.data?.zones]);

  const mohallaOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of customersQ.data ?? []) {
      const v = (r.mohalla ?? "").trim();
      if (v) set.add(v);
    }
    return Array.from(set).sort().map((v) => ({ id: v, name: v }));
  }, [customersQ.data]);

  const roadOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of customersQ.data ?? []) {
      const v = (r.road_name ?? "").trim();
      if (v) set.add(v);
    }
    return Array.from(set).sort().map((v) => ({ id: v, name: v }));
  }, [customersQ.data]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["customers"] });

  const statusMut = useMutation({
    mutationFn: (v: { id: string; status: "active" | "pending" | "suspended" | "expired" | "no_payment" }) =>
      setStatus({ data: v }),
    onSuccess: () => { toast.success(tx("স্ট্যাটাস আপডেট হয়েছে", "Status updated")); invalidate(); },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success(tx("মুছে ফেলা হয়েছে", "Deleted")); invalidate(); },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });

  const rows = useMemo(() => {
    let all = customersQ.data ?? [];
    if (zoneId) all = all.filter((r) => r.zone_id === zoneId);
    if (mohalla) all = all.filter((r) => (r.mohalla ?? "").trim() === mohalla);
    if (roadName) all = all.filter((r) => (r.road_name ?? "").trim() === roadName);
    if (!q.trim()) return all;
    const s = q.toLowerCase();
    return all.filter(
      (r) =>
        r.full_name?.toLowerCase().includes(s) ||
        r.customer_code?.toLowerCase().includes(s) ||
        r.mobile?.toLowerCase().includes(s) ||
        r.address_line?.toLowerCase().includes(s) ||
        r.address?.toLowerCase().includes(s),
    );
  }, [customersQ.data, q, zoneId, mohalla, roadName]);

  const clearFilters = () => { setZoneId(null); setMohalla(null); setRoadName(null); };
  const hasFilter = zoneId != null || mohalla != null || roadName != null || q.trim() !== "";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{tx("কাস্টমার ব্যবস্থাপনা", "Customer Management")}</h1>
          <p className="text-muted-foreground">
            {tx(`মোট ${n(customersQ.data?.length ?? 0)} জন কাস্টমার`, `Total ${n(customersQ.data?.length ?? 0)} customers`)}
          </p>
        </div>
        <CustomerFormDialog
          mode="create"
          packages={optsQ.data?.packages ?? []}
          zones={optsQ.data?.zones ?? []}
          onSaved={invalidate}
        />
        <BulkImportDialog onSaved={invalidate} />
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-xs">{tx("খুঁজুন", "Search")}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={tx("নাম, কোড, মোবাইল, ঠিকানা...", "Name, code, mobile, address...")}
                    className="pl-9"
                  />
                </div>
              </div>
              <FilterSelect
                label={tx("জোন", "Zone")}
                loading={customersQ.isLoading}
                rows={zoneOptions}
                value={zoneId}
                onChange={(v) => setZoneId(v as string | null)}
              />
              <FilterSelect
                label={tx("মহল্লা / এরিয়া", "Mohalla / Area")}
                loading={customersQ.isLoading}
                rows={mohallaOptions}
                value={mohalla}
                onChange={(v) => setMohalla(v as string | null)}
              />
              <FilterSelect
                label={tx("রোড / রাস্তা", "Road / Street")}
                loading={customersQ.isLoading}
                rows={roadOptions}
                value={roadName}
                onChange={(v) => setRoadName(v as string | null)}
              />
            </div>
            {hasFilter && (
              <Button variant="outline" size="sm" onClick={() => { setQ(""); clearFilters(); }} className="lg:mb-0.5">
                <X className="h-4 w-4 mr-1" /> {tx("ফিল্টার ক্লিয়ার", "Clear filters")}
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            {tx(
              `দেখানো হচ্ছে ${n(rows.length)} / ${n(customersQ.data?.length ?? 0)} জন`,
              `Showing ${n(rows.length)} / ${n(customersQ.data?.length ?? 0)}`,
            )}
          </div>

          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tx("ইউজার আইডি", "User ID")}</TableHead>
                  <TableHead>{tx("নাম", "Name")}</TableHead>
                  <TableHead>{tx("মোবাইল", "Mobile")}</TableHead>
                  <TableHead>{tx("ঠিকানা", "Address")}</TableHead>
                  <TableHead>{tx("প্যাকেজ", "Package")}</TableHead>
                  <TableHead>{tx("জোন", "Zone")}</TableHead>
                  <TableHead className="text-right">{tx("বিল (৳)", "Bill (BDT)")}</TableHead>
                  <TableHead>{tx("স্ট্যাটাস", "Status")}</TableHead>
                  <TableHead className="text-right">{tx("অ্যাকশন", "Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customersQ.isLoading && (
                  <TableRow><TableCell colSpan={9} className="py-10 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
                  </TableCell></TableRow>
                )}
                {!customersQ.isLoading && rows.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    {tx("কোনো কাস্টমার নেই।", "No customers found.")}
                  </TableCell></TableRow>
                )}
                {rows.map((r) => {
                  const isActive = r.status === "active";
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.customer_code}</TableCell>
                      <TableCell className="font-medium">{r.full_name}</TableCell>
                      <TableCell>{r.mobile}</TableCell>
                      <TableCell className="max-w-[240px]">
                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          {(r.address_line || r.address) && <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />}
                          <span className="line-clamp-2">{r.address_line || r.address || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{r.packages?.name ?? "—"}</TableCell>
                      <TableCell>{r.zones?.name ?? "—"}</TableCell>
                      <TableCell className="text-right">{n(Number(r.monthly_bill ?? 0))}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_TONE[r.status]}>
                          {STATUS_LABEL[r.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            statusMut.mutate({
                              id: r.id,
                              status: isActive ? "suspended" : "active",
                            })
                          }
                          disabled={statusMut.isPending}
                        >
                          {isActive ? (
                            <><PowerOff className="h-4 w-4 mr-1" /> {tx("স্থগিত", "Suspend")}</>
                          ) : (
                            <><Power className="h-4 w-4 mr-1" /> {tx("সক্রিয়", "Activate")}</>
                          )}
                        </Button>
                        <Button size="sm" variant="ghost" asChild title={tx("বিস্তারিত দেখুন", "View details")}>
                          <Link to="/admin/customers/$id" params={{ id: r.id }}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <CustomerFormDialog
                          mode="edit"
                          initial={r as unknown as CustomerRow}
                          packages={optsQ.data?.packages ?? []}
                          zones={optsQ.data?.zones ?? []}
                          onSaved={invalidate}
                          trigger={
                            <Button size="sm" variant="ghost">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{tx("মুছে ফেলবেন?", "Delete?")}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {tx(
                                  `"${r.full_name}" এর সব তথ্য মুছে যাবে। এটি ফেরানো যাবে না।`,
                                  `All data for "${r.full_name}" will be removed. This cannot be undone.`,
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{tx("বাতিল", "Cancel")}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMut.mutate(r.id)}>
                                {tx("মুছে ফেলুন", "Delete")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CustomerFormDialog({
  mode, initial, packages, zones, onSaved, trigger,
}: {
  mode: "create" | "edit";
  initial?: CustomerRow;
  packages: Array<{ id: string; name: string; monthly_price: number }>;
  zones: Array<{ id: string; name: string }>;
  onSaved: () => void;
  trigger?: React.ReactNode;
}) {
  const tx = useTx();
  const create = useServerFn(createCustomer);
  const update = useServerFn(updateCustomer);
  const [open, setOpen] = useState(false);
  const empty = {
    customer_code: "", full_name: "", mobile: "", alt_mobile: "", email: "", address: "", package_id: "",
    zone_id: "", monthly_bill: "0", status: "pending" as CustomerStatus,
    pppoe_username: "", pppoe_password: "",
  };
  const seed = initial
    ? {
        customer_code: initial.customer_code ?? "",
        full_name: initial.full_name ?? "",
        mobile: initial.mobile ?? "",
        alt_mobile: initial.alt_mobile ?? "",
        email: initial.email ?? "",
        address: initial.address ?? "",
        package_id: initial.package_id ?? "",
        zone_id: initial.zone_id ?? "",
        monthly_bill: String(initial.monthly_bill ?? "0"),
        status: (initial.status ?? "pending") as CustomerStatus,
        pppoe_username: initial.pppoe_username ?? "",
        pppoe_password: initial.pppoe_password ?? "",
      }
    : empty;
  const [form, setForm] = useState(seed);
  const [addr, setAddr] = useState<AddressValue>(
    initial
      ? {
          division_id: initial.division_id ?? null,
          district_id: initial.district_id ?? null,
          upazila_id: initial.upazila_id ?? null,
          union_id: initial.union_id ?? null,
          post_office_id: initial.post_office_id ?? null,
          village_id: initial.village_id ?? null,
          area_id: initial.area_id ?? null,
          road_id: initial.road_id ?? null,
          building_id: initial.building_id ?? null,
          mohalla: initial.mohalla ?? null,
          road_name: initial.road_name ?? null,
          holding_no: initial.holding_no ?? null,
          address_line: initial.address_line ?? initial.address ?? null,
        }
      : emptyAddress,
  );

  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        customer_code: form.customer_code.trim(),
        full_name: form.full_name.trim(),
        mobile: form.mobile.trim(),
        alt_mobile: form.alt_mobile.trim() || null,
        email: form.email.trim() || null,
        address: addr.address_line || form.address || null,
        address_line: addr.address_line || null,
        division_id: addr.division_id,
        district_id: addr.district_id,
        upazila_id: addr.upazila_id,
        union_id: addr.union_id,
        post_office_id: addr.post_office_id,
        village_id: addr.village_id,
        area_id: addr.area_id,
        road_id: addr.road_id,
        building_id: addr.building_id,
        mohalla: addr.mohalla,
        road_name: addr.road_name,
        holding_no: addr.holding_no,
        package_id: form.package_id || null,
        zone_id: form.zone_id || null,
        monthly_bill: Number(form.monthly_bill) || 0,
        status: form.status,
        pppoe_username: form.pppoe_username || null,
        pppoe_password: form.pppoe_password || null,
      };
      if (mode === "create") await create({ data: payload });
      else await update({ data: { id: initial!.id, ...payload } });
    },
    onSuccess: () => {
      toast.success(mode === "create" ? tx("কাস্টমার যুক্ত হয়েছে", "Customer added") : tx("আপডেট হয়েছে", "Updated"));
      setOpen(false);
      if (mode === "create") { setForm(empty); setAddr(emptyAddress); }
      onSaved();
    },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v && initial) setForm(seed); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-gradient-primary text-white shadow-soft">
            <Plus className="mr-2 h-4 w-4" /> {tx("নতুন কাস্টমার", "New Customer")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? tx("নতুন কাস্টমার যোগ করুন", "Add New Customer") : tx("কাস্টমার এডিট করুন", "Edit Customer")}
          </DialogTitle>
        </DialogHeader>
        <form
          className="space-y-5"
          onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={tx("ইউজার আইডি *", "User ID *")}>
              <Input required value={form.customer_code}
                onChange={(e) => setForm({ ...form, customer_code: e.target.value })} placeholder="CUS-001" />
            </Field>
            <Field label={tx("পূর্ণ নাম *", "Full Name *")}>
              <Input required value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </Field>
            <Field label={mode === "edit" ? tx("মোবাইল (পরিবর্তনযোগ্য নয়)", "Mobile (not editable)") : tx("মোবাইল *", "Mobile *")}>
              <Input
                required
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                placeholder="01XXXXXXXXX"
                readOnly={mode === "edit"}
                disabled={mode === "edit"}
                className={mode === "edit" ? "bg-muted cursor-not-allowed" : ""}
              />
            </Field>
            <Field label={tx("বিকল্প মোবাইল", "Alternate Mobile")}>
              <Input
                value={form.alt_mobile}
                onChange={(e) => setForm({ ...form, alt_mobile: e.target.value })}
                placeholder="01XXXXXXXXX"
              />
            </Field>
            <Field label={tx("ইমেইল", "Email")}>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@example.com"
              />
            </Field>

            <Field label={tx("মাসিক বিল (৳)", "Monthly Bill (BDT)")}>
              <Input type="number" min={0} value={form.monthly_bill}
                onChange={(e) => setForm({ ...form, monthly_bill: e.target.value })} />
            </Field>
            <Field label={tx("প্যাকেজ", "Package")}>
              <Select value={form.package_id}
                onValueChange={(v) => {
                  const p = packages.find((x) => x.id === v);
                  setForm({ ...form, package_id: v, monthly_bill: p ? String(p.monthly_price) : form.monthly_bill });
                }}>
                <SelectTrigger><SelectValue placeholder={tx("নির্বাচন করুন", "Select")} /></SelectTrigger>
                <SelectContent>
                  {packages.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} — ৳{p.monthly_price}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={tx("জোন", "Zone")}>
              <Select value={form.zone_id} onValueChange={(v) => setForm({ ...form, zone_id: v })}>
                <SelectTrigger><SelectValue placeholder={tx("নির্বাচন করুন", "Select")} /></SelectTrigger>
                <SelectContent>
                  {zones.map((z) => (<SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="PPPoE Username">
              <Input value={form.pppoe_username}
                onChange={(e) => setForm({ ...form, pppoe_username: e.target.value })} />
            </Field>
            <Field label="PPPoE Password">
              <Input value={form.pppoe_password}
                onChange={(e) => setForm({ ...form, pppoe_password: e.target.value })} />
            </Field>
            <Field label={tx("স্ট্যাটাস", "Status")}>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as CustomerStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{tx("অপেক্ষমাণ", "Pending")}</SelectItem>
                  <SelectItem value="active">{tx("সক্রিয়", "Active")}</SelectItem>
                  <SelectItem value="suspended">{tx("স্থগিত", "Suspended")}</SelectItem>
                  <SelectItem value="expired">{tx("মেয়াদ শেষ", "Expired")}</SelectItem>
                  <SelectItem value="no_payment">{tx("পেমেন্ট নেই", "No Payment")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
            <div className="text-sm font-semibold">{tx("ঠিকানা (ক্যাসকেডিং)", "Address (Cascading)")}</div>
            <AddressSelector
              value={addr}
              onChange={setAddr}
              zoneId={form.zone_id || null}
              onZoneChange={(id) => setForm({ ...form, zone_id: id ?? "" })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{tx("বাতিল", "Cancel")}</Button>
            <Button type="submit" disabled={mut.isPending} className="bg-gradient-primary text-white">
              {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tx("সংরক্ষণ করুন", "Save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}

function FilterSelect({
  label, rows, loading, value, onChange, disabled, depHint,
}: {
  label: string;
  rows: Array<{ id: number | string; name: string; bn_name?: string | null }>;
  loading: boolean;
  value: number | string | null;
  onChange: (v: number | string | null) => void;
  disabled?: boolean;
  depHint?: string;
}) {
  const tx = useTx();
  const { lang } = useFmt();
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Select
        disabled={disabled}
        value={value == null ? "__all__" : String(value)}
        onValueChange={(v) => {
          if (v === "__all__") return onChange(null);
          const n = Number(v);
          onChange(!Number.isNaN(n) && String(n) === v ? n : v);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={disabled ? (depHint ?? tx("নিষ্ক্রিয়", "Disabled")) : (loading ? tx("লোড হচ্ছে...", "Loading...") : tx("সব", "All"))} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{tx("সব", "All")} {label}</SelectItem>
          {rows.map((r) => (
            <SelectItem key={String(r.id)} value={String(r.id)}>
              {lang === "bn" ? (r.bn_name || r.name) : (r.name || r.bn_name)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function BulkImportDialog({ onSaved }: { onSaved: () => void }) {
  const tx = useTx();
  const importFn = useServerFn(bulkImportCustomers);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ added: number; skipped: number; failed: Array<{ line: number; reason: string }> } | null>(null);

  const parsed = useMemo(() => {
    const rows: Array<{ customer_code: string; full_name: string; package_name: string }> = [];
    const errors: Array<{ line: number; reason: string }> = [];
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    lines.forEach((line, idx) => {
      const lineNo = idx + 1;
      const parts = line.split(/\t|,/).map((s) => s.trim()).filter((_, i, arr) => arr.length > 0);
      // Skip header row
      if (idx === 0 && /user\s*id|customer/i.test(parts[0] ?? "") && /name/i.test(parts[1] ?? "")) return;
      if (parts.length < 3) {
        errors.push({ line: lineNo, reason: tx("কমপক্ষে ৩টি কলাম প্রয়োজন (User ID, Name, Package)", "At least 3 columns required (User ID, Name, Package)") });
        return;
      }
      const [code, name, ...rest] = parts;
      const pkg = rest.join(", ").trim();
      if (!code || !name || !pkg) {
        errors.push({ line: lineNo, reason: tx("খালি ফিল্ড", "Empty field") });
        return;
      }
      rows.push({ customer_code: code, full_name: name, package_name: pkg });
    });
    return { rows, errors };
  }, [text, tx]);

  const mut = useMutation({
    mutationFn: async () => importFn({ data: { rows: parsed.rows } }),
    onSuccess: (r) => {
      setResult(r);
      onSaved();
      toast.success(tx(`${r.added} জন যুক্ত হয়েছে`, `${r.added} added`));
    },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });

  const reset = () => { setText(""); setResult(null); };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          {tx("বাল্ক ইমপোর্ট", "Bulk Import")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{tx("কাস্টমার বাল্ক ইমপোর্ট", "Bulk Import Customers")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            {tx(
              "প্রতি লাইনে একজন কাস্টমার — User ID, Name, Package (কমা বা ট্যাব দিয়ে আলাদা)।",
              "One customer per line — User ID, Name, Package (comma or tab separated).",
            )}
          </div>
          <pre className="rounded-md bg-muted p-2 text-xs">{`User ID, Name, Package\nC001, Rahim Uddin, 10 Mbps\nC002, Karim Ali, 20 Mbps`}</pre>

          <Textarea
            rows={10}
            placeholder="C001, Rahim Uddin, 10 Mbps"
            value={text}
            onChange={(e) => { setText(e.target.value); setResult(null); }}
          />

          {text.trim() && !result && (
            <div className="text-sm">
              {tx(`${parsed.rows.length} টি বৈধ সারি`, `${parsed.rows.length} valid rows`)}
              {parsed.errors.length > 0 && (
                <span className="text-destructive"> · {tx(`${parsed.errors.length} টি ত্রুটি`, `${parsed.errors.length} errors`)}</span>
              )}
            </div>
          )}

          {parsed.errors.length > 0 && !result && (
            <div className="max-h-32 overflow-y-auto rounded border p-2 text-xs space-y-1">
              {parsed.errors.map((e) => (
                <div key={e.line} className="text-destructive">Line {e.line}: {e.reason}</div>
              ))}
            </div>
          )}

          {result && (
            <div className="rounded-md border p-3 space-y-2 text-sm">
              <div>✅ {tx("যুক্ত হয়েছে", "Added")}: <b>{result.added}</b></div>
              <div>⏭️ {tx("ডুপ্লিকেট এড়ানো হয়েছে", "Skipped duplicates")}: <b>{result.skipped}</b></div>
              {result.failed.length > 0 && (
                <div>
                  <div className="text-destructive">⚠️ {tx("ব্যর্থ", "Failed")}: <b>{result.failed.length}</b></div>
                  <div className="mt-1 max-h-32 overflow-y-auto text-xs space-y-1">
                    {result.failed.map((f) => (
                      <div key={f.line}>Line {f.line}: {f.reason}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>{tx("বন্ধ", "Close")}</Button>
          {!result && (
            <Button
              onClick={() => mut.mutate()}
              disabled={parsed.rows.length === 0 || mut.isPending}
              className="bg-gradient-primary text-white"
            >
              {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tx(`ইমপোর্ট করুন (${parsed.rows.length})`, `Import (${parsed.rows.length})`)}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
