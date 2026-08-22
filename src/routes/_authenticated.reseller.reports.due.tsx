import { createFileRoute } from "@tanstack/react-router";
import { ResellerReportView } from "@/components/reseller-report-view";

export const Route = createFileRoute("/_authenticated/reseller/reports/due")({
  component: () => (
    <ResellerReportView
      reportKey="due_customers"
      title={{"bn":"বকেয়া রিপোর্ট","en":"Due Report"}}
      subtitle={{"bn":"বকেয়া থাকা বিলসমূহ","en":"Bills with outstanding balance"}}
      columns={[{"key":"bill_number","label":{"bn":"বিল নম্বর","en":"Bill No"}},{"key":"customer_code","label":{"bn":"ইউজার আইডি","en":"User ID"}},{"key":"customer","label":{"bn":"কাস্টমার","en":"Customer"}},{"key":"billing_month","label":{"bn":"মাস","en":"Month"}},{"key":"amount","label":{"bn":"পরিমাণ","en":"Amount"},"kind":"money"},{"key":"discount","label":{"bn":"ডিসকাউন্ট","en":"Discount"},"kind":"money"},{"key":"paid_amount","label":{"bn":"পরিশোধ","en":"Paid"},"kind":"money"},{"key":"due_amount","label":{"bn":"বকেয়া","en":"Due"},"kind":"money"},{"key":"status","label":{"bn":"স্ট্যাটাস","en":"Status"},"kind":"badge"}]}
    />
  ),
});
