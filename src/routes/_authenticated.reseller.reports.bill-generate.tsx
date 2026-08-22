import { createFileRoute } from "@tanstack/react-router";
import { ResellerReportView } from "@/components/reseller-report-view";

export const Route = createFileRoute("/_authenticated/reseller/reports/bill-generate")({
  component: () => (
    <ResellerReportView
      reportKey="bill_generate"
      title={{"bn":"বিল জেনারেট","en":"Bill Generate"}}
      subtitle={{"bn":"বিল তৈরির জন্য কাস্টমার তালিকা","en":"Customers eligible for billing"}}
      columns={[{"key":"customer_code","label":{"bn":"ইউজার আইডি","en":"User ID"}},{"key":"full_name","label":{"bn":"নাম","en":"Name"}},{"key":"mobile","label":{"bn":"মোবাইল","en":"Mobile"}},{"key":"nid_number","label":{"bn":"এনআইডি","en":"NID"}},{"key":"address","label":{"bn":"ঠিকানা","en":"Address"}},{"key":"package","label":{"bn":"প্যাকেজ","en":"Package"}},{"key":"monthly_bill","label":{"bn":"মাসিক বিল","en":"Monthly Bill"},"kind":"money"},{"key":"status","label":{"bn":"স্ট্যাটাস","en":"Status"},"kind":"badge"}]}
    />
  ),
});
