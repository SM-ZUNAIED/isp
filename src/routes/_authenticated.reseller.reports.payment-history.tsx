import { createFileRoute } from "@tanstack/react-router";
import { ResellerReportView } from "@/components/reseller-report-view";

export const Route = createFileRoute("/_authenticated/reseller/reports/payment-history")({
  component: () => (
    <ResellerReportView
      reportKey="payment_history"
      title={{"bn":"পেমেন্ট হিস্ট্রি","en":"Payment History"}}
      subtitle={{"bn":"সব পেমেন্টের রেকর্ড","en":"All recorded payments"}}
      columns={[{"key":"receipt_number","label":{"bn":"রশিদ নম্বর","en":"Receipt No"}},{"key":"customer_code","label":{"bn":"ইউজার আইডি","en":"User ID"}},{"key":"customer","label":{"bn":"কাস্টমার","en":"Customer"}},{"key":"amount","label":{"bn":"পরিমাণ","en":"Amount"},"kind":"money"},{"key":"method","label":{"bn":"মাধ্যম","en":"Method"},"kind":"badge"},{"key":"transaction_id","label":{"bn":"ট্রানজেকশন আইডি","en":"Transaction ID"}},{"key":"paid_at","label":{"bn":"তারিখ","en":"Date"}}]}
    />
  ),
});
