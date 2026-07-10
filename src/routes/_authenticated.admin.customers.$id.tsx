import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft, MapPin, User, Phone, Wifi, Package as PackageIcon,
  Receipt, Wallet, Building2, Milestone, Landmark, ExternalLink, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { getCustomerDetail } from "@/lib/customers.functions";

export const Route = createFileRoute("/_authenticated/admin/customers/$id")({
  head: () => ({ meta: [{ title: "কাস্টমার বিস্তারিত — Net Bill Pro" }] }),
  component: CustomerDetailPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center space-y-3">
      <p className="text-destructive font-medium">{error.message}</p>
      <Button asChild variant="outline"><Link to="/admin/customers">ফিরে যান</Link></Button>
    </div>
  ),
  notFoundComponent: () => <div className="p-8 text-center">কাস্টমার নেই।</div>,
});

const bn = new Intl.NumberFormat("bn-BD");
const bdt = (n: number | string | null | undefined) => `৳ ${bn.format(Math.round(Number(n ?? 0)))}`;
const fmtDate = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleDateString("bn-BD", { year: "numeric", month: "short", day: "numeric" }) : "—";

const STATUS: Record<string, string> = { active: "সক্রিয়", pending: "অপেক্ষমাণ", suspended: "স্থগিত", expired: "মেয়াদ শেষ" };
const STATUS_TONE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  suspended: "bg-rose-100 text-rose-700 border-rose-200",
  expired: "bg-slate-200 text-slate-700 border-slate-300",
};
const BILL_TONE: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  partial: "bg-amber-100 text-amber-700 border-amber-200",
  unpaid: "bg-rose-100 text-rose-700 border-rose-200",
  overdue: "bg-rose-100 text-rose-700 border-rose-200",
};

function CustomerDetailPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const fetchDetail = useServerFn(getCustomerDetail);
  const q = useQuery({ queryKey: ["customer-detail", id], queryFn: () => fetchDetail({ data: { id } }) });

  if (q.isLoading) {
    return <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (q.error || !q.data) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-destructive">{(q.error as Error)?.message ?? "কাস্টমার লোড হয়নি"}</p>
        <Button variant="outline" onClick={() => router.invalidate()}>রিট্রাই</Button>
      </div>
    );
  }
  const { customer: c, address: a, bills, payments } = q.data;

  const totalBilled = bills.reduce((s, b) => s + Number(b.amount ?? 0), 0);
  const totalPaid = bills.reduce((s, b) => s + Number(b.paid_amount ?? 0), 0);
  const totalDue = bills.reduce((s, b) => s + Number(b.due_amount ?? 0), 0);

  const label = (o: { name?: string; bn_name?: string | null } | null | undefined) =>
    o ? (o.bn_name || o.name || "—") : "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/customers"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{c.full_name}</h1>
            <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-2 py-0.5 font-mono text-primary">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">ID</span>
                <span className="font-semibold">
                  {(c.customer_code ?? "").slice(0, 5).toUpperCase()}-{c.mobile}
                </span>
              </span>
              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{c.mobile}</span>
              {c.alt_mobile && (
                <span className="flex items-center gap-1 text-xs">
                  <Phone className="h-3 w-3" />বিকল্প: {c.alt_mobile}
                </span>
              )}
              <Badge variant="outline" className={STATUS_TONE[c.status]}>{STATUS[c.status] ?? c.status}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<PackageIcon className="h-5 w-5" />} tone="from-blue-500 to-indigo-600"
          label="প্যাকেজ" value={c.packages?.name ?? "—"} sub={c.packages?.monthly_price ? bdt(c.packages.monthly_price) + "/মাস" : undefined} />
        <StatCard icon={<Wallet className="h-5 w-5" />} tone="from-emerald-500 to-teal-600"
          label="মাসিক বিল" value={bdt(c.monthly_bill)} sub={c.expiry_date ? `মেয়াদ: ${fmtDate(c.expiry_date)}` : undefined} />
        <StatCard icon={<Receipt className="h-5 w-5" />} tone="from-purple-500 to-fuchsia-600"
          label="মোট বিলিং" value={bdt(totalBilled)} sub={`${bn.format(bills.length)} টি বিল`} />
        <StatCard icon={<Wallet className="h-5 w-5" />} tone="from-rose-500 to-orange-500"
          label="বকেয়া" value={bdt(totalDue)} sub={`${bdt(totalPaid)} পরিশোধিত`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ============ Address breakdown ============ */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2 border-b pb-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <div className="font-semibold">সম্পূর্ণ ঠিকানা</div>
                <div className="text-xs text-muted-foreground">ক্যাসকেডিং BD address breakdown</div>
              </div>
            </div>

            {/* Composed address line */}
            {(c.address_line || c.address) && (
              <div className="rounded-lg bg-muted/40 p-3 text-sm">
                <span className="text-muted-foreground text-xs">সম্পূর্ণ:</span>{" "}
                <span className="font-medium">{c.address_line || c.address}</span>
              </div>
            )}

            {/* Address level grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <AddrItem icon={<Landmark className="h-4 w-4" />} label="বিভাগ" value={label(a.division)} />
              <AddrItem icon={<Landmark className="h-4 w-4" />} label="জেলা" value={label(a.district)} />
              <AddrItem icon={<Milestone className="h-4 w-4" />} label="উপজেলা" value={label(a.upazila)} />
              <AddrItem icon={<Milestone className="h-4 w-4" />} label="ইউনিয়ন" value={label(a.union)} />
              <AddrItem icon={<Milestone className="h-4 w-4" />} label="পোস্ট অফিস"
                value={label(a.post_office)} extra={a.post_office?.code ? `কোড ${a.post_office.code}` : undefined} />
              <AddrItem icon={<Milestone className="h-4 w-4" />} label="গ্রাম" value={label(a.village)} />
              <AddrItem icon={<Milestone className="h-4 w-4" />} label="এরিয়া" value={label(a.area)} />
              <AddrItem icon={<Milestone className="h-4 w-4" />} label="রোড" value={label(a.road)} />
              <AddrItem icon={<Building2 className="h-4 w-4" />} label="বিল্ডিং"
                value={a.building?.name ?? "—"}
                extra={[
                  a.building?.holding_number && `হোল্ডিং ${a.building.holding_number}`,
                  a.building?.house_number && `বাসা ${a.building.house_number}`,
                ].filter(Boolean).join(" · ") || undefined} />
            </div>

            {a.building?.google_map_url && (
              <Button asChild variant="outline" size="sm">
                <a href={a.building.google_map_url} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1.5" /> Google Maps-এ দেখুন
                </a>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* ============ Contact / PPPoE ============ */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </div>
              <div className="font-semibold">সংযোগ ও যোগাযোগ</div>
            </div>
            <InfoRow icon={<Phone className="h-4 w-4" />} label="মোবাইল" value={c.mobile} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="বিকল্প মোবাইল" value={c.alt_mobile || "—"} />
            <InfoRow icon={<MapPin className="h-4 w-4" />} label="জোন" value={c.zones?.name ?? "—"} />
            <InfoRow icon={<Wifi className="h-4 w-4" />} label="PPPoE User" value={c.pppoe_username || "—"} mono />
            <InfoRow icon={<Wifi className="h-4 w-4" />} label="PPPoE Pass" value={c.pppoe_password || "—"} mono />
            <InfoRow icon={<Receipt className="h-4 w-4" />} label="যোগদান" value={fmtDate(c.created_at)} />
          </CardContent>
        </Card>
      </div>

      {/* ============ Bills history ============ */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="font-semibold">সাম্প্রতিক বিল</div>
          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>বিল নং</TableHead><TableHead>মাস</TableHead>
                <TableHead className="text-right">অ্যামাউন্ট</TableHead>
                <TableHead className="text-right">পরিশোধিত</TableHead>
                <TableHead className="text-right">বকেয়া</TableHead>
                <TableHead>ডিউ ডেট</TableHead><TableHead>স্ট্যাটাস</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {bills.length === 0 && <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">কোনো বিল নেই।</TableCell></TableRow>}
                {bills.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">{b.bill_number}</TableCell>
                    <TableCell>{fmtDate(b.billing_month)}</TableCell>
                    <TableCell className="text-right">{bdt(b.amount)}</TableCell>
                    <TableCell className="text-right text-emerald-600">{bdt(b.paid_amount)}</TableCell>
                    <TableCell className="text-right text-rose-600">{bdt(b.due_amount)}</TableCell>
                    <TableCell>{fmtDate(b.due_date)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={BILL_TONE[b.status] ?? ""}>{b.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ============ Payments history ============ */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="font-semibold">সাম্প্রতিক পেমেন্ট</div>
          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>রিসিট</TableHead><TableHead>তারিখ</TableHead>
                <TableHead>মেথড</TableHead><TableHead>TrxID</TableHead>
                <TableHead className="text-right">অ্যামাউন্ট</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {payments.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">কোনো পেমেন্ট নেই।</TableCell></TableRow>}
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.receipt_number}</TableCell>
                    <TableCell>{fmtDate(p.paid_at)}</TableCell>
                    <TableCell><Badge variant="secondary">{p.method}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{p.transaction_id || "—"}</TableCell>
                    <TableCell className="text-right">{bdt(p.amount)}</TableCell>
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

function AddrItem({ icon, label, value, extra }: {
  icon: React.ReactNode; label: string; value: string; extra?: string;
}) {
  const empty = !value || value === "—";
  return (
    <div className={`rounded-lg border p-3 ${empty ? "bg-muted/20" : "bg-card"}`}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="text-primary">{icon}</span>{label}
      </div>
      <div className={`font-medium mt-0.5 ${empty ? "text-muted-foreground/60" : ""}`}>{value}</div>
      {extra && <div className="text-xs text-muted-foreground mt-0.5">{extra}</div>}
    </div>
  );
}

function InfoRow({ icon, label, value, mono }: {
  icon: React.ReactNode; label: string; value: string; mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="text-primary">{icon}</span>{label}
      </div>
      <div className={mono ? "font-mono text-xs" : "font-medium"}>{value}</div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, tone }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; tone: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-3">
        <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-soft`}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-lg font-bold truncate">{value}</div>
          {sub && <div className="text-[11px] text-muted-foreground truncate">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
