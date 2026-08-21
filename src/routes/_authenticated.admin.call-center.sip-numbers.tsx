import { createFileRoute } from "@tanstack/react-router";
import { CrudManager } from "@/components/crud-manager";

export const Route = createFileRoute("/_authenticated/admin/call-center/sip-numbers")({
  head: () => ({ meta: [{ title: "Direct SIP IP Numbers — Call Center" }] }),
  component: Page,
});

function Page() {
  return (
    <CrudManager
      table="sip_numbers"
      title={{ bn: "ডাইরেক্ট SIP আইপি নাম্বার", en: "Direct SIP IP Numbers" }}
      subtitle={{ bn: "সরাসরি কলের জন্য SIP নম্বর", en: "SIP numbers used for direct calling" }}
      searchFields={["number", "provider", "ip_address"]}
      fields={[
        { key: "number", label: { bn: "নাম্বার", en: "Number" }, type: "text", required: true },
        { key: "provider", label: { bn: "প্রোভাইডার", en: "Provider" }, type: "text" },
        { key: "ip_address", label: { bn: "আইপি ঠিকানা", en: "IP Address" }, type: "text" },
        { key: "assigned_staff_id", label: { bn: "বরাদ্দকৃত কর্মী", en: "Assigned Staff" }, type: "ref",
          ref: { table: "staff", labelField: "full_name" } },
        { key: "is_active", label: { bn: "সক্রিয়", en: "Active" }, type: "switch", defaultValue: true },
        { key: "notes", label: { bn: "নোট", en: "Notes" }, type: "textarea", hideInTable: true },
      ]}
    />
  );
}
