import { createFileRoute } from "@tanstack/react-router";
import { ResellerReportView } from "@/components/reseller-report-view";

export const Route = createFileRoute("/_authenticated/reseller/reports/btrc-export")({
  component: () => (
    <ResellerReportView
      reportKey="btrc_export"
      title={{"bn":"বিটিআরসি এক্সপোর্ট","en":"BTRC Export"}}
      subtitle={{"bn":"বিটিআরসি রিপোর্টের জন্য গ্রাহক তথ্য","en":"Subscriber data for BTRC reporting"}}
      columns={[{"key":"customer_code","label":{"bn":"ইউজার আইডি","en":"User ID"}},{"key":"full_name","label":{"bn":"নাম","en":"Name"}},{"key":"mobile","label":{"bn":"মোবাইল","en":"Mobile"}},{"key":"nid_number","label":{"bn":"এনআইডি","en":"NID"}},{"key":"address","label":{"bn":"ঠিকানা","en":"Address"}},{"key":"package","label":{"bn":"প্যাকেজ","en":"Package"}},{"key":"monthly_bill","label":{"bn":"মাসিক বিল","en":"Monthly Bill"},"kind":"money"},{"key":"status","label":{"bn":"স্ট্যাটাস","en":"Status"},"kind":"badge"}]}
    />
  ),
});
