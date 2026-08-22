import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/hooks/use-i18n";
import { supabase } from "@/integrations/supabase/client";
import { getMyResellerContext, updateMyResellerProfile } from "@/lib/reseller.functions";

export const Route = createFileRoute("/_authenticated/reseller/profile")({
  component: ResellerProfile,
});

function ResellerProfile() {
  const { lang } = useI18n();
  const L = (b: { bn: string; en: string }) => (lang === "en" ? b.en : b.bn);
  const qc = useQueryClient();
  const ctxFn = useServerFn(getMyResellerContext);
  const saveFn = useServerFn(updateMyResellerProfile);

  const q = useQuery({ queryKey: ["reseller-context"], queryFn: () => ctxFn() });
  const r = q.data?.reseller as Record<string, unknown> | undefined;

  const [form, setForm] = useState({ name: "", business_name: "", phone: "", address: "" });
  const [pw, setPw] = useState({ a: "", b: "" });

  useEffect(() => {
    if (r) {
      setForm({
        name: String(r.name ?? ""),
        business_name: String(r.business_name ?? ""),
        phone: String(r.phone ?? ""),
        address: String(r.address ?? ""),
      });
    }
  }, [r]);

  const saveM = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          name: form.name.trim(),
          business_name: form.business_name.trim() || null,
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
        },
      }),
    onSuccess: () => {
      toast.success(L({ bn: "প্রোফাইল আপডেট হয়েছে", en: "Profile updated" }));
      qc.invalidateQueries({ queryKey: ["reseller-context"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pwM = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.updateUser({ password: pw.a });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success(L({ bn: "পাসওয়ার্ড পরিবর্তন হয়েছে", en: "Password changed" }));
      setPw({ a: "", b: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) return <div className="grid place-items-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{L({ bn: "প্রোফাইল", en: "Profile" })}</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">{L({ bn: "তথ্য", en: "Information" })}</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{L({ bn: "নাম", en: "Name" })}</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{L({ bn: "ব্যবসার নাম", en: "Business Name" })}</Label>
            <Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{L({ bn: "ফোন", en: "Phone" })}</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{L({ bn: "ইউজারনেম", en: "Username" })}</Label>
            <Input value={String(r?.username ?? "")} disabled /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label className="text-xs text-muted-foreground">{L({ bn: "ঠিকানা", en: "Address" })}</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="sm:col-span-2">
            <Button onClick={() => saveM.mutate()} disabled={saveM.isPending || form.name.trim().length < 2}>
              {saveM.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{L({ bn: "সেভ করুন", en: "Save" })}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{L({ bn: "পাসওয়ার্ড পরিবর্তন", en: "Change Password" })}</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{L({ bn: "নতুন পাসওয়ার্ড", en: "New Password" })}</Label>
            <Input type="password" value={pw.a} onChange={(e) => setPw({ ...pw, a: e.target.value })} /></div>
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{L({ bn: "নিশ্চিত করুন", en: "Confirm" })}</Label>
            <Input type="password" value={pw.b} onChange={(e) => setPw({ ...pw, b: e.target.value })} /></div>
          <div className="sm:col-span-2">
            <Button
              variant="outline"
              onClick={() => pwM.mutate()}
              disabled={pwM.isPending || pw.a.length < 6 || pw.a !== pw.b}
            >
              {pwM.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{L({ bn: "পরিবর্তন করুন", en: "Update" })}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
