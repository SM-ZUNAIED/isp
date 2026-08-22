import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { Link2, Link2Off } from "lucide-react";
import { CrudManager } from "@/components/crud-manager";
import { Badge } from "@/components/ui/badge";
import { listStaff } from "@/lib/staff.functions";
import { useTx } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/hr/employees")({
  head: () => ({ meta: [{ title: "Employees — HR" }] }),
  component: Page,
});

function Page() {
  const tx = useTx();
  const list = useServerFn(listStaff);
  const staffQ = useQuery({ queryKey: ["admin-staff"], queryFn: () => list() });

  const loginMap = useMemo(() => {
    const m = new Map<string, string | null>();
    for (const s of staffQ.data ?? []) {
      if (s.user_id) m.set(s.id, s.linked_user_email ?? null);
    }
    return m;
  }, [staffQ.data]);

  return (
    <CrudManager
      table="staff"
      title={{ bn: "কর্মচারী", en: "Employees" }}
      subtitle={{ bn: "সকল কর্মচারীর তালিকা ও তথ্য", en: "All employees and their details" }}
      orderBy="created_at"
      ascending={false}
      searchFields={["full_name", "staff_code", "mobile", "designation"]}
      extraColumns={[
        {
          key: "login",
          label: { bn: "লগইন", en: "Login" },
          render: (row) => {
            const id = String(row.id);
            if (!loginMap.has(id)) {
              return (
                <Badge variant="outline" className="gap-1 text-muted-foreground">
                  <Link2Off className="h-3 w-3" /> {tx("লিংক নেই", "Unlinked")}
                </Badge>
              );
            }
            return (
              <Badge variant="outline" className="gap-1 border-green-500/30 text-green-600">
                <Link2 className="h-3 w-3" />
                {loginMap.get(id) ?? tx("লিংকড", "Linked")}
              </Badge>
            );
          },
        },
      ]}
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
