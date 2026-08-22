import { createFileRoute } from "@tanstack/react-router";
import { ResellerReportView } from "@/components/reseller-report-view";

export const Route = createFileRoute("/_authenticated/reseller/accounts/incomes")({
  component: () => (
    <ResellerReportView
      reportKey="payment_history"
      title={{ bn: "আয়", en: "Incomes" }}
      subtitle={{ bn: "কাস্টমার পেমেন্ট থেকে প্রাপ্ত আয়", en: "Income received from customer payments" }}
      columns={[
        { key: "paid_at", label: { bn: "তারিখ", en: "Date" } },
        { key: "receipt_number", label: { bn: "রশিদ নম্বর", en: "Receipt No" } },
        { key: "customer", label: { bn: "কাস্টমার", en: "Customer" } },
        { key: "method", label: { bn: "মাধ্যম", en: "Method" }, kind: "badge" },
        { key: "amount", label: { bn: "পরিমাণ", en: "Amount" }, kind: "money" },
      ]}
    />
  ),
});
