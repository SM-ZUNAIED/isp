import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ResellerDataTable, ResellerPageHeader } from "@/components/reseller-data-table";
import { resellerTickets } from "@/lib/reseller.functions";

export const Route = createFileRoute("/_authenticated/reseller/support/token")({
  component: SupportTokenPage,
});

function SupportTokenPage() {
  const fn = useServerFn(resellerTickets);
  const q = useQuery({ queryKey: ["reseller-tickets"], queryFn: () => fn() });
  const rows = ((q.data ?? []) as unknown as Array<Record<string, unknown>>).map((t) => ({
    ...t,
    customer: (t.customers as { full_name?: string } | null)?.full_name ?? "—",
    created_at: String(t.created_at ?? "").slice(0, 10),
  }));

  return (
    <div className="space-y-6">
      <ResellerPageHeader
        title={{ bn: "টোকেন", en: "Token" }}
        subtitle={{ bn: "আপনার খোলা সাপোর্ট টোকেনসমূহ", en: "Support tokens raised by you" }}
      />
      <ResellerDataTable
        loading={q.isLoading}
        error={q.error}
        rows={rows}
        empty={{ bn: "কোনো টোকেন নেই", en: "No tokens" }}
        columns={[
          { key: "ticket_number", label: { bn: "টোকেন নম্বর", en: "Token No" } },
          { key: "customer", label: { bn: "কাস্টমার", en: "Customer" } },
          { key: "subject", label: { bn: "বিষয়", en: "Subject" } },
          { key: "category", label: { bn: "ক্যাটাগরি", en: "Category" }, kind: "badge" },
          { key: "status", label: { bn: "স্ট্যাটাস", en: "Status" }, kind: "badge" },
          { key: "created_at", label: { bn: "তারিখ", en: "Date" } },
        ]}
      />
    </div>
  );
}
