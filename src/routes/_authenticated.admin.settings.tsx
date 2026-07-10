import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSettings, updateSettings } from "@/lib/support.functions";
import { useTx } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({ meta: [{ title: "সেটিংস — Net Bill Pro" }] }),
  component: SettingsPage,
});

type SettingsForm = {
  isp_name: string;
  hero_title: string;
  hero_subtitle: string;
  about_text: string;
  hotline: string;
  whatsapp: string;
  email: string;
  address: string;
  website: string;
};

function SettingsPage() {
  const get = useServerFn(getSettings);
  const update = useServerFn(updateSettings);
  const q = useQuery({ queryKey: ["settings"], queryFn: () => get() });

  const [f, setF] = useState<SettingsForm>({
    isp_name: "", hero_title: "", hero_subtitle: "", about_text: "",
    hotline: "", whatsapp: "", email: "", address: "", website: "",
  });

  useEffect(() => {
    if (q.data) {
      setF({
        isp_name: q.data.isp_name ?? "",
        hero_title: q.data.hero_title ?? "",
        hero_subtitle: q.data.hero_subtitle ?? "",
        about_text: q.data.about_text ?? "",
        hotline: q.data.hotline ?? "",
        whatsapp: q.data.whatsapp ?? "",
        email: q.data.email ?? "",
        address: q.data.address ?? "",
        website: q.data.website ?? "",
      });
    }
  }, [q.data]);

  const mut = useMutation({
    mutationFn: () => update({ data: f }),
    onSuccess: () => toast.success("সেটিংস সংরক্ষিত"),
    onError: (e: Error) => toast.error("ব্যর্থ", { description: e.message }),
  });

  if (q.isLoading) {
    return <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const set = (k: keyof SettingsForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">সেটিংস</h1>
        <p className="text-muted-foreground">ISP এর সাধারণ তথ্য কনফিগার করুন</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>প্রতিষ্ঠান তথ্য</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <F label="ISP এর নাম"><Input value={f.isp_name} onChange={set("isp_name")} /></F>
            <F label="ওয়েবসাইট"><Input value={f.website} onChange={set("website")} placeholder="https://..." /></F>
            <F label="হটলাইন"><Input value={f.hotline} onChange={set("hotline")} /></F>
            <F label="WhatsApp"><Input value={f.whatsapp} onChange={set("whatsapp")} /></F>
            <F label="ইমেইল"><Input type="email" value={f.email} onChange={set("email")} /></F>
            <F label="ঠিকানা"><Input value={f.address} onChange={set("address")} /></F>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>হোম পেজ কনটেন্ট</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <F label="Hero শিরোনাম"><Input value={f.hero_title} onChange={set("hero_title")} /></F>
            <F label="Hero সাব-টাইটেল"><Textarea rows={2} value={f.hero_subtitle} onChange={set("hero_subtitle")} /></F>
            <F label="আমাদের সম্পর্কে"><Textarea rows={4} value={f.about_text} onChange={set("about_text")} /></F>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={mut.isPending} className="bg-gradient-primary text-white">
            {mut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            সংরক্ষণ করুন
          </Button>
        </div>
      </form>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs font-medium">{label}</Label>{children}</div>;
}
