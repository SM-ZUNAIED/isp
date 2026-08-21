import { createFileRoute } from "@tanstack/react-router";
import { CrudManager } from "@/components/crud-manager";

export const Route = createFileRoute("/_authenticated/admin/hr/leave")({
  head: () => ({ meta: [{ title: "Leave Management — HR" }] }),
  component: Page,
});

function Page() {
  return (
    <CrudManager
      table="leave_requests"
      title={{ bn: "ছুটি ব্যবস্থাপনা", en: "Leave Management" }}
      subtitle={{ bn: "ছুটির আবেদন ও অনুমোদন", en: "Leave applications and approvals" }}
      orderBy="start_date"
      ascending={false}
      searchFields={["reason"]}
      fields={[
        { key: "staff_id", label: { bn: "কর্মচারী", en: "Employee" }, type: "ref", required: true,
          ref: { table: "staff", labelField: "full_name" } },
        { key: "leave_type", label: { bn: "ছুটির ধরন", en: "Leave Type" }, type: "select", defaultValue: "casual",
          options: [
            { value: "casual", label: { bn: "নৈমিত্তিক", en: "Casual" } },
            { value: "sick", label: { bn: "অসুস্থতা", en: "Sick" } },
            { value: "annual", label: { bn: "বার্ষিক", en: "Annual" } },
            { value: "unpaid", label: { bn: "বিনা বেতনে", en: "Unpaid" } },
          ] },
        { key: "start_date", label: { bn: "শুরুর তারিখ", en: "Start Date" }, type: "date", required: true },
        { key: "end_date", label: { bn: "শেষ তারিখ", en: "End Date" }, type: "date", required: true },
        { key: "status", label: { bn: "অবস্থা", en: "Status" }, type: "select", badge: true, defaultValue: "pending",
          options: [
            { value: "pending", label: { bn: "অপেক্ষমাণ", en: "Pending" } },
            { value: "approved", label: { bn: "অনুমোদিত", en: "Approved" } },
            { value: "rejected", label: { bn: "প্রত্যাখ্যাত", en: "Rejected" } },
          ] },
        { key: "reason", label: { bn: "কারণ", en: "Reason" }, type: "textarea" },
      ]}
    />
  );
}
