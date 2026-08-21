import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Users2, UserCheck, CalendarCheck, CalendarX, Plane, HandCoins, Wallet, Loader2, ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatGrid } from "@/components/crud-manager";
import { hrStats } from "@/lib/ops.functions";
import { useI18n } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/hr/")({
  head: () => ({ meta: [{ title: "HR Dashboard — Net Bill Pro" }] }),
  component: Page,
});

const LINKS = [
  { to: "/admin/hr/employees", bn: "কর্মচারী", en: "Employees" },
  { to: "/admin/hr/attendance", bn: "উপস্থিতি", en: "Attendance" },
  { to: "/admin/hr/leave", bn: "ছুটি ব্যবস্থাপনা", en: "Leave Management" },
  { to: "/admin/hr/advance-salary", bn: "অগ্রিম বেতন", en: "Advance Salary" },
  { to: "/admin/hr/payroll", bn: "পে-রোল জেনারেশন", en: "Payroll Generation" },
  { to: "/admin/hr/salary-policies", bn: "বেতন নীতিমালা", en: "Salary Policies" },
  { to: "/admin/hr/reports", bn: "এইচআর রিপোর্ট", en: "HR Reports" },
] as const;

function Page() {
  const { lang } = useI18n();
  const fetchStats = useServerFn(hrStats);
  const q = useQuery({ queryKey: ["hr-stats"], queryFn: () => fetchStats() });
  const nf = new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-US");
  const money = (n: number) => `৳ ${nf.format(Math.round(n))}`;

  if (q.isLoading) {
    return <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (q.error) return <p className="text-sm text-destructive">{(q.error as Error).message}</p>;
  const s = q.data!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{lang === "en" ? "HR Dashboard" : "এইচআর ড্যাশবোর্ড"}</h1>
        <p className="text-muted-foreground">
          {lang === "en" ? "Human resource overview" : "মানবসম্পদ ব্যবস্থাপনার সারসংক্ষেপ"}
        </p>
      </div>

      <StatGrid items={[
        { label: { bn: "মোট কর্মচারী", en: "Total Employees" }, value: nf.format(s.totalStaff), icon: Users2 },
        { label: { bn: "সক্রিয় কর্মচারী", en: "Active Employees" }, value: nf.format(s.activeStaff), icon: UserCheck, tone: "from-emerald-500 to-emerald-600" },
        { label: { bn: "আজ উপস্থিত", en: "Present Today" }, value: nf.format(s.presentToday), icon: CalendarCheck, tone: "from-sky-500 to-sky-600" },
        { label: { bn: "আজ অনুপস্থিত", en: "Absent Today" }, value: nf.format(s.absentToday), icon: CalendarX, tone: "from-rose-500 to-rose-600" },
        { label: { bn: "অপেক্ষমাণ ছুটি", en: "Pending Leaves" }, value: nf.format(s.pendingLeaves), icon: Plane, tone: "from-amber-500 to-orange-500" },
        { label: { bn: "অপেক্ষমাণ অগ্রিম", en: "Pending Advance" }, value: nf.format(s.pendingAdvance), icon: HandCoins, tone: "from-amber-500 to-orange-500" },
        { label: { bn: "মাসিক বেতন বাজেট", en: "Salary Budget" }, value: money(s.salaryBudget), icon: Wallet, tone: "from-indigo-500 to-indigo-600" },
        { label: { bn: "অপরিশোধিত পে-রোল", en: "Unpaid Payroll" }, value: money(s.payrollUnpaid), icon: Wallet, tone: "from-rose-500 to-rose-600" },
      ]} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to}>
            <Card className="hover:shadow-md transition">
              <CardContent className="p-4 flex items-center justify-between">
                <span className="font-medium">{lang === "en" ? l.en : l.bn}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
