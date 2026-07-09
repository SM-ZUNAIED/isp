import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Users, UserCheck, Wallet, Receipt, Ticket, Wifi, ShieldAlert, ShieldCheck, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getDashboardStats, claimOwnerRole } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

const bn = new Intl.NumberFormat("bn-BD");
const bdt = (n: number) => `৳ ${bn.format(Math.round(n))}`;

function AdminDashboard() {
  const router = useRouter();
  const fetchStats = useServerFn(getDashboardStats);
  const claim = useServerFn(claimOwnerRole);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => fetchStats(),
  });

  const claimMut = useMutation({
    mutationFn: () => claim(),
    onSuccess: (r) => {
      if (r.ok) {
        toast.success("আপনি এখন Owner (Admin)");
        router.invalidate();
      } else {
        toast.error("ইতিমধ্যে একজন Admin আছেন");
      }
    },
    onError: (e: Error) => toast.error("ব্যর্থ", { description: e.message }),
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (error) {
    return <div className="text-destructive">লোড করতে সমস্যা হয়েছে: {(error as Error).message}</div>;
  }

  const s = data!;
  const isPrivileged = s.role === "admin" || s.role === "staff";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">ড্যাশবোর্ড</h1>
        <p className="text-muted-foreground">আপনার ISP ব্যবসার সারসংক্ষেপ</p>
      </div>

      {!isPrivileged && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="flex flex-col md:flex-row md:items-center gap-3 p-4">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="flex-1">
              <div className="font-semibold">আপনার এখনো Admin অনুমতি নেই</div>
              <p className="text-sm text-muted-foreground">
                আপনি যদি এই ISP এর মালিক হন এবং কোনো Admin এখনো সেট করা না থাকে, নিচের বাটনে ক্লিক করে
                নিজেকে Owner (Admin) হিসেবে দাবি করুন।
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" asChild>
                <a href="/customer">কাস্টমার পোর্টাল</a>
              </Button>
              <Button onClick={() => claimMut.mutate()} disabled={claimMut.isPending}>
                {claimMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Owner হিসেবে দাবি করুন
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="মোট কাস্টমার" value={bn.format(s.totalCustomers)} icon={Users} tone="indigo" />
        <StatCard title="সক্রিয় কাস্টমার" value={bn.format(s.activeCustomers)} icon={UserCheck} tone="emerald" />
        <StatCard title="এই মাসের কালেকশন" value={bdt(s.monthlyRevenue)} icon={Wallet} tone="amber" />
        <StatCard title="বকেয়া বিল" value={bn.format(s.pendingBills)} icon={Receipt} tone="rose" />
        <StatCard title="খোলা টিকেট" value={bn.format(s.openTickets)} icon={Ticket} tone="indigo" />
        <StatCard title="অনলাইন MikroTik" value={bn.format(s.onlineDevices)} icon={Wifi} tone="emerald" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>দ্রুত পরিচিতি</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• কাস্টমার, প্যাকেজ, বিল, MikroTik, OLT/ONU মডিউল পরবর্তী ফেজে যুক্ত হবে।</p>
          <p>• সব ডেটা আপনার নিজস্ব Supabase ডাটাবেসে সুরক্ষিত (RLS enabled)।</p>
          <p>• সাপোর্ট: TechnoNex — 01339562416</p>
        </CardContent>
      </Card>
    </div>
  );
}

const TONE: Record<string, string> = {
  indigo: "from-indigo-500 to-indigo-600",
  emerald: "from-emerald-500 to-emerald-600",
  amber: "from-amber-500 to-orange-500",
  rose: "from-rose-500 to-rose-600",
};

function StatCard({
  title, value, icon: Icon, tone,
}: {
  title: string; value: string; icon: React.ComponentType<{ className?: string }>; tone: keyof typeof TONE;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">{title}</div>
            <div className="mt-1 text-2xl font-bold">{value}</div>
          </div>
          <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white ${TONE[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
