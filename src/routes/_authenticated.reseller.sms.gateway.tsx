import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ResellerPageHeader, useL } from "@/components/reseller-data-table";
import { resellerSmsSummary } from "@/lib/reseller-extra.functions";

export const Route = createFileRoute("/_authenticated/reseller/sms/gateway")({
  component: SmsGatewayPage,
});

function SmsGatewayPage() {
  const L = useL();
  const fn = useServerFn(resellerSmsSummary);
  const q = useQuery({ queryKey: ["reseller-sms-summary"], queryFn: () => fn() });

  return (
    <div className="space-y-6">
      <ResellerPageHeader
        title={{ bn: "এসএমএস গেটওয়ে", en: "SMS Gateway" }}
        subtitle={{ bn: "অ্যাডমিন-নিয়ন্ত্রিত গেটওয়ে তথ্য", en: "Gateway details managed by the admin" }}
      />
      <Card>
        <CardContent className="p-4">
          {q.isLoading ? (
            <div className="grid place-items-center p-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : q.error ? (
            <p className="text-destructive">{(q.error as Error).message}</p>
          ) : (
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">{L({ bn: "অবস্থা", en: "Status" })}</dt>
                <dd className="mt-1">
                  <Badge variant={q.data!.gateway.configured ? "default" : "secondary"}>
                    {q.data!.gateway.configured ? L({ bn: "সক্রিয়", en: "Active" }) : L({ bn: "নিষ্ক্রিয়", en: "Inactive" })}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{L({ bn: "প্রোভাইডার", en: "Provider" })}</dt>
                <dd className="mt-1 text-sm">{q.data!.gateway.provider ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{L({ bn: "হোস্ট", en: "Host" })}</dt>
                <dd className="mt-1 font-mono text-xs">{q.data!.gateway.host ?? "—"}</dd>
              </div>
            </dl>
          )}
          <p className="mt-4 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            {L({
              bn: "নিরাপত্তার কারণে গেটওয়ে এপিআই কী ও পাসওয়ার্ড রিসেলারকে দেখানো হয় না। পরিবর্তনের জন্য অ্যাডমিনের সাথে যোগাযোগ করুন।",
              en: "Gateway API keys and passwords are never shown to resellers. Contact the admin to change them.",
            })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
