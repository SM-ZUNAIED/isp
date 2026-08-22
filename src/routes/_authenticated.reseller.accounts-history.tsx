import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/hooks/use-i18n";
import { resellerAccountsHistory } from "@/lib/reseller.functions";

export const Route = createFileRoute("/_authenticated/reseller/accounts-history")({
  component: AccountsHistory,
});

function AccountsHistory() {
  const { lang } = useI18n();
  const L = (b: { bn: string; en: string }) => (lang === "en" ? b.en : b.bn);
  const fn = useServerFn(resellerAccountsHistory);
  const [f, setF] = useState({ from: "", to: "", q: "" });
  const q = useQuery({
    queryKey: ["reseller-accounts-history", f],
    queryFn: () => fn({ data: { from: f.from || undefined, to: f.to || undefined, q: f.q || undefined } }),
  });

  const rows = (q.data ?? []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{L({ bn: "অ্যাকাউন্টস হিস্ট্রি", en: "Accounts History" })}</h1>
      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-3">
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{L({ bn: "শুরু", en: "From" })}</Label>
            <Input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></div>
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{L({ bn: "শেষ", en: "To" })}</Label>
            <Input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></div>
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{L({ bn: "সার্চ", en: "Search" })}</Label>
            <Input value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} /></div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          {q.isLoading ? (
            <div className="grid place-items-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : q.error ? (
            <p className="p-6 text-destructive">{(q.error as Error).message}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{L({ bn: "রিসিট", en: "Receipt" })}</TableHead>
                  <TableHead>{L({ bn: "কাস্টমার", en: "Customer" })}</TableHead>
                  <TableHead>{L({ bn: "পরিমাণ", en: "Amount" })}</TableHead>
                  <TableHead>{L({ bn: "মাধ্যম", en: "Type" })}</TableHead>
                  <TableHead>{L({ bn: "তারিখ", en: "Date" })}</TableHead>
                  <TableHead>{L({ bn: "মন্তব্য", en: "Remarks" })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">{L({ bn: "কোনো লেনদেন নেই", en: "No transactions" })}</TableCell></TableRow>
                )}
                {rows.map((p) => (
                  <TableRow key={String(p.id)}>
                    <TableCell className="font-mono text-xs">{String(p.receipt_number ?? "—")}</TableCell>
                    <TableCell>{(p.customers as { full_name?: string } | null)?.full_name ?? "—"}</TableCell>
                    <TableCell>৳{Number(p.amount ?? 0).toLocaleString()}</TableCell>
                    <TableCell>{String(p.method ?? "")}</TableCell>
                    <TableCell>{String(p.paid_at ?? "").slice(0, 10)}</TableCell>
                    <TableCell className="max-w-64 truncate text-xs">{String(p.notes ?? "")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
