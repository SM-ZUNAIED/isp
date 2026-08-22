import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ResellerDataTable, ResellerPageHeader } from "@/components/reseller-data-table";
import { resellerAdminData } from "@/lib/reseller-extra.functions";

export const Route = createFileRoute("/_authenticated/reseller/admin/location")({
  component: LocationPage,
});

function LocationPage() {
  const fn = useServerFn(resellerAdminData);
  const q = useQuery({ queryKey: ["reseller-admin", "location"], queryFn: () => fn({ data: { section: "location" } }) });
  const rows = ((q.data as { rows?: Array<Record<string, unknown>> } | undefined)?.rows ?? []);

  return (
    <div className="space-y-6">
      <ResellerPageHeader
        title={{ bn: "লোকেশন", en: "Location" }}
        subtitle={{ bn: "আপনার কভারেজ এলাকা ও জোন", en: "Your coverage zones" }}
      />
      <ResellerDataTable
        loading={q.isLoading}
        error={q.error}
        rows={rows}
        empty={{ bn: "কোনো লোকেশন নেই", en: "No locations" }}
        columns={[
          { key: "name", label: { bn: "জোন / পপ", en: "Zone / POP" } },
          { key: "description", label: { bn: "বিবরণ", en: "Description" } },
          { key: "customers", label: { bn: "কাস্টমার", en: "Customers" } },
        ]}
      />
    </div>
  );
}
