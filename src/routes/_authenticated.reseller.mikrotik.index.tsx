import { createFileRoute } from "@tanstack/react-router";
import { ResellerNetworkTable } from "@/components/reseller-network-table";

export const Route = createFileRoute("/_authenticated/reseller/mikrotik/")({
  component: () => (
    <ResellerNetworkTable
      module="mikrotik"
      title={{ bn: "মাইক্রোটিক", en: "Mikrotik" }}
      subtitle={{ bn: "আপনার জন্য নির্ধারিত রাউটার (ক্রেডেনশিয়াল দেখানো হয় না)", en: "Routers assigned to you (credentials hidden)" }}
      columns={[
        { key: "name", label: { bn: "নাম", en: "Name" } },
        { key: "ip_address", label: { bn: "আইপি", en: "IP" } },
        { key: "is_online", label: { bn: "স্ট্যাটাস", en: "Status" }, kind: "bool" },
        { key: "cpu_load", label: { bn: "সিপিইউ", en: "CPU" } },
        { key: "ram_usage", label: { bn: "র‍্যাম", en: "RAM" } },
        { key: "last_checked_at", label: { bn: "সর্বশেষ চেক", en: "Last Checked" } },
      ]}
    />
  ),
});
