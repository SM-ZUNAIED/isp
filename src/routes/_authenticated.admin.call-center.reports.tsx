import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { opsList } from "@/lib/ops.functions";
import { useI18n } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/call-center/reports")({
  head: () => ({ meta: [{ title: "Call Center Reports — Net Bill Pro" }] }),
  component: Page,
});

type R = Record<string, unknown>;

function Page() {
  const { lang } = useI18n();
  const list = useServerFn(opsList);
  const q = useQuery({
    queryKey: ["call-reports"],
    queryFn: async () => {
      const [logs, staff, follow] = await Promise.all([
        list({ data: { table: "call_logs", orderBy: "called_at", ascending: false } }),
        list({ data: { table: "staff", orderBy: "full_name", ascending: true } }),
        list({ data: { table: "follow_ups", orderBy: "scheduled_at", ascending: false } }),
      ]);
      return { logs, staff, follow } as Record<string, R[]>;
    },
  });

  if (q.isLoading) {
    return <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (q.error) return <p className="text-sm text-destructive">{(q.error as Error).message}</p>;

  const { logs, staff, follow } = q.data!;
  const nf = new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-US");

  const agents = staff.map((s) => {
    const id = String(s.id);
    const own = logs.filter((l) => l.handled_by === id);
    return {
      name: String(s.full_name ?? ""),
      calls: own.length,
      answered: own.filter((l) => l.outcome === "answered").length,
      missed: own.filter((l) => l.outcome === "missed").length,
      minutes: Math.round(own.reduce((a, l) => a + Number(l.duration_sec ?? 0), 0) / 60),
      followUps: follow.filter((f) => f.status === "done").length,
    };
  });

  const byDay = new Map<string, number>();
  for (const l of logs) {
    const d = String(l.called_at ?? "").slice(0, 10);
    if (d) byDay.set(d, (byDay.get(d) ?? 0) + 1);
  }
  const days = [...byDay.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 14);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{lang === "en" ? "Call Center Reports" : "কল সেন্টার রিপোর্ট"}</h1>
        <p className="text-muted-foreground">
          {lang === "en" ? "Agent performance and daily call volume" : "এজেন্ট পারফরম্যান্স ও দৈনিক কলের পরিমাণ"}
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>{lang === "en" ? "Agent Performance" : "এজেন্ট পারফরম্যান্স"}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang === "en" ? "Agent" : "এজেন্ট"}</TableHead>
                <TableHead>{lang === "en" ? "Calls" : "কল"}</TableHead>
                <TableHead>{lang === "en" ? "Answered" : "উত্তর দেওয়া"}</TableHead>
                <TableHead>{lang === "en" ? "Missed" : "মিসড"}</TableHead>
                <TableHead>{lang === "en" ? "Minutes" : "মিনিট"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((a, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>{nf.format(a.calls)}</TableCell>
                  <TableCell>{nf.format(a.answered)}</TableCell>
                  <TableCell>{nf.format(a.missed)}</TableCell>
                  <TableCell>{nf.format(a.minutes)}</TableCell>
                </TableRow>
              ))}
              {agents.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {lang === "en" ? "No agents found." : "কোনো এজেন্ট নেই।"}
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{lang === "en" ? "Daily Call Volume (last 14 days)" : "দৈনিক কল (সর্বশেষ ১৪ দিন)"}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang === "en" ? "Date" : "তারিখ"}</TableHead>
                <TableHead>{lang === "en" ? "Calls" : "কল"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {days.map(([d, c]) => (
                <TableRow key={d}><TableCell>{d}</TableCell><TableCell>{nf.format(c)}</TableCell></TableRow>
              ))}
              {days.length === 0 && (
                <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                  {lang === "en" ? "No call data." : "কোনো কল ডেটা নেই।"}
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
