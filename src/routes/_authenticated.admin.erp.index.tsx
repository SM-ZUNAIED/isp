import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Users, CalendarCheck, CalendarX, PalmtreeIcon, Package as PackageIcon, AlertTriangle,
  ArrowLeftRight, Truck, ShoppingCart, TrendingUp, TrendingDown, DollarSign, Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getErpOverview } from "@/lib/erp.functions";
import { useTx, useFmt } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/erp/")({
  head: () => ({ meta: [{ title: "ERP — Net Bill Pro" }] }),
  component: ErpOverview,
});

function ErpOverview() {
  const tx = useTx();
  const { n, bdt } = useFmt();
  const fetch = useServerFn(getErpOverview);
  const q = useQuery({ queryKey: ["erp", "overview"], queryFn: () => fetch() });

  if (q.isLoading) {
    return <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (q.error) return <div className="text-destructive">{(q.error as Error).message}</div>;
  const d = q.data!;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{tx("ERP ওভারভিউ", "ERP Overview")}</h1>
        <p className="text-muted-foreground">{tx("HR, ইনভেন্টরি, পারচেজ ও অ্যাকাউন্টিং একনজরে", "HR, Inventory, Purchase & Accounting at a glance")}</p>
      </div>

      <Section title={tx("HR ও পেরোল", "HR & Payroll")} tone="indigo" href="/admin/hr/attendance" ctaLabel={tx("অ্যাটেন্ডেন্স", "Attendance")}>
        <Stat icon={Users} tone="indigo" label={tx("মোট স্টাফ", "Total Staff")} value={n(d.staff.total)} />
        <Stat icon={CalendarCheck} tone="emerald" label={tx("আজ উপস্থিত", "Present Today")} value={n(d.staff.presentToday)} />
        <Stat icon={CalendarX} tone="rose" label={tx("আজ অনুপস্থিত", "Absent Today")} value={n(d.staff.absentToday)} />
        <Stat icon={PalmtreeIcon} tone="amber" label={tx("বাকি ছুটি অনুমোদন", "Pending Leaves")} value={n(d.staff.leavesPending)} />
      </Section>

      <Section title={tx("ইনভেন্টরি", "Inventory")} tone="emerald" href="/admin/inventory/items" ctaLabel={tx("আইটেম", "Items")}>
        <Stat icon={PackageIcon} tone="emerald" label={tx("মোট আইটেম", "Total Items")} value={n(d.inventory.items)} />
        <Stat icon={AlertTriangle} tone="rose" label={tx("কম স্টক", "Low Stock")} value={n(d.inventory.lowStock)} />
        <Stat icon={ArrowLeftRight} tone="indigo" label={tx("আজকের মুভমেন্ট", "Today Moves")} value={n(d.inventory.movesToday)} />
      </Section>

      <Section title={tx("পারচেজ ও ভেন্ডর", "Purchase & Vendors")} tone="amber" href="/admin/purchase/orders" ctaLabel={tx("অর্ডার", "Orders")}>
        <Stat icon={Truck} tone="amber" label={tx("মোট ভেন্ডর", "Total Vendors")} value={n(d.purchase.vendors)} />
        <Stat icon={ShoppingCart} tone="indigo" label={tx("পেন্ডিং PO", "Pending POs")} value={n(d.purchase.pendingPO)} />
      </Section>

      <Section title={tx("অ্যাকাউন্টিং", "Accounting")} tone="rose" href="/admin/accounting/reports" ctaLabel={tx("রিপোর্ট", "Reports")}>
        <Stat icon={TrendingUp} tone="emerald" label={tx("এই মাসের আয়", "Month Income")} value={bdt(d.accounting.monthIncome)} />
        <Stat icon={TrendingDown} tone="rose" label={tx("এই মাসের ব্যয়", "Month Expense")} value={bdt(d.accounting.monthExpense)} />
        <Stat icon={DollarSign} tone="amber" label={tx("এই মাসের লাভ", "Month Profit")} value={bdt(d.accounting.monthProfit)} />
      </Section>
    </div>
  );
}

const TONES: Record<string, string> = {
  indigo: "from-indigo-500 to-indigo-600",
  emerald: "from-emerald-500 to-emerald-600",
  amber: "from-amber-500 to-orange-500",
  rose: "from-rose-500 to-rose-600",
};

function Section({ title, tone, href, ctaLabel, children }: { title: string; tone: keyof typeof TONES; href: string; ctaLabel: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Link to={href as "/admin"}><Button variant="outline" size="sm">{ctaLabel} →</Button></Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </div>
  );
}

function Stat({ icon: Icon, tone, label, value }: { icon: React.ComponentType<{ className?: string }>; tone: keyof typeof TONES; label: string; value: string }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-1 text-2xl font-bold">{value}</div>
          </div>
          <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white ${TONES[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
