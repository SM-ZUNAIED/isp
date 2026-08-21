import { createFileRoute } from "@tanstack/react-router";
import { CrudManager } from "@/components/crud-manager";

export const Route = createFileRoute("/_authenticated/admin/call-center/call-logs")({
  head: () => ({ meta: [{ title: "Call Logs — Call Center" }] }),
  component: Page,
});

function Page() {
  return (
    <CrudManager
      table="call_logs"
      title={{ bn: "কল লগ", en: "Call Logs" }}
      subtitle={{ bn: "সকল ইনকামিং ও আউটগোয়িং কলের রেকর্ড", en: "Record of all incoming and outgoing calls" }}
      orderBy="called_at"
      ascending={false}
      searchFields={["phone", "notes"]}
      fields={[
        { key: "phone", label: { bn: "ফোন", en: "Phone" }, type: "text", required: true },
        { key: "customer_id", label: { bn: "কাস্টমার", en: "Customer" }, type: "ref", hideInTable: true,
          ref: { table: "customers", labelField: "full_name" } },
        { key: "direction", label: { bn: "ধরন", en: "Direction" }, type: "select", defaultValue: "outgoing",
          options: [
            { value: "incoming", label: { bn: "ইনকামিং", en: "Incoming" } },
            { value: "outgoing", label: { bn: "আউটগোয়িং", en: "Outgoing" } },
          ] },
        { key: "called_at", label: { bn: "সময়", en: "Called At" }, type: "datetime", required: true },
        { key: "duration_sec", label: { bn: "সময়কাল (সেকেন্ড)", en: "Duration (sec)" }, type: "number", defaultValue: 0 },
        { key: "outcome", label: { bn: "ফলাফল", en: "Outcome" }, type: "select", badge: true, defaultValue: "answered",
          options: [
            { value: "answered", label: { bn: "উত্তর দেওয়া", en: "Answered" } },
            { value: "missed", label: { bn: "মিসড", en: "Missed" } },
            { value: "busy", label: { bn: "ব্যস্ত", en: "Busy" } },
            { value: "failed", label: { bn: "ব্যর্থ", en: "Failed" } },
          ] },
        { key: "handled_by", label: { bn: "এজেন্ট", en: "Agent" }, type: "ref",
          ref: { table: "staff", labelField: "full_name" } },
        { key: "notes", label: { bn: "নোট", en: "Notes" }, type: "textarea", hideInTable: true },
      ]}
    />
  );
}
