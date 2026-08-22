import { createFileRoute } from "@tanstack/react-router";
import { ResellerReportView } from "@/components/reseller-report-view";

export const Route = createFileRoute("/_authenticated/reseller/reports/manager-balance-log")({
  component: () => (
    <ResellerReportView
      reportKey="manager_balance_log"
      title={{"bn":"ম্যানেজার ব্যালেন্স লগ","en":"Manager Balance Log"}}
      subtitle={{"bn":"ব্যালেন্স পরিবর্তনের ইতিহাস","en":"History of balance changes"}}
      columns={[{"key":"created_at","label":{"bn":"সময়","en":"Time"}},{"key":"action","label":{"bn":"কাজ","en":"Action"},"kind":"badge"},{"key":"resource","label":{"bn":"রিসোর্স","en":"Resource"}},{"key":"actor","label":{"bn":"কে করেছে","en":"By"}},{"key":"details","label":{"bn":"বিবরণ","en":"Details"}}]}
    />
  ),
});
