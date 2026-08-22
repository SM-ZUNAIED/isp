import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResellerPageHeader, useL } from "@/components/reseller-data-table";
import { resellerSmsSummary } from "@/lib/reseller-extra.functions";

export const Route = createFileRoute("/_authenticated/reseller/sms/balance")({
  component: SmsBalancePage,
});

function SmsBalancePage() {
  const L = useL();
  const fn = useServerFn(resellerSmsSummary);
  const q = useQuery({ queryKey: ["reseller-sms-summary"], queryFn: () => fn() });

  if (q.isLoading) return <div className="grid place-items-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (q.error) return <p className="text-destructive">{(q.error as Error).message}</p>;
  const d = q.data!;

  const stats = [
    { label: { bn: "মোট প্রেরিত", en: "Total Sent" }, value: d.sent },
    { label: { bn: "ব্যর্থ", en: "Failed" }, value: d.failed },
    { label: { bn: "এই মাসে", en: "This Month" }, value: d.this_month },
    { label: { bn: "কাস্টমার", en: "Customers" }, value: d.customers },
  ];

  return (
    <div className="space-y-6">
      <ResellerPageHeader
        title={{ bn: "এসএমএস ব্যালেন্স", en: "SMS Balance" }}
        subtitle={{ bn: "আপনার এসএমএস ব্যবহারের হিসাব", en: "Your SMS usage summary" }}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label.en}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{L(s.label)}</div>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4 text-sm">
          <span className="text-muted-foreground">{L({ bn: "গেটওয়ে", en: "Gateway" })}:</span>
          <Badge variant={d.gateway.configured ? "default" : "secondary"}>
            {d.gateway.configured ? L({ bn: "সক্রিয়", en: "Configured" }) : L({ bn: "সেট করা নেই", en: "Not configured" })}
          </Badge>
          {d.gateway.host && <span className="font-mono text-xs">{d.gateway.host}</span>}
        </CardContent>
      </Card>
    </div>
  );
}
