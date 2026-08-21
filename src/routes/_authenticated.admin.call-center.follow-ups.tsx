import { createFileRoute } from "@tanstack/react-router";
import { CrudManager } from "@/components/crud-manager";

export const Route = createFileRoute("/_authenticated/admin/call-center/follow-ups")({
  head: () => ({ meta: [{ title: "Follow-ups — Call Center" }] }),
  component: Page,
});

function Page() {
  return (
    <CrudManager
      table="follow_ups"
      title={{ bn: "ফলো-আপ", en: "Follow-ups" }}
      subtitle={{ bn: "নির্ধারিত কলব্যাক ও ফলো-আপ", en: "Scheduled callbacks and follow-ups" }}
      orderBy="scheduled_at"
      ascending={true}
      searchFields={["contact_name", "phone", "subject"]}
      fields={[
        { key: "contact_name", label: { bn: "নাম", en: "Contact Name" }, type: "text" },
        { key: "phone", label: { bn: "ফোন", en: "Phone" }, type: "text", required: true },
        { key: "customer_id", label: { bn: "কাস্টমার", en: "Customer" }, type: "ref", hideInTable: true,
          ref: { table: "customers", labelField: "full_name" } },
        { key: "subject", label: { bn: "বিষয়", en: "Subject" }, type: "text" },
        { key: "scheduled_at", label: { bn: "সময়", en: "Scheduled At" }, type: "datetime", required: true },
        { key: "priority", label: { bn: "অগ্রাধিকার", en: "Priority" }, type: "select", defaultValue: "normal",
          options: [
            { value: "low", label: { bn: "কম", en: "Low" } },
            { value: "normal", label: { bn: "সাধারণ", en: "Normal" } },
            { value: "high", label: { bn: "উচ্চ", en: "High" } },
          ] },
        { key: "status", label: { bn: "অবস্থা", en: "Status" }, type: "select", badge: true, defaultValue: "pending",
          options: [
            { value: "pending", label: { bn: "অপেক্ষমাণ", en: "Pending" } },
            { value: "done", label: { bn: "সম্পন্ন", en: "Done" } },
            { value: "cancelled", label: { bn: "বাতিল", en: "Cancelled" } },
          ] },
        { key: "notes", label: { bn: "নোট", en: "Notes" }, type: "textarea", hideInTable: true },
      ]}
    />
  );
}
