import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { listPayments } from "@/lib/billing.functions";
import { useTx, useFmt, useI18n } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  head: () => ({ meta: [{ title: "Payment Log — Net Bill Pro" }] }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const tx = useTx();
  const { lang } = useI18n();
  const { n, bdt } = useFmt();
  const METHOD_LABEL: Record<string, string> = {
    cash: tx("নগদ (Cash)", "Cash"),
    bkash: tx("বিকাশ", "bKash"),
    nagad: tx("নগদ (Mobile)", "Nagad"),
    rocket: tx("রকেট", "Rocket"),
    bank: tx("ব্যাংক", "Bank"),
    other: tx("অন্যান্য", "Other"),
  };

  const list = useServerFn(listPayments);
  const q = useQuery({ queryKey: ["payments"], queryFn: () => list() });

  const total = (q.data ?? []).reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{tx("পেমেন্ট লগ", "Payment Log")}</h1>
        <p className="text-muted-foreground">
          {tx(
            `সর্বমোট ${n(q.data?.length ?? 0)}টি এন্ট্রি — সংগ্রহ ${bdt(total)}`,
            `Total ${n(q.data?.length ?? 0)} entries — Collected ${bdt(total)}`,
          )}
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tx("রশিদ নং", "Receipt No.")}</TableHead>
                  <TableHead>{tx("কাস্টমার", "Customer")}</TableHead>
                  <TableHead>{tx("মাধ্যম", "Method")}</TableHead>
                  <TableHead>TrxID</TableHead>
                  <TableHead className="text-right">{tx("পরিমাণ (৳)", "Amount (BDT)")}</TableHead>
                  <TableHead>{tx("সময়", "Time")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.isLoading && (
                  <TableRow><TableCell colSpan={6} className="py-10 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
                  </TableCell></TableRow>
                )}
                {!q.isLoading && (q.data ?? []).length === 0 && (
                  <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    {tx("কোনো পেমেন্ট নেই।", "No payments yet.")}
                  </TableCell></TableRow>
                )}
                {(q.data ?? []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.receipt_number}</TableCell>
                    <TableCell>
                      <div className="font-medium">{p.customers?.full_name}</div>
                      <div className="text-xs text-muted-foreground">{p.customers?.customer_code}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{METHOD_LABEL[p.method] ?? p.method}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{p.transaction_id || "—"}</TableCell>
                    <TableCell className="text-right font-semibold">{bdt(Number(p.amount))}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(p.paid_at).toLocaleString(lang === "bn" ? "bn-BD" : "en-US", { dateStyle: "medium", timeStyle: "short" })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
