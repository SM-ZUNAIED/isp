import { createFileRoute } from "@tanstack/react-router";
import { CrudManager } from "@/components/crud-manager";

export const Route = createFileRoute("/_authenticated/admin/hr/advance-salary")({
  head: () => ({ meta: [{ title: "Advance Salary — HR" }] }),
  component: Page,
});

function Page() {
  return (
    <CrudManager
      table="advance_salary"
      title={{ bn: "অগ্রিম বেতন", en: "Advance Salary" }}
      subtitle={{ bn: "অগ্রিম বেতনের আবেদন ও অনুমোদন", en: "Advance salary requests and approvals" }}
      orderBy="request_date"
      ascending={false}
      searchFields={["reason"]}
      fields={[
        { key: "staff_id", label: { bn: "কর্মচারী", en: "Employee" }, type: "ref", required: true,
          ref: { table: "staff", labelField: "full_name" } },
        { key: "amount", label: { bn: "পরিমাণ", en: "Amount" }, type: "number", required: true, prefix: "৳ " },
        { key: "request_date", label: { bn: "তারিখ", en: "Date" }, type: "date", required: true },
        { key: "status", label: { bn: "অবস্থা", en: "Status" }, type: "select", badge: true, defaultValue: "pending",
          options: [
            { value: "pending", label: { bn: "অপেক্ষমাণ", en: "Pending" } },
            { value: "approved", label: { bn: "অনুমোদিত", en: "Approved" } },
            { value: "rejected", label: { bn: "প্রত্যাখ্যাত", en: "Rejected" } },
            { value: "adjusted", label: { bn: "সমন্বয় হয়েছে", en: "Adjusted" } },
          ] },
        { key: "reason", label: { bn: "কারণ", en: "Reason" }, type: "textarea" },
      ]}
    />
  );
}
