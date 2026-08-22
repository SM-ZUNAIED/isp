import { createFileRoute } from "@tanstack/react-router";
import { ResellerReportView } from "@/components/reseller-report-view";

export const Route = createFileRoute("/_authenticated/reseller/reports/money-receipt")({
  component: () => (
    <ResellerReportView
      reportKey="money_receipt"
      title={{"bn":"মানি রিসিট সার্চ","en":"Search Money Receipt"}}
      subtitle={{"bn":"রশিদ নম্বর দিয়ে খুঁজুন","en":"Search by receipt number"}}
      columns={[{"key":"receipt_number","label":{"bn":"রশিদ নম্বর","en":"Receipt No"}},{"key":"customer_code","label":{"bn":"ইউজার আইডি","en":"User ID"}},{"key":"customer","label":{"bn":"কাস্টমার","en":"Customer"}},{"key":"amount","label":{"bn":"পরিমাণ","en":"Amount"},"kind":"money"},{"key":"method","label":{"bn":"মাধ্যম","en":"Method"},"kind":"badge"},{"key":"transaction_id","label":{"bn":"ট্রানজেকশন আইডি","en":"Transaction ID"}},{"key":"paid_at","label":{"bn":"তারিখ","en":"Date"}}]}
    />
  ),
});
