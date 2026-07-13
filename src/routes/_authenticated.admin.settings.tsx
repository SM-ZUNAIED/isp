import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Loader2, Save, Plus, Trash2, Zap, Shield, Signal, Router, Headphones, Award, Wifi, Star, Phone, Users, Upload, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { getSettings, updateSettings } from "@/lib/support.functions";
import { useTx } from "@/hooks/use-i18n";
import { useLogoUrl } from "@/hooks/use-logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({ meta: [{ title: "সেটিংস — Net Bill Pro" }] }),
  component: SettingsPage,
});

type FeatureItem = { icon: string; title_bn: string; title_en: string; desc_bn: string; desc_en: string };
type AboutStat = { value: string; label_bn: string; label_en: string };
type ReviewItem = { name: string; loc_bn: string; loc_en: string; text_bn: string; text_en: string };
type FaqItem = { q_bn: string; q_en: string; a_bn: string; a_en: string };

type LandingContent = {
  hero_badge_bn: string;
  hero_badge_en: string;
  hero_title_en: string;
  hero_subtitle_en: string;
  about_text_en: string;
  features: FeatureItem[];
  about_stats: AboutStat[];
  reviews: ReviewItem[];
  faqs: FaqItem[];
};

type SettingsForm = {
  isp_name: string;
  logo_url: string;
  hero_title: string;
  hero_subtitle: string;
  about_text: string;
  hotline: string;
  whatsapp: string;
  email: string;
  address: string;
  website: string;
  site_title: string;
  site_description: string;
  landing_content: LandingContent;
};

const ICON_MAP: Record<string, LucideIcon> = {
  zap: Zap, shield: Shield, signal: Signal, router: Router, headphones: Headphones,
  award: Award, wifi: Wifi, star: Star, phone: Phone, users: Users,
};
const ICON_OPTIONS = Object.keys(ICON_MAP);


const EMPTY_LANDING: LandingContent = { hero_badge_bn: "", hero_badge_en: "", hero_title_en: "", hero_subtitle_en: "", about_text_en: "", features: [], about_stats: [], reviews: [], faqs: [] };

