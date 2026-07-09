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

export const Route = createFileRoute("/_authenticated/admin/payments")({
  head: () => ({ meta: [{ title: "পেমেন্ট লগ — Net Bill Pro" }] }),
  component: PaymentsPage,
});

const bn = new Intl.NumberFormat("bn-BD");
const METHOD_LABEL: Record<string, string> = {
  cash: "নগদ", bkash: "বিকাশ", nagad: "নগদ (Mobile)", rocket: "রকেট", bank: "ব্যাংক", other: "অন্যান্য",
};

function PaymentsPage() {
  const list = useServerFn(listPayments);
  const q = useQuery({ queryKey: ["payments"], queryFn: () => list() });

  const total = (q.data ?? []).reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">পেমেন্ট লগ</h1>
        <p className="text-muted-foreground">
          সর্বমোট {bn.format(q.data?.length ?? 0)}টি এন্ট্রি — সংগ্রহ ৳ {bn.format(total)}
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>রশিদ নং</TableHead>
                  <TableHead>কাস্টমার</TableHead>
                  <TableHead>মাধ্যম</TableHead>
                  <TableHead>TrxID</TableHead>
                  <TableHead className="text-right">পরিমাণ (৳)</TableHead>
                  <TableHead>সময়</TableHead>
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
                    কোনো পেমেন্ট নেই।
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
                    <TableCell className="text-right font-semibold">৳ {bn.format(Number(p.amount))}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(p.paid_at).toLocaleString("bn-BD", { dateStyle: "medium", timeStyle: "short" })}
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
