import { createFileRoute } from "@tanstack/react-router";
import { CrudManager } from "@/components/crud-manager";

export const Route = createFileRoute("/_authenticated/admin/hr/attendance")({
  head: () => ({ meta: [{ title: "Attendance — HR" }] }),
  component: Page,
});

function Page() {
  return (
    <CrudManager
      table="attendance"
      title={{ bn: "উপস্থিতি", en: "Attendance" }}
      subtitle={{ bn: "দৈনিক উপস্থিতি রেকর্ড", en: "Daily attendance records" }}
      orderBy="work_date"
      ascending={false}
      searchFields={["notes"]}
      fields={[
        { key: "staff_id", label: { bn: "কর্মচারী", en: "Employee" }, type: "ref", required: true,
          ref: { table: "staff", labelField: "full_name" } },
        { key: "work_date", label: { bn: "তারিখ", en: "Date" }, type: "date", required: true },
        { key: "status", label: { bn: "অবস্থা", en: "Status" }, type: "select", badge: true, defaultValue: "present",
          options: [
            { value: "present", label: { bn: "উপস্থিত", en: "Present" } },
            { value: "absent", label: { bn: "অনুপস্থিত", en: "Absent" } },
            { value: "late", label: { bn: "দেরিতে", en: "Late" } },
            { value: "half_day", label: { bn: "অর্ধদিবস", en: "Half Day" } },
            { value: "leave", label: { bn: "ছুটি", en: "Leave" } },
          ] },
        { key: "check_in", label: { bn: "প্রবেশ", en: "Check In" }, type: "time" },
        { key: "check_out", label: { bn: "প্রস্থান", en: "Check Out" }, type: "time" },
        { key: "notes", label: { bn: "নোট", en: "Notes" }, type: "text" },
      ]}
    />
  );
}