function SettingsPage() {
  const tx = useTx();
  const get = useServerFn(getSettings);
  const update = useServerFn(updateSettings);
  const qc = useQueryClient();
  const router = useRouter();
  const q = useQuery({ queryKey: ["settings"], queryFn: () => get() });

  const [f, setF] = useState<SettingsForm>({
    isp_name: "", logo_url: "", hero_title: "", hero_subtitle: "", about_text: "",
    hotline: "", whatsapp: "", email: "", address: "", website: "",
    site_title: "", site_description: "",
    landing_content: EMPTY_LANDING,
  });

  useEffect(() => {
    if (q.data) {
      const lc = (q.data.landing_content ?? {}) as Partial<LandingContent>;
      setF({
        isp_name: q.data.isp_name ?? "",
        logo_url: q.data.logo_url ?? "",
        hero_title: q.data.hero_title ?? "",
        hero_subtitle: q.data.hero_subtitle ?? "",
        about_text: q.data.about_text ?? "",
        hotline: q.data.hotline ?? "",
        whatsapp: q.data.whatsapp ?? "",
        email: q.data.email ?? "",
        address: q.data.address ?? "",
        website: q.data.website ?? "",
        site_title: (q.data as { site_title?: string | null }).site_title ?? "",
        site_description: (q.data as { site_description?: string | null }).site_description ?? "",
        landing_content: {
          hero_badge_bn: lc.hero_badge_bn ?? "",
          hero_badge_en: lc.hero_badge_en ?? "",
          hero_title_en: lc.hero_title_en ?? "",
          hero_subtitle_en: lc.hero_subtitle_en ?? "",
          about_text_en: lc.about_text_en ?? "",
          features: lc.features ?? [],
          about_stats: lc.about_stats ?? [],
          reviews: lc.reviews ?? [],
          faqs: lc.faqs ?? [],
        },
      });
    }
  }, [q.data]);

  const mut = useMutation({
    mutationFn: () => update({ data: f }),
    onSuccess: async () => {
      toast.success(tx("সেটিংস সংরক্ষিত", "Settings saved"));
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["settings"] }),
        qc.invalidateQueries({ queryKey: ["landing"] }),
        qc.invalidateQueries({ queryKey: ["site-meta"] }),
        qc.invalidateQueries({ queryKey: ["logo"] }),
      ]);
      await router.invalidate();
    },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });

  if (q.isLoading) {
    return <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const set = (k: keyof Omit<SettingsForm, "landing_content">) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF({ ...f, [k]: e.target.value });

  const setLC = (patch: Partial<LandingContent>) =>
    setF((prev) => ({ ...prev, landing_content: { ...prev.landing_content, ...patch } }));

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{tx("সেটিংস", "Settings")}</h1>
        <p className="text-muted-foreground">{tx("ISP এর সাধারণ তথ্য ও ল্যান্ডিং পেজ কনটেন্ট", "General ISP info and landing page content")}</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-6">
        <Tabs defaultValue="general">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="general">{tx("সাধারণ", "General")}</TabsTrigger>
            <TabsTrigger value="hero">{tx("Hero / About", "Hero / About")}</TabsTrigger>
            <TabsTrigger value="features">{tx("Features", "Features")}</TabsTrigger>
            <TabsTrigger value="stats">{tx("About Stats", "About Stats")}</TabsTrigger>
            <TabsTrigger value="reviews">{tx("Reviews", "Reviews")}</TabsTrigger>
            <TabsTrigger value="faqs">{tx("FAQs", "FAQs")}</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader><CardTitle>{tx("প্রতিষ্ঠান তথ্য", "Organization Info")}</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <LogoUploader
                  value={f.logo_url}
                  onChange={(v) => setF((p) => ({ ...p, logo_url: v }))}
                  tx={tx}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <F label={tx("ISP এর নাম", "ISP Name")}><Input value={f.isp_name} onChange={set("isp_name")} /></F>
                  <F label={tx("ওয়েবসাইট", "Website")}><Input value={f.website} onChange={set("website")} placeholder="https://..." /></F>
                  <F label={tx("হটলাইন", "Hotline")}><Input value={f.hotline} onChange={set("hotline")} /></F>
                  <F label="WhatsApp"><Input value={f.whatsapp} onChange={set("whatsapp")} /></F>
                  <F label={tx("ইমেইল", "Email")}><Input type="email" value={f.email} onChange={set("email")} /></F>
                  <F label={tx("ঠিকানা", "Address")}><Input value={f.address} onChange={set("address")} /></F>
                </div>
                <div className="space-y-4 rounded-xl border p-4">
                  <div>
                    <h3 className="text-sm font-semibold">{tx("ব্রাউজার ট্যাব / SEO", "Browser Tab / SEO")}</h3>
                    <p className="text-xs text-muted-foreground">{tx("ব্রাউজার ট্যাবের টাইটেল ও সার্চ ইঞ্জিনের বিবরণ পরিবর্তন করুন", "Change the browser tab title and search engine description")}</p>
                  </div>
                  <F label={tx("সাইট টাইটেল (ব্রাউজার ট্যাব)", "Site Title (Browser Tab)")}>
                    <Input value={f.site_title} onChange={set("site_title")} placeholder="Net Bill Pro — ISP বিলিং সফটওয়্যার" />
                  </F>
                  <F label={tx("সাইট বিবরণ (Meta Description)", "Site Description (Meta)")}>
                    <Textarea rows={2} value={f.site_description} onChange={set("site_description")} placeholder={tx("সাইট সম্পর্কে সংক্ষিপ্ত বিবরণ", "Short description of your site")} />
                  </F>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hero">
            <Card>
              <CardHeader><CardTitle>{tx("হোম পেজ কনটেন্ট", "Home Page Content")}</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <F label={tx("Hero ব্যাজ (বাংলা)", "Hero Badge (Bangla)")}>
                  <Input value={f.landing_content.hero_badge_bn ?? ""} onChange={(e) => setLC({ hero_badge_bn: e.target.value })} placeholder="বাংলাদেশের ১ নম্বর ISP সফটওয়্যার" />
                </F>
                <F label={tx("Hero ব্যাজ (English)", "Hero Badge (English)")}>
                  <Input value={f.landing_content.hero_badge_en ?? ""} onChange={(e) => setLC({ hero_badge_en: e.target.value })} placeholder="Bangladesh's #1 ISP Software" />
                </F>
                <F label={tx("Hero শিরোনাম (বাংলা)", "Hero Title (Bangla)")}><Input value={f.hero_title} onChange={set("hero_title")} /></F>
                <F label={tx("Hero শিরোনাম (English)", "Hero Title (English)")}>
                  <Input value={f.landing_content.hero_title_en ?? ""} onChange={(e) => setLC({ hero_title_en: e.target.value })} />
                </F>
                <F label={tx("Hero সাব-টাইটেল (বাংলা)", "Hero Subtitle (Bangla)")}><Textarea rows={2} value={f.hero_subtitle} onChange={set("hero_subtitle")} /></F>
                <F label={tx("Hero সাব-টাইটেল (English)", "Hero Subtitle (English)")}>
                  <Textarea rows={2} value={f.landing_content.hero_subtitle_en ?? ""} onChange={(e) => setLC({ hero_subtitle_en: e.target.value })} />
                </F>
                <F label={tx("আমাদের সম্পর্কে (বাংলা)", "About Us (Bangla)")}><Textarea rows={4} value={f.about_text} onChange={set("about_text")} /></F>
                <F label={tx("আমাদের সম্পর্কে (English)", "About Us (English)")}>
                  <Textarea rows={4} value={f.landing_content.about_text_en ?? ""} onChange={(e) => setLC({ about_text_en: e.target.value })} />
                </F>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{tx("ফিচার তালিকা", "Features")}</CardTitle>
                <Button type="button" size="sm" variant="outline" onClick={() =>
                  setLC({ features: [...f.landing_content.features, { icon: "zap", title_bn: "", title_en: "", desc_bn: "", desc_en: "" }] })
                }><Plus className="h-4 w-4 mr-1" /> {tx("যোগ করুন", "Add")}</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {f.landing_content.features.length === 0 && (
                  <p className="text-sm text-muted-foreground">{tx("কোনো ফিচার নেই — 'যোগ করুন' চাপুন", "No features — click Add")}</p>
                )}
                {f.landing_content.features.map((it, i) => (
                  <div key={i} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
                    <F label={tx("আইকন", "Icon")}>
                      <Select value={it.icon} onValueChange={(v) => {
                        const arr = [...f.landing_content.features]; arr[i] = { ...it, icon: v }; setLC({ features: arr });
                      }}>
                        <SelectTrigger>
                          <SelectValue>
                            <span className="inline-flex items-center gap-2">
                              {(() => { const I = ICON_MAP[it.icon] ?? Zap; return <I className="h-4 w-4" />; })()}
                              {it.icon}
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {ICON_OPTIONS.map((k) => {
                            const I = ICON_MAP[k];
                            return (
                              <SelectItem key={k} value={k}>
                                <span className="inline-flex items-center gap-2">
                                  <I className="h-4 w-4" />
                                  {k}
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </F>
                    <div className="flex items-end justify-end">
                      <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => {
                        setLC({ features: f.landing_content.features.filter((_, j) => j !== i) });
                      }}><Trash2 className="h-4 w-4 mr-1" /> {tx("মুছুন", "Remove")}</Button>
                    </div>
                    <F label={tx("শিরোনাম (বাংলা)", "Title (Bangla)")}><Input value={it.title_bn} onChange={(e) => { const a = [...f.landing_content.features]; a[i] = { ...it, title_bn: e.target.value }; setLC({ features: a }); }} /></F>
                    <F label={tx("শিরোনাম (English)", "Title (English)")}><Input value={it.title_en} onChange={(e) => { const a = [...f.landing_content.features]; a[i] = { ...it, title_en: e.target.value }; setLC({ features: a }); }} /></F>
                    <F label={tx("বিবরণ (বাংলা)", "Description (Bangla)")}><Textarea rows={2} value={it.desc_bn} onChange={(e) => { const a = [...f.landing_content.features]; a[i] = { ...it, desc_bn: e.target.value }; setLC({ features: a }); }} /></F>
                    <F label={tx("বিবরণ (English)", "Description (English)")}><Textarea rows={2} value={it.desc_en} onChange={(e) => { const a = [...f.landing_content.features]; a[i] = { ...it, desc_en: e.target.value }; setLC({ features: a }); }} /></F>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{tx("About সেকশনের পরিসংখ্যান", "About Section Stats")}</CardTitle>
                <Button type="button" size="sm" variant="outline" onClick={() =>
                  setLC({ about_stats: [...f.landing_content.about_stats, { value: "", label_bn: "", label_en: "" }] })
                }><Plus className="h-4 w-4 mr-1" /> {tx("যোগ করুন", "Add")}</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {f.landing_content.about_stats.map((it, i) => (
                  <div key={i} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-3">
                    <F label={tx("মান", "Value")}><Input value={it.value} placeholder="10+" onChange={(e) => { const a = [...f.landing_content.about_stats]; a[i] = { ...it, value: e.target.value }; setLC({ about_stats: a }); }} /></F>
                    <F label={tx("লেবেল (বাংলা)", "Label (Bangla)")}><Input value={it.label_bn} onChange={(e) => { const a = [...f.landing_content.about_stats]; a[i] = { ...it, label_bn: e.target.value }; setLC({ about_stats: a }); }} /></F>
                    <F label={tx("লেবেল (English)", "Label (English)")}><Input value={it.label_en} onChange={(e) => { const a = [...f.landing_content.about_stats]; a[i] = { ...it, label_en: e.target.value }; setLC({ about_stats: a }); }} /></F>
                    <div className="sm:col-span-3 flex justify-end">
                      <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => { setLC({ about_stats: f.landing_content.about_stats.filter((_, j) => j !== i) }); }}><Trash2 className="h-4 w-4 mr-1" /> {tx("মুছুন", "Remove")}</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{tx("গ্রাহকদের মতামত", "Customer Reviews")}</CardTitle>
                <Button type="button" size="sm" variant="outline" onClick={() =>
                  setLC({ reviews: [...f.landing_content.reviews, { name: "", loc_bn: "", loc_en: "", text_bn: "", text_en: "" }] })
                }><Plus className="h-4 w-4 mr-1" /> {tx("যোগ করুন", "Add")}</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {f.landing_content.reviews.map((it, i) => (
                  <div key={i} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
                    <F label={tx("নাম", "Name")}><Input value={it.name} onChange={(e) => { const a = [...f.landing_content.reviews]; a[i] = { ...it, name: e.target.value }; setLC({ reviews: a }); }} /></F>
                    <div className="flex items-end justify-end">
                      <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => { setLC({ reviews: f.landing_content.reviews.filter((_, j) => j !== i) }); }}><Trash2 className="h-4 w-4 mr-1" /> {tx("মুছুন", "Remove")}</Button>
                    </div>
                    <F label={tx("এলাকা (বাংলা)", "Location (Bangla)")}><Input value={it.loc_bn} onChange={(e) => { const a = [...f.landing_content.reviews]; a[i] = { ...it, loc_bn: e.target.value }; setLC({ reviews: a }); }} /></F>
                    <F label={tx("এলাকা (English)", "Location (English)")}><Input value={it.loc_en} onChange={(e) => { const a = [...f.landing_content.reviews]; a[i] = { ...it, loc_en: e.target.value }; setLC({ reviews: a }); }} /></F>
                    <F label={tx("মন্তব্য (বাংলা)", "Comment (Bangla)")}><Textarea rows={2} value={it.text_bn} onChange={(e) => { const a = [...f.landing_content.reviews]; a[i] = { ...it, text_bn: e.target.value }; setLC({ reviews: a }); }} /></F>
                    <F label={tx("মন্তব্য (English)", "Comment (English)")}><Textarea rows={2} value={it.text_en} onChange={(e) => { const a = [...f.landing_content.reviews]; a[i] = { ...it, text_en: e.target.value }; setLC({ reviews: a }); }} /></F>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faqs">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{tx("প্রশ্ন ও উত্তর", "FAQs")}</CardTitle>
                <Button type="button" size="sm" variant="outline" onClick={() =>
                  setLC({ faqs: [...f.landing_content.faqs, { q_bn: "", q_en: "", a_bn: "", a_en: "" }] })
                }><Plus className="h-4 w-4 mr-1" /> {tx("যোগ করুন", "Add")}</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {f.landing_content.faqs.map((it, i) => (
                  <div key={i} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
                    <F label={tx("প্রশ্ন (বাংলা)", "Question (Bangla)")}><Input value={it.q_bn} onChange={(e) => { const a = [...f.landing_content.faqs]; a[i] = { ...it, q_bn: e.target.value }; setLC({ faqs: a }); }} /></F>
                    <F label={tx("প্রশ্ন (English)", "Question (English)")}><Input value={it.q_en} onChange={(e) => { const a = [...f.landing_content.faqs]; a[i] = { ...it, q_en: e.target.value }; setLC({ faqs: a }); }} /></F>
                    <F label={tx("উত্তর (বাংলা)", "Answer (Bangla)")}><Textarea rows={2} value={it.a_bn} onChange={(e) => { const a = [...f.landing_content.faqs]; a[i] = { ...it, a_bn: e.target.value }; setLC({ faqs: a }); }} /></F>
                    <F label={tx("উত্তর (English)", "Answer (English)")}><Textarea rows={2} value={it.a_en} onChange={(e) => { const a = [...f.landing_content.faqs]; a[i] = { ...it, a_en: e.target.value }; setLC({ faqs: a }); }} /></F>
                    <div className="sm:col-span-2 flex justify-end">
                      <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => { setLC({ faqs: f.landing_content.faqs.filter((_, j) => j !== i) }); }}><Trash2 className="h-4 w-4 mr-1" /> {tx("মুছুন", "Remove")}</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button type="submit" disabled={mut.isPending} className="bg-gradient-primary text-white">
            {mut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {tx("সংরক্ষণ করুন", "Save")}
          </Button>
        </div>
      </form>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs font-medium">{label}</Label>{children}</div>;
}

function LogoUploader({
  value,
  onChange,
  tx,
}: {
  value: string;
  onChange: (v: string) => void;
  tx: (bn: string, en: string) => string;
}) {
  const { data: url } = useLogoUrl(value);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePick = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(tx("শুধু ছবি আপলোড করুন", "Only images allowed"));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(tx("সর্বোচ্চ আকার ২ MB", "Max size 2 MB"));
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("logos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      // Delete previous stored logo if any (best-effort)
      if (value && !/^https?:\/\//i.test(value) && value !== path) {
        await supabase.storage.from("logos").remove([value]).catch(() => {});
      }
      onChange(path);
      toast.success(tx("লোগো আপলোড হয়েছে — সেভ করুন", "Logo uploaded — click Save"));
    } catch (e) {
      toast.error(tx("আপলোড ব্যর্থ", "Upload failed"), { description: (e as Error).message });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (value && !/^https?:\/\//i.test(value)) {
      await supabase.storage.from("logos").remove([value]).catch(() => {});
    }
    onChange("");
    toast.success(tx("লোগো সরানো হয়েছে — সেভ করুন", "Logo removed — click Save"));
  };

  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium">{tx("লোগো", "Logo")}</Label>
      <div className="flex items-center gap-4 rounded-xl border p-4">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-primary text-white">
          {url ? (
            <img src={url} alt="logo" className="h-full w-full object-contain" />
          ) : (
            <span className="text-lg font-bold">LOGO</span>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-xs text-muted-foreground">
            {tx("PNG/JPG/SVG · সর্বোচ্চ ২ MB · বর্গাকৃতি বাঞ্ছনীয়", "PNG/JPG/SVG · max 2 MB · square recommended")}
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePick(file);
              }}
            />
            <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {value ? tx("পরিবর্তন করুন", "Change") : tx("আপলোড করুন", "Upload")}
            </Button>
            {value && (
              <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={handleRemove}>
                <X className="mr-1 h-4 w-4" /> {tx("সরান", "Remove")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
