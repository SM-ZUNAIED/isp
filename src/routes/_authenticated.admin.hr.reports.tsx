import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { opsList } from "@/lib/ops.functions";
import { useI18n } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/hr/reports")({
  head: () => ({ meta: [{ title: "HR Reports — Net Bill Pro" }] }),
  component: Page,
});

type R = Record<string, unknown>;

function Page() {
  const { lang } = useI18n();
  const list = useServerFn(opsList);
  const q = useQuery({
    queryKey: ["hr-reports"],
    queryFn: async () => {
      const [staff, attendance, leaves, advance, payroll] = await Promise.all([
        list({ data: { table: "staff", orderBy: "full_name", ascending: true } }),
        list({ data: { table: "attendance", orderBy: "work_date", ascending: false } }),
        list({ data: { table: "leave_requests", orderBy: "start_date", ascending: false } }),
        list({ data: { table: "advance_salary", orderBy: "request_date", ascending: false } }),
        list({ data: { table: "payroll", orderBy: "pay_month", ascending: false } }),
      ]);
      return { staff, attendance, leaves, advance, payroll } as Record<string, R[]>;
    },
  });

  if (q.isLoading) {
    return <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (q.error) return <p className="text-sm text-destructive">{(q.error as Error).message}</p>;

  const { staff, attendance, leaves, advance, payroll } = q.data!;
  const nf = new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-US");
  const money = (n: number) => `৳ ${nf.format(Math.round(n))}`;

  const rows = staff.map((s) => {
    const id = String(s.id);
    const att = attendance.filter((a) => a.staff_id === id);
    return {
      name: String(s.full_name ?? ""),
      designation: String(s.designation ?? "—"),
      present: att.filter((a) => a.status === "present").length,
      absent: att.filter((a) => a.status === "absent").length,
      leaveDays: leaves.filter((l) => l.staff_id === id && l.status === "approved").length,
      advance: advance
        .filter((a) => a.staff_id === id && a.status === "approved")
        .reduce((x, a) => x + Number(a.amount ?? 0), 0),
      paid: payroll
        .filter((p) => p.staff_id === id && p.status === "paid")
        .reduce((x, p) => x + Number(p.net_salary ?? 0), 0),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{lang === "en" ? "HR Reports" : "এইচআর রিপোর্ট"}</h1>
        <p className="text-muted-foreground">
          {lang === "en" ? "Attendance, leave, advance and payroll summary per employee" : "কর্মচারীভিত্তিক উপস্থিতি, ছুটি, অগ্রিম ও পে-রোল সারসংক্ষেপ"}
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>{lang === "en" ? "Employee Summary" : "কর্মচারী সারসংক্ষেপ"}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{lang === "en" ? "Employee" : "কর্মচারী"}</TableHead>
                <TableHead>{lang === "en" ? "Designation" : "পদবি"}</TableHead>
                <TableHead>{lang === "en" ? "Present" : "উপস্থিত"}</TableHead>
                <TableHead>{lang === "en" ? "Absent" : "অনুপস্থিত"}</TableHead>
                <TableHead>{lang === "en" ? "Approved Leaves" : "অনুমোদিত ছুটি"}</TableHead>
                <TableHead>{lang === "en" ? "Advance" : "অগ্রিম"}</TableHead>
                <TableHead>{lang === "en" ? "Salary Paid" : "পরিশোধিত বেতন"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.designation}</TableCell>
                  <TableCell>{nf.format(r.present)}</TableCell>
                  <TableCell>{nf.format(r.absent)}</TableCell>
                  <TableCell>{nf.format(r.leaveDays)}</TableCell>
                  <TableCell>{money(r.advance)}</TableCell>
                  <TableCell>{money(r.paid)}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {lang === "en" ? "No employees found." : "কোনো কর্মচারী নেই।"}
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
