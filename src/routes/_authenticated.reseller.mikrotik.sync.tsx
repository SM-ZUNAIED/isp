import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResellerDataTable, ResellerPageHeader, useL } from "@/components/reseller-data-table";
import { resellerNetwork } from "@/lib/reseller.functions";

export const Route = createFileRoute("/_authenticated/reseller/mikrotik/sync")({
  component: MikrotikSyncPage,
});

function MikrotikSyncPage() {
  const L = useL();
  const fn = useServerFn(resellerNetwork);
  const q = useQuery({ queryKey: ["reseller-network", "mikrotik"], queryFn: () => fn({ data: { module: "mikrotik" } }) });
  const rows = ((q.data as { rows?: Array<Record<string, unknown>> } | undefined)?.rows ?? []).map((r) => ({
    ...r,
    last_checked_at: String(r.last_checked_at ?? "").slice(0, 19).replace("T", " "),
  }));

  return (
    <div className="space-y-6">
      <ResellerPageHeader
        title={{ bn: "মাইক্রোটিক সিঙ্ক", en: "Mikrotik Sync" }}
        subtitle={{ bn: "রাউটারের সর্বশেষ অবস্থা নিন", en: "Refresh the latest router status" }}
        actions={
          <Button variant="outline" onClick={() => q.refetch()} disabled={q.isFetching}>
            <RefreshCw className={q.isFetching ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
            {L({ bn: "সিঙ্ক করুন", en: "Sync now" })}
          </Button>
        }
      />
      <ResellerDataTable
        loading={q.isLoading}
        error={q.error}
        rows={rows}
        empty={{ bn: "আপনার জন্য কোনো রাউটার নির্ধারিত নেই", en: "No router assigned to you" }}
        columns={[
          { key: "name", label: { bn: "নাম", en: "Name" } },
          { key: "ip_address", label: { bn: "আইপি", en: "IP" } },
          { key: "is_online", label: { bn: "অনলাইন", en: "Online" }, kind: "bool" },
          { key: "cpu_load", label: { bn: "সিপিইউ", en: "CPU" } },
          { key: "ram_usage", label: { bn: "র‍্যাম", en: "RAM" } },
          { key: "last_checked_at", label: { bn: "সর্বশেষ সিঙ্ক", en: "Last Sync" } },
        ]}
      />
    </div>
  );
}
