import { createFileRoute } from "@tanstack/react-router";
import { CrudManager } from "@/components/crud-manager";

export const Route = createFileRoute("/_authenticated/admin/hr/employees")({
  head: () => ({ meta: [{ title: "Employees — HR" }] }),
  component: Page,
});

function Page() {
  return (
    <CrudManager
      table="staff"
      title={{ bn: "কর্মচারী", en: "Employees" }}
      subtitle={{ bn: "সকল কর্মচারীর তালিকা ও তথ্য", en: "All employees and their details" }}
      orderBy="created_at"
      ascending={false}
      searchFields={["full_name", "staff_code", "mobile", "designation"]}
      fields={[
        { key: "staff_code", label: { bn: "স্টাফ আইডি", en: "Staff ID" }, type: "text", required: true },
        { key: "full_name", label: { bn: "নাম", en: "Full Name" }, type: "text", required: true },
        { key: "mobile", label: { bn: "মোবাইল", en: "Mobile" }, type: "text" },
        { key: "email", label: { bn: "ইমেইল", en: "Email" }, type: "text" },
        { key: "designation", label: { bn: "পদবি", en: "Designation" }, type: "text" },
        { key: "department", label: { bn: "বিভাগ", en: "Department" }, type: "text" },
        { key: "joining_date", label: { bn: "যোগদানের তারিখ", en: "Joining Date" }, type: "date" },
        { key: "salary", label: { bn: "বেতন", en: "Salary" }, type: "number", prefix: "৳ " },
        { key: "status", label: { bn: "স্ট্যাটাস", en: "Status" }, type: "select", badge: true, defaultValue: "active",
          options: [
            { value: "active", label: { bn: "সক্রিয়", en: "Active" } },
            { value: "inactive", label: { bn: "নিষ্ক্রিয়", en: "Inactive" } },
          ] },
        { key: "address", label: { bn: "ঠিকানা", en: "Address" }, type: "textarea", hideInTable: true },
        { key: "notes", label: { bn: "নোট", en: "Notes" }, type: "textarea", hideInTable: true },
      ]}
    />
  );
}
