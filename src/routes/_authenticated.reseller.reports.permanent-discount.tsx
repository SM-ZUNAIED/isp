import { createFileRoute } from "@tanstack/react-router";
import { ResellerReportView } from "@/components/reseller-report-view";

export const Route = createFileRoute("/_authenticated/reseller/reports/permanent-discount")({
  component: () => (
    <ResellerReportView
      reportKey="permanent_discount"
      title={{"bn":"পার্মানেন্ট ডিসকাউন্ট লিস্ট","en":"Permanent Discount List"}}
      subtitle={{"bn":"ডিসকাউন্ট দেওয়া বিলসমূহ","en":"Bills carrying a discount"}}
      columns={[{"key":"bill_number","label":{"bn":"বিল নম্বর","en":"Bill No"}},{"key":"customer_code","label":{"bn":"ইউজার আইডি","en":"User ID"}},{"key":"customer","label":{"bn":"কাস্টমার","en":"Customer"}},{"key":"billing_month","label":{"bn":"মাস","en":"Month"}},{"key":"amount","label":{"bn":"পরিমাণ","en":"Amount"},"kind":"money"},{"key":"discount","label":{"bn":"ডিসকাউন্ট","en":"Discount"},"kind":"money"},{"key":"paid_amount","label":{"bn":"পরিশোধ","en":"Paid"},"kind":"money"},{"key":"due_amount","label":{"bn":"বকেয়া","en":"Due"},"kind":"money"},{"key":"status","label":{"bn":"স্ট্যাটাস","en":"Status"},"kind":"badge"}]}
    />
  ),
});
