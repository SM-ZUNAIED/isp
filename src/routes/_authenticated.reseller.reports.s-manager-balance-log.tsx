import { createFileRoute } from "@tanstack/react-router";
import { ResellerReportView } from "@/components/reseller-report-view";

export const Route = createFileRoute("/_authenticated/reseller/reports/s-manager-balance-log")({
  component: () => (
    <ResellerReportView
      reportKey="s_manager_balance_log"
      title={{"bn":"এস-ম্যানেজার ব্যালেন্স লগ","en":"S-Manager Balance Log"}}
      subtitle={{"bn":"সাব-ম্যানেজার ব্যালেন্স ইতিহাস","en":"Sub-manager balance history"}}
      columns={[{"key":"created_at","label":{"bn":"সময়","en":"Time"}},{"key":"action","label":{"bn":"কাজ","en":"Action"},"kind":"badge"},{"key":"resource","label":{"bn":"রিসোর্স","en":"Resource"}},{"key":"actor","label":{"bn":"কে করেছে","en":"By"}},{"key":"details","label":{"bn":"বিবরণ","en":"Details"}}]}
    />
  ),
});
