import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/hooks/use-i18n";
import { resellerSmsLog } from "@/lib/reseller.functions";

export const Route = createFileRoute("/_authenticated/reseller/sms")({
  component: ResellerSmsPage,
});

function ResellerSmsPage() {
  const { lang } = useI18n();
  const L = (b: { bn: string; en: string }) => (lang === "en" ? b.en : b.bn);
  const fn = useServerFn(resellerSmsLog);
  const q = useQuery({ queryKey: ["reseller-sms"], queryFn: () => fn() });
  const rows = (q.data ?? []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{L({ bn: "এসএমএস লগ", en: "SMS Log" })}</h1>
        <p className="text-sm text-muted-foreground">
          {L({ bn: "আপনার কাস্টমারদের পাঠানো বার্তা", en: "Messages sent to your customers" })}
        </p>
      </div>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          {q.isLoading ? (
            <div className="grid place-items-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : q.error ? (
            <p className="p-6 text-destructive">{(q.error as Error).message}</p>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>{L({ bn: "চ্যানেল", en: "Channel" })}</TableHead>
                <TableHead>{L({ bn: "প্রাপক", en: "Recipient" })}</TableHead>
                <TableHead>{L({ bn: "বার্তা", en: "Message" })}</TableHead>
                <TableHead>{L({ bn: "স্ট্যাটাস", en: "Status" })}</TableHead>
                <TableHead>{L({ bn: "তারিখ", en: "Date" })}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">{L({ bn: "কোনো লগ নেই", en: "No logs" })}</TableCell></TableRow>
                )}
                {rows.map((r) => (
                  <TableRow key={String(r.id)}>
                    <TableCell>{String(r.channel ?? "")}</TableCell>
                    <TableCell className="font-mono text-xs">{String(r.recipient ?? "")}</TableCell>
                    <TableCell className="max-w-96 truncate text-xs">{String(r.message ?? "")}</TableCell>
                    <TableCell><Badge variant="secondary">{String(r.status ?? "")}</Badge></TableCell>
                    <TableCell>{String(r.created_at ?? "").slice(0, 10)}</TableCell>
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
