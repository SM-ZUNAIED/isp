import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Plus, Search, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/hooks/use-i18n";
import { useResellerCtx } from "./_authenticated.reseller";
import {
  resellerCustomers, resellerCreateCustomer, resellerUpdateCustomer, resellerDeleteCustomer, resellerRefs,
} from "@/lib/reseller.functions";

export const Route = createFileRoute("/_authenticated/reseller/customers")({
  component: ResellerCustomers,
});

const STATUSES = ["active", "pending", "suspended", "expired", "no_payment"] as const;

function ResellerCustomers() {
  const { lang } = useI18n();
  const L = (b: { bn: string; en: string }) => (lang === "en" ? b.en : b.bn);
  const { can } = useResellerCtx();
  const qc = useQueryClient();

  const listFn = useServerFn(resellerCustomers);
  const refsFn = useServerFn(resellerRefs);
  const createFn = useServerFn(resellerCreateCustomer);
  const updateFn = useServerFn(resellerUpdateCustomer);
  const deleteFn = useServerFn(resellerDeleteCustomer);

  const [term, setTerm] = useState("");
  const [status, setStatus] = useState("all");
  const q = useQuery({
    queryKey: ["reseller-customers", term, status],
    queryFn: () => listFn({ data: { q: term || undefined, status: status === "all" ? undefined : status, limit: 200 } }),
  });
  const refs = useQuery({ queryKey: ["reseller-refs"], queryFn: () => refsFn() });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    customer_code: "", full_name: "", mobile: "", email: "", address: "",
    package_id: "", zone_id: "", monthly_bill: "0", status: "pending",
    pppoe_username: "", pppoe_password: "", ip_address: "",
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["reseller-customers"] });

  const createM = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          customer_code: form.customer_code.trim(),
          full_name: form.full_name.trim(),
          mobile: form.mobile.trim(),
          email: form.email.trim() || null,
          address: form.address.trim() || null,
          package_id: form.package_id || null,
          zone_id: form.zone_id || null,
          monthly_bill: Number(form.monthly_bill) || 0,
          status: form.status as "pending",
          pppoe_username: form.pppoe_username.trim() || null,
          pppoe_password: form.pppoe_password.trim() || null,
          ip_address: form.ip_address.trim() || null,
        },
      }),
    onSuccess: () => { toast.success(L({ bn: "কাস্টমার যোগ হয়েছে", en: "Customer added" })); setOpen(false); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusM = useMutation({
    mutationFn: (v: { id: string; status: string }) => updateFn({ data: { id: v.id, status: v.status as "active" } }),
    onSuccess: () => { toast.success(L({ bn: "আপডেট হয়েছে", en: "Updated" })); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const delM = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { toast.success(L({ bn: "ডিলিট হয়েছে", en: "Deleted" })); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (q.data ?? []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{L({ bn: "কাস্টমার", en: "Customers" })}</h1>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="w-56 pl-8" value={term} onChange={(e) => setTerm(e.target.value)} placeholder={L({ bn: "নাম / আইডি / মোবাইল", en: "Name / ID / mobile" })} />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{L({ bn: "সব স্ট্যাটাস", en: "All statuses" })}</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          {can("customers", "create") && (
            <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />{L({ bn: "নতুন কাস্টমার", en: "Add Customer" })}</Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          {q.isLoading ? (
            <div className="grid place-items-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{L({ bn: "ইউজার আইডি", en: "User ID" })}</TableHead>
                  <TableHead>{L({ bn: "নাম", en: "Name" })}</TableHead>
                  <TableHead>{L({ bn: "মোবাইল", en: "Mobile" })}</TableHead>
                  <TableHead>{L({ bn: "প্যাকেজ", en: "Package" })}</TableHead>
                  <TableHead>{L({ bn: "মাসিক বিল", en: "Monthly" })}</TableHead>
                  <TableHead>{L({ bn: "মেয়াদ", en: "Expiry" })}</TableHead>
                  <TableHead>{L({ bn: "স্ট্যাটাস", en: "Status" })}</TableHead>
                  <TableHead className="text-right">{L({ bn: "অ্যাকশন", en: "Actions" })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">{L({ bn: "কোনো কাস্টমার নেই", en: "No customers" })}</TableCell></TableRow>
                )}
                {rows.map((c) => (
                  <TableRow key={String(c.id)}>
                    <TableCell className="font-mono text-xs">{String(c.customer_code ?? "")}</TableCell>
                    <TableCell className="font-medium">{String(c.full_name ?? "")}</TableCell>
                    <TableCell>{String(c.mobile ?? "—")}</TableCell>
                    <TableCell>{(c.packages as { name?: string } | null)?.name ?? "—"}</TableCell>
                    <TableCell>৳{Number(c.monthly_bill ?? 0).toLocaleString()}</TableCell>
                    <TableCell>{c.expiry_date ? String(c.expiry_date) : "—"}</TableCell>
                    <TableCell>
                      {can("customers", "edit") ? (
                        <Select value={String(c.status)} onValueChange={(v) => statusM.mutate({ id: String(c.id), status: v })}>
                          <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : <Badge variant="secondary">{String(c.status)}</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      {can("customers", "delete") && (
                        <Button size="icon" variant="ghost" className="text-destructive"
                          onClick={() => { if (confirm(L({ bn: "ডিলিট করবেন?", en: "Delete?" }))) delM.mutate(String(c.id)); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {!can("customers", "delete") && !can("customers", "edit") && <Pencil className="ml-auto h-4 w-4 text-muted-foreground opacity-30" />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{L({ bn: "নতুন কাস্টমার", en: "Add Customer" })}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["customer_code", { bn: "ইউজার আইডি", en: "User ID" }],
              ["full_name", { bn: "নাম", en: "Client Name" }],
              ["mobile", { bn: "মোবাইল", en: "Contact" }],
              ["email", { bn: "ইমেইল", en: "Email" }],
              ["address", { bn: "ঠিকানা", en: "Address" }],
              ["pppoe_username", { bn: "PPPoE ইউজারনেম", en: "PPPoE Username" }],
              ["pppoe_password", { bn: "PPPoE পাসওয়ার্ড", en: "PPPoE Password" }],
              ["ip_address", { bn: "স্ট্যাটিক আইপি", en: "Static IP" }],
            ].map(([k, label]) => (
              <div key={k as string} className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{L(label as { bn: string; en: string })}</Label>
                <Input value={(form as Record<string, string>)[k as string]} onChange={(e) => setForm((s) => ({ ...s, [k as string]: e.target.value }))} />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{L({ bn: "প্যাকেজ", en: "Package" })}</Label>
              <Select
                value={form.package_id || "none"}
                onValueChange={(v) => {
                  const p = ((refs.data?.packages ?? []) as Array<{ id: string; monthly_price: number }>).find((x) => x.id === v);
                  setForm((s) => ({ ...s, package_id: v === "none" ? "" : v, monthly_bill: p ? String(p.monthly_price) : s.monthly_bill }));
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {(refs.data?.packages ?? []).map((p: { id: string; name: string }) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{L({ bn: "জোন / POP", en: "Zone / POP" })}</Label>
              <Select value={form.zone_id || "none"} onValueChange={(v) => setForm((s) => ({ ...s, zone_id: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {(refs.data?.zones ?? []).map((z: { id: string; name: string }) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{L({ bn: "মাসিক বিল", en: "Monthly Bill" })}</Label>
              <Input type="number" value={form.monthly_bill} onChange={(e) => setForm((s) => ({ ...s, monthly_bill: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{L({ bn: "স্ট্যাটাস", en: "Status" })}</Label>
              <Select value={form.status} onValueChange={(v) => setForm((s) => ({ ...s, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => createM.mutate()} disabled={createM.isPending || !form.customer_code || !form.full_name}>
              {createM.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{L({ bn: "সেভ", en: "Save" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
