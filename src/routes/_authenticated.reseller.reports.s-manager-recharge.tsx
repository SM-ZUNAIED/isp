import { createFileRoute } from "@tanstack/react-router";
import { ResellerReportView } from "@/components/reseller-report-view";

export const Route = createFileRoute("/_authenticated/reseller/reports/s-manager-recharge")({
  component: () => (
    <ResellerReportView
      reportKey="s_manager_recharge"
      title={{"bn":"এস-ম্যানেজার রিচার্জ","en":"S-Manager Recharge"}}
      subtitle={{"bn":"সাব-ম্যানেজার রিচার্জ রেকর্ড","en":"Sub-manager recharge records"}}
      columns={[{"key":"created_at","label":{"bn":"সময়","en":"Time"}},{"key":"action","label":{"bn":"কাজ","en":"Action"},"kind":"badge"},{"key":"resource","label":{"bn":"রিসোর্স","en":"Resource"}},{"key":"actor","label":{"bn":"কে করেছে","en":"By"}},{"key":"details","label":{"bn":"বিবরণ","en":"Details"}}]}
    />
  ),
});
