import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/hooks/use-i18n";
import { createReseller, listResellerRefs } from "@/lib/reseller.functions";
import {
  DEFAULT_RESELLER_MODULES, RESELLER_MODULES, RESELLER_MODULE_LABELS, type ResellerModuleKey,
} from "@/lib/reseller-keys";

export const Route = createFileRoute("/_authenticated/admin/resellers/add")({
  component: AddResellerPage,
});

function AddResellerPage() {
  const { lang } = useI18n();
  const L = (b: { bn: string; en: string }) => (lang === "en" ? b.en : b.bn);
  const navigate = useNavigate();

  const refsFn = useServerFn(listResellerRefs);
  const refs = useQuery({ queryKey: ["reseller-refs"], queryFn: () => refsFn() });
  const createFn = useServerFn(createReseller);

  const [f, setF] = useState({
    name: "", business_name: "", username: "", email: "", phone: "", address: "",
    password: "", confirm: "", status: "active",
    opening_balance: "0", credit_limit: "0", commission_percent: "0",
    manager_staff_id: "", mikrotik_id: "", package_id: "", zone_id: "", notes: "",
  });
  const [modules, setModules] = useState<ResellerModuleKey[]>([...DEFAULT_RESELLER_MODULES]);
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  const m = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          name: f.name.trim(),
          business_name: f.business_name.trim() || null,
          username: f.username.trim(),
          email: f.email.trim(),
          phone: f.phone.trim() || null,
          address: f.address.trim() || null,
          status: f.status as "active" | "inactive" | "suspended",
          password: f.password,
          opening_balance: Number(f.opening_balance) || 0,
          credit_limit: Number(f.credit_limit) || 0,
          commission_percent: Number(f.commission_percent) || 0,
          manager_staff_id: f.manager_staff_id || null,
          mikrotik_id: f.mikrotik_id || null,
          package_id: f.package_id || null,
          zone_id: f.zone_id || null,
          notes: f.notes.trim() || null,
          modules,
        },
      }),
    onSuccess: () => {
      toast.success(L({ bn: "রিসেলার তৈরি হয়েছে", en: "Reseller created" }));
      navigate({ to: "/admin/resellers" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = () => {
    if (!f.name.trim() || !f.username.trim() || !f.email.trim()) {
      toast.error(L({ bn: "নাম, ইউজারনেম ও ইমেইল দিন", en: "Name, username and email are required" }));
      return;
    }
    if (f.password.length < 6 || f.password !== f.confirm) {
      toast.error(L({ bn: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর ও মিল থাকতে হবে", en: "Passwords must match and be 6+ chars" }));
      return;
    }
    m.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <UserPlus className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{L({ bn: "নতুন রিসেলার", en: "Add Reseller" })}</h1>
          <p className="text-sm text-muted-foreground">
            {L({ bn: "রিসেলার অ্যাকাউন্ট ও প্রাথমিক অ্যাক্সেস তৈরি করুন", en: "Create a reseller login and its initial access" })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{L({ bn: "প্রাথমিক তথ্য", en: "Basic Information" })}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label={L({ bn: "রিসেলারের নাম", en: "Reseller Name" })}><Input value={f.name} onChange={(e) => set("name")(e.target.value)} /></Field>
            <Field label={L({ bn: "প্রতিষ্ঠানের নাম", en: "Business Name" })}><Input value={f.business_name} onChange={(e) => set("business_name")(e.target.value)} /></Field>
            <Field label={L({ bn: "ফোন", en: "Phone" })}><Input value={f.phone} onChange={(e) => set("phone")(e.target.value)} /></Field>
            <Field label={L({ bn: "স্ট্যাটাস", en: "Status" })}>
              <Select value={f.status} onValueChange={set("status")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{L({ bn: "সক্রিয়", en: "Active" })}</SelectItem>
                  <SelectItem value="inactive">{L({ bn: "নিষ্ক্রিয়", en: "Inactive" })}</SelectItem>
                  <SelectItem value="suspended">{L({ bn: "সাসপেন্ড", en: "Suspended" })}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label={L({ bn: "ঠিকানা", en: "Address" })}><Textarea rows={2} value={f.address} onChange={(e) => set("address")(e.target.value)} /></Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{L({ bn: "লগইন তথ্য", en: "Authentication" })}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label={L({ bn: "ইউজারনেম", en: "Username" })}><Input value={f.username} onChange={(e) => set("username")(e.target.value)} /></Field>
            <Field label={L({ bn: "ইমেইল (লগইন)", en: "Email (login)" })}><Input type="email" value={f.email} onChange={(e) => set("email")(e.target.value)} /></Field>
            <Field label={L({ bn: "পাসওয়ার্ড", en: "Password" })}><Input type="password" value={f.password} onChange={(e) => set("password")(e.target.value)} /></Field>
            <Field label={L({ bn: "পাসওয়ার্ড নিশ্চিত", en: "Confirm Password" })}><Input type="password" value={f.confirm} onChange={(e) => set("confirm")(e.target.value)} /></Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{L({ bn: "আর্থিক তথ্য", en: "Financial Information" })}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Field label={L({ bn: "ওপেনিং ব্যালেন্স", en: "Opening Balance" })}><Input type="number" value={f.opening_balance} onChange={(e) => set("opening_balance")(e.target.value)} /></Field>
            <Field label={L({ bn: "ক্রেডিট লিমিট", en: "Credit Limit" })}><Input type="number" value={f.credit_limit} onChange={(e) => set("credit_limit")(e.target.value)} /></Field>
            <Field label={L({ bn: "কমিশন (%)", en: "Commission (%)" })}><Input type="number" value={f.commission_percent} onChange={(e) => set("commission_percent")(e.target.value)} /></Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{L({ bn: "অ্যাসাইনমেন্ট", en: "Operational Assignment" })}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label={L({ bn: "ম্যানেজার", en: "Manager" })}>
              <RefSelect value={f.manager_staff_id} onChange={set("manager_staff_id")} options={(refs.data?.managers ?? []).map((s) => ({ value: s.id, label: s.full_name }))} />
            </Field>
            <Field label="MikroTik">
              <RefSelect value={f.mikrotik_id} onChange={set("mikrotik_id")} options={(refs.data?.mikrotiks ?? []).map((s) => ({ value: s.id, label: s.name }))} />
            </Field>
            <Field label={L({ bn: "প্যাকেজ", en: "Package" })}>
              <RefSelect value={f.package_id} onChange={set("package_id")} options={(refs.data?.packages ?? []).map((s) => ({ value: s.id, label: s.name }))} />
            </Field>
            <Field label={L({ bn: "POP / এরিয়া (জোন)", en: "POP / Area (Zone)" })}>
              <RefSelect value={f.zone_id} onChange={set("zone_id")} options={(refs.data?.zones ?? []).map((s) => ({ value: s.id, label: s.name }))} />
            </Field>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{L({ bn: "প্রাথমিক মডিউল অ্যাক্সেস", en: "Initial Module Access" })}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RESELLER_MODULES.map((k) => (
            <label key={k} className="flex items-center justify-between rounded-md border p-3">
              <span className="text-sm">{L(RESELLER_MODULE_LABELS[k])}</span>
              <Switch
                checked={modules.includes(k)}
                onCheckedChange={(v) => setModules((s) => (v ? [...s, k] : s.filter((x) => x !== k)))}
              />
            </label>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={submit} disabled={m.isPending}>
          {m.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {L({ bn: "রিসেলার তৈরি করুন", en: "Create Reseller" })}
        </Button>
        <Button variant="outline" onClick={() => navigate({ to: "/admin/resellers" })}>
          {L({ bn: "বাতিল", en: "Cancel" })}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function RefSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <Select value={value || "none"} onValueChange={(v) => onChange(v === "none" ? "" : v)}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="none">—</SelectItem>
        {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
