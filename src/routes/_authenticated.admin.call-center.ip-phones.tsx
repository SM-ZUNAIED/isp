import { createFileRoute } from "@tanstack/react-router";
import { CrudManager } from "@/components/crud-manager";

export const Route = createFileRoute("/_authenticated/admin/call-center/ip-phones")({
  head: () => ({ meta: [{ title: "IP Phone Config — Call Center" }] }),
  component: Page,
});

function Page() {
  return (
    <CrudManager
      table="ip_phone_configs"
      title={{ bn: "আইপি ফোন কনফিগ", en: "IP Phone Config" }}
      subtitle={{ bn: "SIP এক্সটেনশন ও ডিভাইস কনফিগারেশন", en: "SIP extensions and device configuration" }}
      searchFields={["label", "extension", "sip_server", "username"]}
      fields={[
        { key: "label", label: { bn: "ফোনের নাম", en: "Phone Label" }, type: "text", required: true },
        { key: "extension", label: { bn: "এক্সটেনশন", en: "Extension" }, type: "text" },
        { key: "sip_server", label: { bn: "SIP সার্ভার", en: "SIP Server" }, type: "text" },
        { key: "sip_port", label: { bn: "পোর্ট", en: "Port" }, type: "number", defaultValue: 5060 },
        { key: "username", label: { bn: "ইউজারনেম", en: "Username" }, type: "text" },
        { key: "password", label: { bn: "পাসওয়ার্ড", en: "Password" }, type: "text", hideInTable: true },
        { key: "assigned_staff_id", label: { bn: "বরাদ্দকৃত কর্মী", en: "Assigned Staff" }, type: "ref",
          ref: { table: "staff", labelField: "full_name" } },
        { key: "is_active", label: { bn: "সক্রিয়", en: "Active" }, type: "switch", defaultValue: true },
        { key: "notes", label: { bn: "নোট", en: "Notes" }, type: "textarea", hideInTable: true },
      ]}
    />
  );
}
