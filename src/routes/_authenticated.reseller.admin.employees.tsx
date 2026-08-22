import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ResellerDataTable, ResellerPageHeader } from "@/components/reseller-data-table";
import { resellerAdminData } from "@/lib/reseller-extra.functions";

export const Route = createFileRoute("/_authenticated/reseller/admin/employees")({
  component: EmployeesPage,
});

function EmployeesPage() {
  const fn = useServerFn(resellerAdminData);
  const q = useQuery({ queryKey: ["reseller-admin", "employees"], queryFn: () => fn({ data: { section: "employees" } }) });
  const rows = ((q.data as { rows?: Array<Record<string, unknown>> } | undefined)?.rows ?? []);

  return (
    <div className="space-y-6">
      <ResellerPageHeader
        title={{ bn: "কর্মচারী", en: "Employees" }}
        subtitle={{ bn: "আপনার সাথে যুক্ত কর্মীবৃন্দ", en: "Staff linked to your account" }}
      />
      <ResellerDataTable
        loading={q.isLoading}
        error={q.error}
        rows={rows}
        empty={{ bn: "কোনো কর্মী নির্ধারিত নেই", en: "No staff assigned" }}
        columns={[
          { key: "staff_code", label: { bn: "কোড", en: "Code" } },
          { key: "full_name", label: { bn: "নাম", en: "Name" } },
          { key: "designation", label: { bn: "পদবি", en: "Designation" } },
          { key: "department", label: { bn: "বিভাগ", en: "Department" } },
          { key: "mobile", label: { bn: "মোবাইল", en: "Mobile" } },
          { key: "email", label: { bn: "ইমেইল", en: "Email" } },
          { key: "status", label: { bn: "স্ট্যাটাস", en: "Status" }, kind: "badge" },
        ]}
      />
    </div>
  );
}
