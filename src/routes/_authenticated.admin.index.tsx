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
import { useI18n } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const fetchStats = useServerFn(getDashboardStats);
  const claim = useServerFn(claimOwnerRole);

  const nf = new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-US");
  const money = (n: number) => (lang === "bn" ? `৳ ${nf.format(Math.round(n))}` : `BDT ${nf.format(Math.round(n))}`);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => fetchStats(),
  });

  const claimMut = useMutation({
    mutationFn: () => claim(),
    onSuccess: (r) => {
      if (r.ok) {
        toast.success(t("admin.dash.claim.success"));
        router.invalidate();
      } else {
        toast.error(t("admin.dash.claim.exists"));
      }
    },
    onError: (e: Error) => toast.error(t("admin.dash.claim.failed"), { description: e.message }),
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (error) {
    return <div className="text-destructive">{t("admin.dash.loadError")}: {(error as Error).message}</div>;
  }

  const s = data!;
  const isPrivileged = s.role === "admin" || s.role === "manager" || s.role === "staff";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{t("admin.dash.title")}</h1>
        <p className="text-muted-foreground">{t("admin.dash.subtitle")}</p>
      </div>

      {!isPrivileged && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="flex flex-col md:flex-row md:items-center gap-3 p-4">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="flex-1">
              <div className="font-semibold">{t("admin.dash.noAdmin.title")}</div>
              <p className="text-sm text-muted-foreground">{t("admin.dash.noAdmin.desc")}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" asChild>
                <a href="/customer">{t("admin.dash.customerPortal")}</a>
              </Button>
              <Button onClick={() => claimMut.mutate()} disabled={claimMut.isPending}>
                {claimMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                {t("admin.dash.claim")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title={t("admin.dash.stat.totalCustomers")} value={nf.format(s.totalCustomers)} icon={Users} tone="indigo" />
        <StatCard title={t("admin.dash.stat.activeCustomers")} value={nf.format(s.activeCustomers)} icon={UserCheck} tone="emerald" />
        <StatCard title={t("admin.dash.stat.monthlyRevenue")} value={money(s.monthlyRevenue)} icon={Wallet} tone="amber" />
        <StatCard title={t("admin.dash.stat.pendingBills")} value={nf.format(s.pendingBills)} icon={Receipt} tone="rose" />
        <StatCard title={t("admin.dash.stat.openTickets")} value={nf.format(s.openTickets)} icon={Ticket} tone="indigo" />
        <StatCard title={t("admin.dash.stat.onlineDevices")} value={nf.format(s.onlineDevices)} icon={Wifi} tone="emerald" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.dash.quick.title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>{t("admin.dash.quick.1")}</p>
          <p>{t("admin.dash.quick.2")}</p>
          <p>{t("admin.dash.quick.3")}</p>
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
