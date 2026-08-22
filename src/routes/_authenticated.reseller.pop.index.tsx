import { createFileRoute } from "@tanstack/react-router";
import { ResellerNetworkTable } from "@/components/reseller-network-table";

export const Route = createFileRoute("/_authenticated/reseller/pop/")({
  component: () => (
    <ResellerNetworkTable
      module="pop"
      title={{ bn: "পপ (POP)", en: "POP" }}
      subtitle={{ bn: "আপনার জন্য নির্ধারিত Point of Presence", en: "Point of Presence assigned to you" }}
      columns={[
        { key: "name", label: { bn: "নাম", en: "Name" } },
        { key: "description", label: { bn: "বিবরণ", en: "Description" } },
      ]}
    />
  ),
});
