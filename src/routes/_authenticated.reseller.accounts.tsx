import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/hooks/use-i18n";
import { resellerAccounts } from "@/lib/reseller.functions";

export const Route = createFileRoute("/_authenticated/reseller/accounts")({
  component: ResellerAccountsPage,
});

function ResellerAccountsPage() {
  const { lang } = useI18n();
  const L = (b: { bn: string; en: string }) => (lang === "en" ? b.en : b.bn);
  const fn = useServerFn(resellerAccounts);
  const q = useQuery({ queryKey: ["reseller-accounts"], queryFn: () => fn() });

  if (q.isLoading) return <div className="grid place-items-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (q.error) return <p className="text-destructive">{(q.error as Error).message}</p>;

  const d = q.data!;
  const s = d.summary;
  const cards = [
    { label: { bn: "ওপেনিং ব্যালেন্স", en: "Opening Balance" }, v: s.opening_balance },
    { label: { bn: "বর্তমান ব্যালেন্স", en: "Current Amount" }, v: s.current_balance },
    { label: { bn: "ক্রেডিট লিমিট", en: "Credit Limit" }, v: s.credit_limit },
    { label: { bn: "মোট বিল", en: "Monthly Bill" }, v: s.billed },
    { label: { bn: "বিল কালেকশন", en: "Bill Collection" }, v: s.collected },
    { label: { bn: "বকেয়া", en: "Due" }, v: s.due },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{L({ bn: "অ্যাকাউন্টস", en: "Accounts" })}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label.en}><CardContent className="p-4">
            <div className="text-xs text-muted-foreground">{L(c.label)}</div>
            <div className="mt-1 text-xl font-bold">৳{Number(c.v).toLocaleString()}</div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{L({ bn: "বিল নং", en: "Bill No" })}</TableHead>
                <TableHead>{L({ bn: "মাস", en: "Month" })}</TableHead>
                <TableHead>{L({ bn: "পরিমাণ", en: "Amount" })}</TableHead>
                <TableHead>{L({ bn: "পরিশোধ", en: "Paid" })}</TableHead>
                <TableHead>{L({ bn: "বকেয়া", en: "Due" })}</TableHead>
                <TableHead>{L({ bn: "স্ট্যাটাস", en: "Status" })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(d.bills as Array<Record<string, unknown>>).length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">{L({ bn: "কোনো বিল নেই", en: "No bills" })}</TableCell></TableRow>
              )}
              {(d.bills as Array<Record<string, unknown>>).map((b) => (
                <TableRow key={String(b.id)}>
                  <TableCell className="font-mono text-xs">{String(b.bill_number ?? "")}</TableCell>
                  <TableCell>{String(b.billing_month ?? "").slice(0, 7)}</TableCell>
                  <TableCell>৳{Number(b.amount ?? 0).toLocaleString()}</TableCell>
                  <TableCell>৳{Number(b.paid_amount ?? 0).toLocaleString()}</TableCell>
                  <TableCell>৳{Number(b.due_amount ?? 0).toLocaleString()}</TableCell>
                  <TableCell>{String(b.status ?? "")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
