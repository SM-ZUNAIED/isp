import { createFileRoute } from "@tanstack/react-router";
import { CrudManager } from "@/components/crud-manager";

export const Route = createFileRoute("/_authenticated/admin/hr/salary-policies")({
  head: () => ({ meta: [{ title: "Salary Policies — HR" }] }),
  component: Page,
});

function Page() {
  return (
    <CrudManager
      table="salary_policies"
      title={{ bn: "বেতন নীতিমালা", en: "Salary Policies" }}
      subtitle={{ bn: "ভাতা ও কর্তনের নিয়ম", en: "Allowance and deduction rules" }}
      orderBy="created_at"
      ascending={false}
      searchFields={["name", "description"]}
      fields={[
        { key: "name", label: { bn: "নাম", en: "Name" }, type: "text", required: true },
        { key: "policy_type", label: { bn: "ধরন", en: "Type" }, type: "select", badge: true, defaultValue: "allowance",
          options: [
            { value: "allowance", label: { bn: "ভাতা", en: "Allowance" } },
            { value: "deduction", label: { bn: "কর্তন", en: "Deduction" } },
            { value: "bonus", label: { bn: "বোনাস", en: "Bonus" } },
          ] },
        { key: "amount", label: { bn: "পরিমাণ", en: "Amount" }, type: "number", required: true },
        { key: "is_percentage", label: { bn: "শতকরা (%)", en: "Percentage (%)" }, type: "switch", defaultValue: false },
        { key: "is_active", label: { bn: "সক্রিয়", en: "Active" }, type: "switch", defaultValue: true },
        { key: "description", label: { bn: "বর্ণনা", en: "Description" }, type: "textarea" },
      ]}
    />
  );
}
