import { createFileRoute } from "@tanstack/react-router";
import { CrudManager } from "@/components/crud-manager";

export const Route = createFileRoute("/_authenticated/admin/call-center/auto-voice-sms")({
  head: () => ({ meta: [{ title: "Auto Voice SMS — Call Center" }] }),
  component: Page,
});

function Page() {
  return (
    <CrudManager
      table="auto_voice_sms"
      title={{ bn: "অটো ভয়েস এসএমএস", en: "Auto Voice SMS" }}
      subtitle={{ bn: "স্বয়ংক্রিয় ভয়েস ক্যাম্পেইন", en: "Automated voice campaigns" }}
      searchFields={["name", "notes"]}
      fields={[
        { key: "name", label: { bn: "ক্যাম্পেইনের নাম", en: "Campaign Name" }, type: "text", required: true },
        { key: "template_id", label: { bn: "টেমপ্লেট", en: "Template" }, type: "ref",
          ref: { table: "voice_templates", labelField: "name" } },
        { key: "target", label: { bn: "টার্গেট", en: "Target" }, type: "select", defaultValue: "all",
          options: [
            { value: "all", label: { bn: "সব কাস্টমার", en: "All Customers" } },
            { value: "due", label: { bn: "বকেয়া কাস্টমার", en: "Due Customers" } },
            { value: "expired", label: { bn: "মেয়াদোত্তীর্ণ", en: "Expired" } },
            { value: "custom", label: { bn: "কাস্টম", en: "Custom" } },
          ] },
        { key: "scheduled_at", label: { bn: "সময়", en: "Scheduled At" }, type: "datetime" },
        { key: "status", label: { bn: "অবস্থা", en: "Status" }, type: "select", badge: true, defaultValue: "draft",
          options: [
            { value: "draft", label: { bn: "খসড়া", en: "Draft" } },
            { value: "scheduled", label: { bn: "নির্ধারিত", en: "Scheduled" } },
            { value: "sent", label: { bn: "প্রেরিত", en: "Sent" } },
            { value: "cancelled", label: { bn: "বাতিল", en: "Cancelled" } },
          ] },
        { key: "sent_count", label: { bn: "প্রেরিত সংখ্যা", en: "Sent Count" }, type: "number", defaultValue: 0 },
        { key: "notes", label: { bn: "নোট", en: "Notes" }, type: "textarea", hideInTable: true },
      ]}
    />
  );
}
