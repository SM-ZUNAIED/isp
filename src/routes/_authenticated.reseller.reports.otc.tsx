import { createFileRoute } from "@tanstack/react-router";
import { ResellerReportView } from "@/components/reseller-report-view";

export const Route = createFileRoute("/_authenticated/reseller/reports/otc")({
  component: () => (
    <ResellerReportView
      reportKey="otc"
      title={{"bn":"ওটিসি (এককালীন চার্জ)","en":"OTC (One Time Charge)"}}
      subtitle={{"bn":"বিল ছাড়া নেওয়া পেমেন্ট","en":"Payments not tied to a bill"}}
      columns={[{"key":"receipt_number","label":{"bn":"রশিদ নম্বর","en":"Receipt No"}},{"key":"customer_code","label":{"bn":"ইউজার আইডি","en":"User ID"}},{"key":"customer","label":{"bn":"কাস্টমার","en":"Customer"}},{"key":"amount","label":{"bn":"পরিমাণ","en":"Amount"},"kind":"money"},{"key":"method","label":{"bn":"মাধ্যম","en":"Method"},"kind":"badge"},{"key":"transaction_id","label":{"bn":"ট্রানজেকশন আইডি","en":"Transaction ID"}},{"key":"paid_at","label":{"bn":"তারিখ","en":"Date"}}]}
    />
  ),
});
