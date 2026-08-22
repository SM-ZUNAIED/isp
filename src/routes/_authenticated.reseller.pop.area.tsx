import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ResellerDataTable, ResellerPageHeader } from "@/components/reseller-data-table";
import { resellerAreas } from "@/lib/reseller-extra.functions";

export const Route = createFileRoute("/_authenticated/reseller/pop/area")({
  component: AreaPage,
});

function AreaPage() {
  const fn = useServerFn(resellerAreas);
  const q = useQuery({ queryKey: ["reseller-areas"], queryFn: () => fn() });
  const rows = ((q.data as { rows?: Array<Record<string, unknown>> } | undefined)?.rows ?? []);

  return (
    <div className="space-y-6">
      <ResellerPageHeader
        title={{ bn: "এরিয়া", en: "Area" }}
        subtitle={{ bn: "আপনার কাস্টমারদের এলাকা অনুযায়ী তালিকা", en: "Your customers grouped by area" }}
      />
      <ResellerDataTable
        loading={q.isLoading}
        error={q.error}
        rows={rows}
        empty={{ bn: "কোনো এরিয়া পাওয়া যায়নি", en: "No areas found" }}
        columns={[
          { key: "zone", label: { bn: "পপ / জোন", en: "POP / Zone" } },
          { key: "area", label: { bn: "মহল্লা / এরিয়া", en: "Mohalla / Area" } },
          { key: "customers", label: { bn: "কাস্টমার", en: "Customers" } },
        ]}
      />
    </div>
  );
}
