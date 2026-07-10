import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2, LogOut, Receipt, Wifi, User, Wallet, Ticket as TicketIcon,
  ArrowLeft, MapPin, Zap, Calendar, Phone, Mail, Home, ArrowUpCircle,
  MessageCircle, CheckCircle2, Clock, AlertCircle, Send, CreditCard, Pencil, Save, X,
  Camera, Upload, Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getCustomerPortal, submitCustomerRequest, updateCustomerProfile, updateCustomerAvatar } from "@/lib/support.functions";
import { updateMyAddress } from "@/lib/address.functions";
import { AddressSelector, emptyAddress, type AddressValue } from "@/components/address-selector";

export const Route = createFileRoute("/_authenticated/customer")({
  head: () => ({ meta: [{ title: "কাস্টমার পোর্টাল — Net Bill Pro" }] }),
  component: CustomerPortal,
});


const bn = new Intl.NumberFormat("bn-BD");
const bdt = (n: number) => `৳ ${bn.format(Math.round(Number(n) || 0))}`;

const BILL_STATUS: Record<string, { label: string; tone: string }> = {
  paid: { label: "পরিশোধিত", tone: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  unpaid: { label: "অপরিশোধিত", tone: "bg-rose-100 text-rose-700 border-rose-200" },
  partial: { label: "আংশিক", tone: "bg-amber-100 text-amber-700 border-amber-200" },
  overdue: { label: "মেয়াদোত্তীর্ণ", tone: "bg-slate-200 text-slate-700 border-slate-300" },
};

const TICKET_STATUS: Record<string, { label: string; tone: string; Icon: typeof Clock }> = {
  pending: { label: "অপেক্ষমান", tone: "bg-amber-100 text-amber-700 border-amber-200", Icon: Clock },
  in_progress: { label: "চলমান", tone: "bg-sky-100 text-sky-700 border-sky-200", Icon: Loader2 },
  solved: { label: "সমাধান হয়েছে", tone: "bg-emerald-100 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
  closed: { label: "বন্ধ", tone: "bg-slate-200 text-slate-700 border-slate-300", Icon: CheckCircle2 },
};

function CustomerPortal() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/", replace: true });
  };

  const get = useServerFn(getCustomerPortal);
  const q = useQuery({ queryKey: ["customer-portal"], queryFn: () => get() });

  if (q.isLoading) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!q.data?.customer) {
    return (
      <div className="min-h-screen bg-gradient-hero grid place-items-center p-4">
        <Card className="max-w-lg text-center">
          <CardContent className="p-8 space-y-4">
            <User className="h-14 w-14 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-bold">আপনার অ্যাকাউন্ট এখনো লিঙ্ক করা হয়নি</h2>
            <p className="text-sm text-muted-foreground">
              এই ইমেইল ({user?.email}) কোনো কাস্টমারের সাথে যুক্ত নয়। অনুগ্রহ করে ISP অফিসে যোগাযোগ করুন।
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" asChild><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />হোম</Link></Button>
              <Button onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" />লগআউট</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const c = q.data.customer;
  const dueTotal = q.data.bills.reduce((s, b) => s + Number(b.due_amount ?? 0), 0);
  const nextBill = q.data.bills.find((b) => b.status !== "paid");
  const expiryDate = c.expiry_date ? new Date(c.expiry_date) : null;
  const daysToExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-gradient-primary text-white shadow-elevated">
        <div className="mx-auto max-w-6xl px-4 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <HeaderAvatar path={c.avatar_path} name={c.full_name} />
            <div className="min-w-0">
              <div className="font-bold text-lg truncate">{c.full_name}</div>
              <div className="text-sm opacity-90 truncate">
                <span className="font-mono">{c.customer_code}</span> • {c.mobile}
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="secondary" size="sm" asChild><Link to="/">হোম</Link></Button>
          </div>
        </div>
      </header>


      <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        {/* Top stat strip */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="বর্তমান প্যাকেজ" value={c.packages?.name ?? "—"}
            sub={c.packages ? `${c.packages.download_speed}/${c.packages.upload_speed} Mbps` : ""} icon={Wifi} tone="primary" />
          <StatCard label="মাসিক বিল" value={bdt(Number(c.monthly_bill))} icon={Wallet} />
          <StatCard label="মোট বকেয়া" value={bdt(dueTotal)} icon={Receipt}
            tone={dueTotal > 0 ? "rose" : "emerald"} />
          <StatCard
            label="মেয়াদ শেষ"
            value={expiryDate ? expiryDate.toLocaleDateString("bn-BD") : "—"}
            sub={daysToExpiry != null ? (daysToExpiry >= 0 ? `${daysToExpiry} দিন বাকি` : `${-daysToExpiry} দিন আগে`) : ""}
            icon={Calendar}
            tone={daysToExpiry != null && daysToExpiry < 7 ? "rose" : "emerald"}
          />
        </div>

        {/* CTA banner if due */}
        {nextBill && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-rose-200 bg-rose-50 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-rose-600" />
              <div className="text-sm">
                <span className="font-semibold text-rose-700">{bdt(Number(nextBill.due_amount))}</span> বকেয়া রয়েছে —
                বিল নং <span className="font-mono">{nextBill.bill_number}</span>
              </div>
            </div>
            <Button asChild className="bg-gradient-primary text-primary-foreground shadow-glow">
              <Link to="/pay-bill"><CreditCard className="mr-2 h-4 w-4" />এখনই পরিশোধ করুন</Link>
            </Button>
          </div>
        )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
            <TabsTrigger value="overview">ওভারভিউ</TabsTrigger>
            <TabsTrigger value="bills">বিল</TabsTrigger>
            <TabsTrigger value="payments">পেমেন্ট</TabsTrigger>
            <TabsTrigger value="requests">রিকোয়েস্ট</TabsTrigger>
            <TabsTrigger value="support">সাপোর্ট</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            <ProfileCard
              customer={c}
              onSaved={() => qc.invalidateQueries({ queryKey: ["customer-portal"] })}
            />
            <PresentAddressCard
              customer={c}
              onSaved={() => qc.invalidateQueries({ queryKey: ["customer-portal"] })}
            />
          </TabsContent>

          {/* BILLS */}
          <TabsContent value="bills" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" />বিলসমূহ</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {q.data.bills.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">কোনো বিল নেই।</p>
                ) : q.data.bills.map((b) => {
                  const st = BILL_STATUS[b.status] ?? BILL_STATUS.unpaid;
                  return (
                    <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
                      <div className="min-w-0">
                        <div className="font-mono text-xs text-muted-foreground">{b.bill_number}</div>
                        <div className="font-medium">{b.billing_month?.slice(0, 7)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{bdt(Number(b.amount))}</div>
                        {Number(b.due_amount ?? 0) > 0 && (
                          <div className="text-xs text-rose-600">বকেয়া: {bdt(Number(b.due_amount))}</div>
                        )}
                      </div>
                      <Badge variant="outline" className={st.tone}>{st.label}</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PAYMENTS */}
          <TabsContent value="payments" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" />পেমেন্ট ইতিহাস</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {q.data.payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">কোনো পেমেন্ট নেই।</p>
                ) : q.data.payments.map((p) => (
                  <Link
                    key={p.id}
                    to="/pay-bill/receipt/$receiptNo"
                    params={{ receiptNo: p.receipt_number }}
                    className="flex items-center justify-between rounded-xl border p-3 hover:border-primary/60 hover:bg-primary/5 transition-colors"
                  >
                    <div>
                      <div className="font-mono text-xs">{p.receipt_number}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(p.paid_at).toLocaleDateString("bn-BD")} • {p.method}
                      </div>
                    </div>
                    <div className="font-bold">{bdt(Number(p.amount))}</div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* REQUESTS */}
          <TabsContent value="requests" className="mt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <PackageChangeCard
                currentPackageId={c.package_id}
                packages={q.data.packages}
                onSubmitted={() => qc.invalidateQueries({ queryKey: ["customer-portal"] })}
              />
              <AreaChangeCard
                currentZoneId={c.zone_id}
                currentAddress={c.address_line ?? c.address ?? ""}
                zones={q.data.zones}
                onSubmitted={() => qc.invalidateQueries({ queryKey: ["customer-portal"] })}
              />
            </div>






            <Card>
              <CardHeader><CardTitle className="text-base">আপনার সাম্প্রতিক রিকোয়েস্ট</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {q.data.tickets.filter((t) => t.subject?.startsWith("[")).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">এখনো কোনো রিকোয়েস্ট নেই।</p>
                ) : q.data.tickets.filter((t) => t.subject?.startsWith("[")).map((t) => {
                  const st = TICKET_STATUS[t.status] ?? TICKET_STATUS.pending;
                  return (
                    <div key={t.id} className="rounded-xl border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-mono text-xs text-muted-foreground">#{t.ticket_number}</div>
                          <div className="font-medium">{t.subject}</div>
                          {t.description && (
                            <div className="mt-1 whitespace-pre-line text-xs text-muted-foreground">{t.description}</div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(t.created_at).toLocaleString("bn-BD")}
                          </div>
                        </div>
                        <Badge variant="outline" className={st.tone}>{st.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SUPPORT */}
          <TabsContent value="support" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><TicketIcon className="h-5 w-5" />সাপোর্ট টিকেট</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {q.data.tickets.filter((t) => !t.subject?.startsWith("[")).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">কোনো টিকেট নেই।</p>
                ) : q.data.tickets.filter((t) => !t.subject?.startsWith("[")).map((t) => {
                  const st = TICKET_STATUS[t.status] ?? TICKET_STATUS.pending;
                  return (
                    <div key={t.id} className="rounded-xl border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-mono text-xs text-muted-foreground">#{t.ticket_number}</div>
                          <div className="font-medium">{t.subject}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(t.created_at).toLocaleString("bn-BD")}
                          </div>
                        </div>
                        <Badge variant="outline" className={st.tone}>{st.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/* ============ Sub-components ============ */

function InfoRow({
  icon: Icon, label, value, mono,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border p-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`font-semibold truncate ${mono ? "font-mono text-sm" : ""}`}>{value}</div>
      </div>
    </div>
  );
}

function StatCard({
  label, value, sub, icon: Icon, tone,
}: {
  label: string; value: string; sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "primary" | "emerald" | "rose";
}) {
  const toneClass = tone === "rose" ? "text-rose-600" : tone === "emerald" ? "text-emerald-600" : tone === "primary" ? "text-primary" : "";
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className={`mt-1 text-xl font-bold truncate ${toneClass}`}>{value}</div>
            {sub && <div className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</div>}
          </div>
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-white">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type Pkg = { id: string; name: string; download_speed: number; upload_speed: number; monthly_price: number };
type Zn = { id: string; name: string };

function PackageChangeCard({
  currentPackageId, packages, onSubmitted,
}: { currentPackageId: string | null; packages: Pkg[]; onSubmitted: () => void }) {
  const submit = useServerFn(submitCustomerRequest);
  const [targetId, setTargetId] = useState<string>("");
  const [note, setNote] = useState("");

  const options = useMemo(() => packages.filter((p) => p.id !== currentPackageId), [packages, currentPackageId]);

  const m = useMutation({
    mutationFn: () => submit({ data: { kind: "package_change", target_package_id: targetId, note: note || null } }),
    onSuccess: (res) => {
      toast.success(`রিকোয়েস্ট জমা হয়েছে (${res.ticket_number})`);
      setTargetId(""); setNote("");
      onSubmitted();
    },
    onError: (e: any) => toast.error(String(e?.message ?? e)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowUpCircle className="h-5 w-5 text-primary" />
          প্যাকেজ পরিবর্তনের রিকোয়েস্ট
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">নতুন প্যাকেজ</Label>
          <Select value={targetId} onValueChange={setTargetId}>
            <SelectTrigger><SelectValue placeholder="একটি প্যাকেজ বাছাই করুন" /></SelectTrigger>
            <SelectContent>
              {options.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} — {p.download_speed}/{p.upload_speed} Mbps ({bdt(p.monthly_price)}/মাস)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">অতিরিক্ত মন্তব্য (ঐচ্ছিক)</Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="কেন প্যাকেজ পরিবর্তন করতে চান?" />
        </div>
        <Button
          onClick={() => m.mutate()}
          disabled={!targetId || m.isPending}
          className="w-full bg-gradient-primary text-primary-foreground"
        >
          {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" />রিকোয়েস্ট পাঠান</>}
        </Button>
      </CardContent>
    </Card>
  );
}

function AreaChangeCard({
  currentZoneId, currentAddress, zones, onSubmitted,
}: { currentZoneId: string | null; currentAddress: string; zones: Zn[]; onSubmitted: () => void }) {
  const submit = useServerFn(submitCustomerRequest);
  const [targetId, setTargetId] = useState<string>("");
  const [addr, setAddr] = useState<AddressValue>(emptyAddress);
  const [note, setNote] = useState("");

  const options = useMemo(() => zones.filter((z) => z.id !== currentZoneId), [zones, currentZoneId]);

  const m = useMutation({
    mutationFn: () => submit({ data: {
      kind: "area_change",
      target_zone_id: targetId,
      new_address: addr.address_line || null,
      note: note || null,
    } }),
    onSuccess: (res) => {
      toast.success(`রিকোয়েস্ট জমা হয়েছে (${res.ticket_number})`);
      setTargetId(""); setAddr(emptyAddress); setNote("");
      onSubmitted();
    },
    onError: (e: any) => toast.error(String(e?.message ?? e)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-5 w-5 text-primary" />
          এরিয়া পরিবর্তন / নতুন সংযোগ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          বর্তমান ঠিকানা: <b>{currentAddress || "—"}</b>
        </p>
        <div className="space-y-1.5">
          <Label className="text-xs">নতুন এরিয়া (সার্ভিস জোন)</Label>
          <Select value={targetId} onValueChange={setTargetId}>
            <SelectTrigger><SelectValue placeholder="নতুন এরিয়া বাছাই করুন" /></SelectTrigger>
            <SelectContent>
              {options.map((z) => (<SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">নতুন ঠিকানা — সঠিক লোকেশন বাছাই করুন</Label>
          <AddressSelector value={addr} onChange={setAddr} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">মন্তব্য (ঐচ্ছিক)</Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="যেমন কাঙ্ক্ষিত সংযোগের তারিখ" />
        </div>
        <Button
          onClick={() => m.mutate()}
          disabled={!targetId || m.isPending}
          className="w-full bg-gradient-primary text-primary-foreground"
        >
          {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" />রিকোয়েস্ট পাঠান</>}
        </Button>
      </CardContent>
    </Card>
  );
}

function PresentAddressCard({
  customer, onSaved,
}: { customer: CustomerData; onSaved: () => void }) {
  const update = useServerFn(updateMyAddress);
  const [addr, setAddr] = useState<AddressValue>({
    division_id: customer.division_id ?? null,
    district_id: customer.district_id ?? null,
    upazila_id: customer.upazila_id ?? null,
    union_id: customer.union_id ?? null,
    post_office_id: customer.post_office_id ?? null,
    village_id: customer.village_id ?? null,
    area_id: customer.area_id ?? null,
    road_id: customer.road_id ?? null,
    building_id: customer.building_id ?? null,
    mohalla: (customer as any).mohalla ?? null,
    road_name: (customer as any).road_name ?? null,
    holding_no: (customer as any).holding_no ?? null,
    address_line: customer.address_line ?? customer.address ?? null,
  });

  const m = useMutation({
    mutationFn: () => update({ data: addr }),
    onSuccess: () => { toast.success("ঠিকানা আপডেট হয়েছে"); onSaved(); },
    onError: (e: Error) => toast.error("ব্যর্থ", { description: e.message }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Home className="h-5 w-5 text-primary" />
          বর্তমান ঠিকানা আপডেট (Cascading)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AddressSelector value={addr} onChange={setAddr} />
        <div className="flex justify-end">
          <Button className="bg-gradient-primary text-white" onClick={() => m.mutate()} disabled={m.isPending}>
            {m.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            ঠিকানা সংরক্ষণ করুন
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


/* ============ Avatar helpers ============ */

function useAvatarSignedUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["avatar-url", path],
    queryFn: async () => {
      if (!path) return null;
      const { data, error } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 60);
      if (error) return null;
      return data?.signedUrl ?? null;
    },
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
  });
}

function initials(name: string) {
  const parts = (name || "").trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0] || "").join("").toUpperCase() || "?";
}

function HeaderAvatar({ path, name }: { path: string | null | undefined; name: string }) {
  const { data: url } = useAvatarSignedUrl(path);
  return (
    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/20 backdrop-blur">
      {url ? (
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="text-sm font-bold">{initials(name)}</span>
      )}
    </div>
  );
}

/* ============ ProfileCard (view + edit) ============ */

type CustomerData = {
  full_name: string;
  mobile: string;
  alt_mobile: string | null;
  email: string | null;
  address: string | null;
  avatar_path: string | null;
  status: string;
  connection_date: string | null;
  expiry_date: string | null;
  pppoe_username: string | null;
  division_id: number | null;
  district_id: number | null;
  upazila_id: number | null;
  union_id: string | null;
  post_office_id: string | null;
  village_id: string | null;
  area_id: string | null;
  road_id: string | null;
  building_id: string | null;
  address_line: string | null;
  packages: { name: string; download_speed: number; upload_speed: number } | null;
  zones: { name: string } | null;
};

function ProfileCard({ customer, onSaved }: { customer: CustomerData; onSaved: () => void }) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: customer.full_name ?? "",
    address: customer.address ?? "",
  });

  useEffect(() => {
    setForm({
      full_name: customer.full_name ?? "",
      address: customer.address ?? "",
    });
  }, [customer.full_name, customer.address]);

  const update = useServerFn(updateCustomerProfile);
  const m = useMutation({
    mutationFn: () => update({ data: form }),
    onSuccess: () => {
      toast.success("প্রোফাইল সংরক্ষণ করা হয়েছে");
      setEditing(false);
      onSaved();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const cancel = () => {
    setForm({
      full_name: customer.full_name ?? "",
      address: customer.address ?? "",
    });
    setEditing(false);
  };

  const expiryDate = customer.expiry_date ? new Date(customer.expiry_date) : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />প্রোফাইল তথ্য</CardTitle>
        {!editing ? (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="mr-2 h-4 w-4" />এডিট
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={cancel} disabled={m.isPending}>
              <X className="mr-1 h-4 w-4" />বাতিল
            </Button>
            <Button size="sm" onClick={() => m.mutate()} disabled={m.isPending} className="bg-gradient-primary text-primary-foreground">
              {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-1 h-4 w-4" />সংরক্ষণ</>}
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        <AvatarUploader
          userId={user?.id}
          avatarPath={customer.avatar_path}
          name={customer.full_name}
          onChanged={onSaved}
        />

        {!editing ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow icon={User} label="নাম" value={customer.full_name} />
            <InfoRow icon={Phone} label="মোবাইল" value={customer.mobile} />
            <InfoRow icon={Phone} label="বিকল্প মোবাইল" value={customer.alt_mobile || "—"} />
            <InfoRow icon={Mail} label="ইমেইল" value={customer.email || "—"} />
            <InfoRow icon={Home} label="ঠিকানা" value={customer.address ?? "—"} />
            <InfoRow icon={MapPin} label="এরিয়া / জোন" value={customer.zones?.name ?? "—"} />
            <InfoRow icon={Wifi} label="প্যাকেজ" value={
              customer.packages ? `${customer.packages.name} (${customer.packages.download_speed}/${customer.packages.upload_speed} Mbps)` : "—"
            } />
            {customer.pppoe_username && <InfoRow icon={Zap} label="PPPoE ইউজার" value={customer.pppoe_username} mono />}
            <InfoRow icon={Calendar} label="সংযোগ তারিখ" value={customer.connection_date ? new Date(customer.connection_date).toLocaleDateString("bn-BD") : "—"} />
            <InfoRow icon={Calendar} label="মেয়াদ শেষ" value={expiryDate ? expiryDate.toLocaleDateString("bn-BD") : "—"} />
            <InfoRow icon={CheckCircle2} label="স্ট্যাটাস" value={customer.status} />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">নাম *</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">মোবাইল (পরিবর্তনযোগ্য নয়)</Label>
              <Input value={customer.mobile} disabled />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">বিকল্প মোবাইল (পরিবর্তনযোগ্য নয়)</Label>
              <Input value={customer.alt_mobile ?? ""} disabled />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">ইমেইল (পরিবর্তনযোগ্য নয়)</Label>
              <Input value={customer.email ?? ""} disabled />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">ঠিকানা</Label>
              <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} maxLength={500} />
            </div>
            <p className="sm:col-span-2 text-xs text-muted-foreground">
              মোবাইল ও ইমেইল অ্যাডমিন কর্তৃক নিয়ন্ত্রিত — পরিবর্তনের জন্য "রিকোয়েস্ট" ট্যাব ব্যবহার করুন বা অফিসে যোগাযোগ করুন।
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ============ AvatarUploader ============ */

function AvatarUploader({
  userId, avatarPath, name, onChanged,
}: { userId: string | undefined; avatarPath: string | null; name: string; onChanged: () => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const { data: url } = useAvatarSignedUrl(avatarPath);
  const saveAvatar = useServerFn(updateCustomerAvatar);

  const handleFile = async (file: File) => {
    if (!userId) return;
    if (!file.type.startsWith("image/")) {
      toast.error("শুধু ছবি আপলোড করা যাবে");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("সর্বোচ্চ 3MB ছবি আপলোড করা যাবে");
      return;
    }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      // remove the previous file (best-effort)
      if (avatarPath && avatarPath !== path) {
        await supabase.storage.from("avatars").remove([avatarPath]);
      }

      await saveAvatar({ data: { avatar_path: path } });
      toast.success("ছবি আপডেট হয়েছে");
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "আপলোড ব্যর্থ");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!avatarPath) return;
    setBusy(true);
    try {
      await supabase.storage.from("avatars").remove([avatarPath]);
      await saveAvatar({ data: { avatar_path: null } });
      toast.success("ছবি সরানো হয়েছে");
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "মুছে ফেলা যায়নি");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-4 rounded-xl border p-4">
      <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-primary text-white">
        {url ? (
          <img src={url} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xl font-bold">{initials(name)}</span>
        )}
        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-black/40">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">প্রোফাইল ছবি</div>
        <p className="text-xs text-muted-foreground">JPG / PNG, সর্বোচ্চ 3MB</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <Button size="sm" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />{avatarPath ? "পরিবর্তন" : "আপলোড"}
          </Button>
          {avatarPath && (
            <Button size="sm" variant="ghost" disabled={busy} onClick={handleRemove} className="text-rose-600 hover:text-rose-700">
              <Trash2 className="mr-2 h-4 w-4" />সরান
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

