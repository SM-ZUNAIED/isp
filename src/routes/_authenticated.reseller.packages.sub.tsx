import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ResellerDataTable, ResellerPageHeader } from "@/components/reseller-data-table";
import { resellerPackages } from "@/lib/reseller.functions";

export const Route = createFileRoute("/_authenticated/reseller/packages/sub")({
  component: SubPackagesPage,
});

function SubPackagesPage() {
  const fn = useServerFn(resellerPackages);
  const q = useQuery({ queryKey: ["reseller-packages"], queryFn: () => fn() });
  const rows = ((q.data ?? []) as Array<Record<string, unknown>>).filter((p) => !p.is_popular);

  return (
    <div className="space-y-6">
      <ResellerPageHeader
        title={{ bn: "সাব প্যাকেজ", en: "Sub Packages" }}
        subtitle={{ bn: "মূল অফারের বাইরের প্যাকেজসমূহ", en: "Packages outside the featured offers" }}
      />
      <ResellerDataTable
        loading={q.isLoading}
        error={q.error}
        rows={rows}
        empty={{ bn: "কোনো সাব প্যাকেজ নেই", en: "No sub packages" }}
        columns={[
          { key: "name", label: { bn: "নাম", en: "Name" } },
          { key: "download_speed", label: { bn: "ডাউনলোড (Mbps)", en: "Download (Mbps)" } },
          { key: "upload_speed", label: { bn: "আপলোড (Mbps)", en: "Upload (Mbps)" } },
          { key: "monthly_price", label: { bn: "মাসিক মূল্য", en: "Monthly Price" }, kind: "money" },
          { key: "is_active", label: { bn: "সক্রিয়", en: "Active" }, kind: "bool" },
        ]}
      />
    </div>
  );
}
