import { createFileRoute } from "@tanstack/react-router";
import { CrudManager } from "@/components/crud-manager";

export const Route = createFileRoute("/_authenticated/admin/call-center/voice-templates")({
  head: () => ({ meta: [{ title: "Voice Templates — Call Center" }] }),
  component: Page,
});

function Page() {
  return (
    <CrudManager
      table="voice_templates"
      title={{ bn: "ভয়েস টেমপ্লেট", en: "Voice Templates" }}
      subtitle={{ bn: "স্বয়ংক্রিয় কলের জন্য বার্তা টেমপ্লেট", en: "Message templates for automated calls" }}
      searchFields={["name", "body"]}
      fields={[
        { key: "name", label: { bn: "নাম", en: "Name" }, type: "text", required: true },
        { key: "language", label: { bn: "ভাষা", en: "Language" }, type: "select", defaultValue: "bn",
          options: [
            { value: "bn", label: { bn: "বাংলা", en: "Bengali" } },
            { value: "en", label: { bn: "ইংরেজি", en: "English" } },
          ] },
        { key: "body", label: { bn: "বার্তা", en: "Message" }, type: "textarea", required: true },
        { key: "audio_url", label: { bn: "অডিও লিংক", en: "Audio URL" }, type: "text", hideInTable: true },
        { key: "is_active", label: { bn: "সক্রিয়", en: "Active" }, type: "switch", defaultValue: true },
      ]}
    />
  );
}
