import { createFileRoute } from "@tanstack/react-router";
import { ResellerReportView } from "@/components/reseller-report-view";

export const Route = createFileRoute("/_authenticated/reseller/accounts/expenses")({
  component: () => (
    <ResellerReportView
      reportKey="manager_balance_log"
      title={{ bn: "ব্যয়", en: "Expenses" }}
      subtitle={{ bn: "ব্যালেন্স কর্তন ও সমন্বয়ের রেকর্ড", en: "Balance deductions and adjustments" }}
      columns={[
        { key: "created_at", label: { bn: "সময়", en: "Time" } },
        { key: "action", label: { bn: "কাজ", en: "Action" }, kind: "badge" },
        { key: "actor", label: { bn: "কে করেছে", en: "By" } },
        { key: "details", label: { bn: "বিবরণ", en: "Details" } },
      ]}
    />
  ),
});
