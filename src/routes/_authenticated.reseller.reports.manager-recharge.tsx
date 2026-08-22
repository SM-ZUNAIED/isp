import { createFileRoute } from "@tanstack/react-router";
import { ResellerReportView } from "@/components/reseller-report-view";

export const Route = createFileRoute("/_authenticated/reseller/reports/manager-recharge")({
  component: () => (
    <ResellerReportView
      reportKey="manager_recharge"
      title={{"bn":"ম্যানেজার রিচার্জ","en":"Manager Recharge"}}
      subtitle={{"bn":"রিচার্জ ও ব্যালেন্স যোগের রেকর্ড","en":"Recharge and balance top-up records"}}
      columns={[{"key":"created_at","label":{"bn":"সময়","en":"Time"}},{"key":"action","label":{"bn":"কাজ","en":"Action"},"kind":"badge"},{"key":"resource","label":{"bn":"রিসোর্স","en":"Resource"}},{"key":"actor","label":{"bn":"কে করেছে","en":"By"}},{"key":"details","label":{"bn":"বিবরণ","en":"Details"}}]}
    />
  ),
});
