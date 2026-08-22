import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResellerDataTable, ResellerPageHeader, useL } from "@/components/reseller-data-table";
import { resellerPackages } from "@/lib/reseller.functions";

export const Route = createFileRoute("/_authenticated/reseller/packages/sync-profiles")({
  component: SyncProfilesPage,
});

function SyncProfilesPage() {
  const L = useL();
  const fn = useServerFn(resellerPackages);
  const q = useQuery({ queryKey: ["reseller-packages"], queryFn: () => fn() });
  const rows = (q.data ?? []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-6">
      <ResellerPageHeader
        title={{ bn: "সিঙ্ক প্রোফাইল লিস্ট", en: "Sync Profile List" }}
        subtitle={{ bn: "মাইক্রোটিক প্রোফাইলের সাথে মিলে যাওয়া প্যাকেজ তালিকা", en: "Packages mapped to Mikrotik profiles" }}
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
        columns={[
          { key: "name", label: { bn: "প্রোফাইল / প্যাকেজ", en: "Profile / Package" } },
          { key: "download_speed", label: { bn: "ডাউনলোড (Mbps)", en: "Download (Mbps)" } },
          { key: "upload_speed", label: { bn: "আপলোড (Mbps)", en: "Upload (Mbps)" } },
          { key: "monthly_price", label: { bn: "মাসিক মূল্য", en: "Monthly Price" }, kind: "money" },
          { key: "is_active", label: { bn: "সক্রিয়", en: "Active" }, kind: "bool" },
        ]}
      />
    </div>
  );
}
