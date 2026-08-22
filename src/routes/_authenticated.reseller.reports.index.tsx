import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/hooks/use-i18n";
import { resellerReports } from "@/lib/reseller.functions";

export const Route = createFileRoute("/_authenticated/reseller/reports/")({
  component: ResellerReportsPage,
});

function ResellerReportsPage() {
  const { lang } = useI18n();
  const L = (b: { bn: string; en: string }) => (lang === "en" ? b.en : b.bn);
  const fn = useServerFn(resellerReports);
  const q = useQuery({ queryKey: ["reseller-reports"], queryFn: () => fn() });

  if (q.isLoading) return <div className="grid place-items-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (q.error) return <p className="text-destructive">{(q.error as Error).message}</p>;
  const d = q.data!;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{L({ bn: "রিপোর্ট", en: "Reports" })}</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">{L({ bn: "মোট কাস্টমার", en: "Total Customers" })}</div>
          <div className="text-2xl font-bold">{d.totals.customers}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">{L({ bn: "মাসিক আয় (MRR)", en: "Monthly Recurring" })}</div>
          <div className="text-2xl font-bold">৳{Number(d.totals.mrr).toLocaleString()}</div>
        </CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">{L({ bn: "প্যাকেজ অনুযায়ী", en: "By Package" })}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>{L({ bn: "প্যাকেজ", en: "Package" })}</TableHead><TableHead className="text-right">{L({ bn: "সংখ্যা", en: "Count" })}</TableHead></TableRow></TableHeader>
              <TableBody>
                {d.byPackage.map((p) => (
                  <TableRow key={p.name}><TableCell>{p.name}</TableCell><TableCell className="text-right">{p.count}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{L({ bn: "মাস অনুযায়ী বিলিং", en: "Monthly Billing" })}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>{L({ bn: "মাস", en: "Month" })}</TableHead>
                <TableHead className="text-right">{L({ bn: "বিল", en: "Billed" })}</TableHead>
                <TableHead className="text-right">{L({ bn: "বকেয়া", en: "Due" })}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {d.byMonth.map((m) => (
                  <TableRow key={m.month}>
                    <TableCell>{m.month}</TableCell>
                    <TableCell className="text-right">৳{m.billed.toLocaleString()}</TableCell>
                    <TableCell className="text-right">৳{m.due.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{L({ bn: "পেমেন্ট মাধ্যম", en: "By Payment Method" })}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>{L({ bn: "মাধ্যম", en: "Method" })}</TableHead><TableHead className="text-right">{L({ bn: "মোট", en: "Total" })}</TableHead></TableRow></TableHeader>
              <TableBody>
                {d.byMethod.map((m) => (
                  <TableRow key={m.method}><TableCell>{m.method}</TableCell><TableCell className="text-right">৳{m.total.toLocaleString()}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
