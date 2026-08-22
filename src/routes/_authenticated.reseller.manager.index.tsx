import { createFileRoute } from "@tanstack/react-router";
import { ResellerNetworkTable } from "@/components/reseller-network-table";

export const Route = createFileRoute("/_authenticated/reseller/manager/")({
  component: () => (
    <ResellerNetworkTable
      module="manager"
      title={{ bn: "ম্যানেজার", en: "Manager" }}
      subtitle={{ bn: "আপনার জন্য নির্ধারিত ম্যানেজার", en: "Manager assigned to you" }}
      columns={[
        { key: "staff_code", label: { bn: "কোড", en: "Code" } },
        { key: "full_name", label: { bn: "নাম", en: "Name" } },
        { key: "designation", label: { bn: "পদবি", en: "Designation" } },
        { key: "mobile", label: { bn: "মোবাইল", en: "Mobile" } },
        { key: "email", label: { bn: "ইমেইল", en: "Email" } },
        { key: "status", label: { bn: "স্ট্যাটাস", en: "Status" } },
      ]}
    />
  ),
});
