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
import { useTx, useFmt } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/customers_/$id")({
  head: () => ({ meta: [{ title: "কাস্টমার বিস্তারিত — Net Bill Pro" }] }),
  component: CustomerDetailPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center space-y-3">
      <p className="text-destructive font-medium">{error.message}</p>
      <Button asChild variant="outline"><Link to="/admin/customers">Back</Link></Button>
    </div>
  ),
  notFoundComponent: () => <div className="p-8 text-center">Customer not found.</div>,
});

const STATUS: Record<string, { bn: string; en: string }> = {
  active: { bn: "সক্রিয়", en: "Active" },
  pending: { bn: "অপেক্ষমাণ", en: "Pending" },
  suspended: { bn: "স্থগিত", en: "Suspended" },
  expired: { bn: "মেয়াদ শেষ", en: "Expired" },
};
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
  const tx = useTx();
  const { lang, n: nfmt, bdt } = useFmt();
  const fmtDate = (s: string | null | undefined) =>
    s ? new Date(s).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
  const fetchDetail = useServerFn(getCustomerDetail);
  const q = useQuery({ queryKey: ["customer-detail", id], queryFn: () => fetchDetail({ data: { id } }) });

  if (q.isLoading) {
    return <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (q.error || !q.data) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-destructive">{(q.error as Error)?.message ?? tx("কাস্টমার লোড হয়নি", "Customer not loaded")}</p>
        <Button variant="outline" onClick={() => router.invalidate()}>{tx("রিট্রাই", "Retry")}</Button>
      </div>
    );
  }
  const { customer: c, address: a, bills, payments } = q.data;

  const totalBilled = bills.reduce((s, b) => s + Number(b.amount ?? 0), 0);
  const totalPaid = bills.reduce((s, b) => s + Number(b.paid_amount ?? 0), 0);
  const totalDue = bills.reduce((s, b) => s + Number(b.due_amount ?? 0), 0);

  const label = (o: { name?: string; bn_name?: string | null } | null | undefined) =>
    o ? ((lang === "bn" ? o.bn_name : o.name) || o.name || o.bn_name || "—") : "—";

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
                  <Phone className="h-3 w-3" />{tx("বিকল্প", "Alt")}: {c.alt_mobile}
                </span>
              )}
              <Badge variant="outline" className={STATUS_TONE[c.status]}>{STATUS[c.status] ? tx(STATUS[c.status].bn, STATUS[c.status].en) : c.status}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<PackageIcon className="h-5 w-5" />} tone="from-blue-500 to-indigo-600"
          label={tx("প্যাকেজ", "Package")} value={c.packages?.name ?? "—"} sub={c.packages?.monthly_price ? bdt(Number(c.packages.monthly_price)) + tx("/মাস", "/month") : undefined} />
        <StatCard icon={<Wallet className="h-5 w-5" />} tone="from-emerald-500 to-teal-600"
          label={tx("মাসিক বিল", "Monthly Bill")} value={bdt(Number(c.monthly_bill ?? 0))} sub={c.expiry_date ? `${tx("মেয়াদ", "Expiry")}: ${fmtDate(c.expiry_date)}` : undefined} />
        <StatCard icon={<Receipt className="h-5 w-5" />} tone="from-purple-500 to-fuchsia-600"
          label={tx("মোট বিলিং", "Total Billed")} value={bdt(totalBilled)} sub={`${nfmt(bills.length)} ${tx("টি বিল", "bills")}`} />
        <StatCard icon={<Wallet className="h-5 w-5" />} tone="from-rose-500 to-orange-500"
          label={tx("বকেয়া", "Due")} value={bdt(totalDue)} sub={`${bdt(totalPaid)} ${tx("পরিশোধিত", "paid")}`} />
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
                <div className="font-semibold">{tx("সম্পূর্ণ ঠিকানা", "Full Address")}</div>
                <div className="text-xs text-muted-foreground">{tx("ক্যাসকেডিং BD address breakdown", "Cascading BD address breakdown")}</div>
              </div>
            </div>

            {/* Composed address line */}
            {(c.address_line || c.address) && (
              <div className="rounded-lg bg-muted/40 p-3 text-sm">
                <span className="text-muted-foreground text-xs">{tx("সম্পূর্ণ", "Full")}:</span>{" "}
                <span className="font-medium">{c.address_line || c.address}</span>
              </div>
            )}

            {/* Address level grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <AddrItem icon={<Landmark className="h-4 w-4" />} label={tx("বিভাগ", "Division")} value={label(a.division)} />
              <AddrItem icon={<Landmark className="h-4 w-4" />} label={tx("জেলা", "District")} value={label(a.district)} />
              <AddrItem icon={<Milestone className="h-4 w-4" />} label={tx("উপজেলা", "Upazila")} value={label(a.upazila)} />
              <AddrItem icon={<Milestone className="h-4 w-4" />} label={tx("ইউনিয়ন", "Union")} value={label(a.union)} />
              <AddrItem icon={<Milestone className="h-4 w-4" />} label={tx("পোস্ট অফিস", "Post Office")}
                value={label(a.post_office)} extra={a.post_office?.code ? `${tx("কোড", "Code")} ${a.post_office.code}` : undefined} />
              <AddrItem icon={<Milestone className="h-4 w-4" />} label={tx("গ্রাম", "Village")} value={label(a.village)} />
              <AddrItem icon={<Milestone className="h-4 w-4" />} label={tx("মহল্লা / এরিয়া", "Mohalla / Area")} value={c.mohalla || "—"} />
              <AddrItem icon={<Milestone className="h-4 w-4" />} label={tx("রোড", "Road")} value={c.road_name || "—"} />
              <AddrItem icon={<Building2 className="h-4 w-4" />} label={tx("হোল্ডিং / বিল্ডিং", "Holding / Building")} value={c.holding_no || "—"} />
            </div>

            {a.building?.google_map_url && (
              <Button asChild variant="outline" size="sm">
                <a href={a.building.google_map_url} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1.5" /> {tx("Google Maps-এ দেখুন", "View on Google Maps")}
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
              <div className="font-semibold">{tx("সংযোগ ও যোগাযোগ", "Connection & Contact")}</div>
            </div>
            <InfoRow icon={<Phone className="h-4 w-4" />} label={tx("মোবাইল", "Mobile")} value={c.mobile} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label={tx("বিকল্প মোবাইল", "Alt Mobile")} value={c.alt_mobile || "—"} />
            <InfoRow icon={<MapPin className="h-4 w-4" />} label={tx("জোন", "Zone")} value={c.zones?.name ?? "—"} />
            <InfoRow icon={<Wifi className="h-4 w-4" />} label="PPPoE User" value={c.pppoe_username || "—"} mono />
            <InfoRow icon={<Wifi className="h-4 w-4" />} label="PPPoE Pass" value={c.pppoe_password || "—"} mono />
            <InfoRow icon={<Receipt className="h-4 w-4" />} label={tx("যোগদান", "Joined")} value={fmtDate(c.created_at)} />
          </CardContent>
        </Card>
      </div>

      {/* ============ Bills history ============ */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="font-semibold">{tx("সাম্প্রতিক বিল", "Recent Bills")}</div>
          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>{tx("বিল নং", "Bill No.")}</TableHead><TableHead>{tx("মাস", "Month")}</TableHead>
                <TableHead className="text-right">{tx("অ্যামাউন্ট", "Amount")}</TableHead>
                <TableHead className="text-right">{tx("পরিশোধিত", "Paid")}</TableHead>
                <TableHead className="text-right">{tx("বকেয়া", "Due")}</TableHead>
                <TableHead>{tx("ডিউ ডেট", "Due Date")}</TableHead><TableHead>{tx("স্ট্যাটাস", "Status")}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {bills.length === 0 && <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">{tx("কোনো বিল নেই।", "No bills.")}</TableCell></TableRow>}
                {bills.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">{b.bill_number}</TableCell>
                    <TableCell>{fmtDate(b.billing_month)}</TableCell>
                    <TableCell className="text-right">{bdt(Number(b.amount ?? 0))}</TableCell>
                    <TableCell className="text-right text-emerald-600">{bdt(Number(b.paid_amount ?? 0))}</TableCell>
                    <TableCell className="text-right text-rose-600">{bdt(Number(b.due_amount ?? 0))}</TableCell>
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
          <div className="font-semibold">{tx("সাম্প্রতিক পেমেন্ট", "Recent Payments")}</div>
          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>{tx("রিসিট", "Receipt")}</TableHead><TableHead>{tx("তারিখ", "Date")}</TableHead>
                <TableHead>{tx("মেথড", "Method")}</TableHead><TableHead>TrxID</TableHead>
                <TableHead className="text-right">{tx("অ্যামাউন্ট", "Amount")}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {payments.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">{tx("কোনো পেমেন্ট নেই।", "No payments.")}</TableCell></TableRow>}
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.receipt_number}</TableCell>
                    <TableCell>{fmtDate(p.paid_at)}</TableCell>
                    <TableCell><Badge variant="secondary">{p.method}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{p.transaction_id || "—"}</TableCell>
                    <TableCell className="text-right">{bdt(Number(p.amount ?? 0))}</TableCell>
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
