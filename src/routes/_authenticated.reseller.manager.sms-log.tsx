import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ResellerDataTable, ResellerPageHeader } from "@/components/reseller-data-table";
import { resellerSmsLog } from "@/lib/reseller.functions";

export const Route = createFileRoute("/_authenticated/reseller/manager/sms-log")({
  component: ManagerSmsLogPage,
});

function ManagerSmsLogPage() {
  const fn = useServerFn(resellerSmsLog);
  const q = useQuery({ queryKey: ["reseller-sms-log"], queryFn: () => fn() });
  const rows = ((q.data ?? []) as Array<Record<string, unknown>>).map((r) => ({
    ...r,
    created_at: String(r.created_at ?? "").slice(0, 19).replace("T", " "),
  }));

  return (
    <div className="space-y-6">
      <ResellerPageHeader
        title={{ bn: "ম্যানেজার এসএমএস লগ", en: "Manager SMS Log" }}
        subtitle={{ bn: "আপনার নেটওয়ার্কে পাঠানো বার্তার রেকর্ড", en: "Messages sent across your network" }}
      />
      <ResellerDataTable
        loading={q.isLoading}
        error={q.error}
        rows={rows}
        columns={[
          { key: "created_at", label: { bn: "সময়", en: "Time" } },
          { key: "channel", label: { bn: "চ্যানেল", en: "Channel" }, kind: "badge" },
          { key: "recipient", label: { bn: "প্রাপক", en: "Recipient" } },
          { key: "message", label: { bn: "বার্তা", en: "Message" } },
          { key: "status", label: { bn: "স্ট্যাটাস", en: "Status" }, kind: "badge" },
        ]}
      />
    </div>
  );
}
