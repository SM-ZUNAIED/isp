import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAttendance, upsertAttendance } from "@/lib/hr.functions";
import { useTx } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/hr/attendance")({
  head: () => ({ meta: [{ title: "Attendance — Net Bill Pro" }] }),
  component: AttendancePage,
});

type Status = "present" | "absent" | "leave" | "half_day" | "late";

function AttendancePage() {
  const tx = useTx();
  const qc = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const list = useServerFn(listAttendance);
  const save = useServerFn(upsertAttendance);
  const q = useQuery({ queryKey: ["hr", "attendance", date], queryFn: () => list({ data: { date } }) });

  const mut = useMutation({
    mutationFn: (v: { staff_id: string; status: Status; remarks?: string | null }) =>
      save({ data: { ...v, date } }),
    onSuccess: () => { toast.success(tx("সংরক্ষিত", "Saved")); qc.invalidateQueries({ queryKey: ["hr", "attendance", date] }); },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });

  const attMap = new Map((q.data?.attendance ?? []).map((a) => [a.staff_id, a]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{tx("স্টাফ অ্যাটেন্ডেন্স", "Staff Attendance")}</h1>
          <p className="text-muted-foreground">{tx("তারিখ অনুযায়ী উপস্থিতি রেকর্ড করুন", "Mark daily attendance")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>{tx("স্টাফ তালিকা", "Staff List")}</CardTitle></CardHeader>
        <CardContent>
          {q.isLoading ? (
            <div className="grid place-items-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tx("কোড", "Code")}</TableHead>
                    <TableHead>{tx("নাম", "Name")}</TableHead>
                    <TableHead>{tx("পদবী", "Designation")}</TableHead>
                    <TableHead className="w-40">{tx("স্ট্যাটাস", "Status")}</TableHead>
                    <TableHead className="w-60">{tx("মন্তব্য", "Remarks")}</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(q.data?.staff ?? []).map((s) => {
                    const cur = attMap.get(s.id);
                    return <AttRow key={s.id} staff={s} initial={cur} onSave={(status, remarks) => mut.mutate({ staff_id: s.id, status, remarks })} pending={mut.isPending} />;
                  })}
                  {(q.data?.staff ?? []).length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{tx("কোনো স্টাফ নেই", "No staff yet")}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AttRow({ staff, initial, onSave, pending }: {
  staff: { id: string; full_name: string; staff_code: string | null; designation: string | null };
  initial?: { status: Status; remarks: string | null } | undefined;
  onSave: (s: Status, remarks: string | null) => void;
  pending: boolean;
}) {
  const tx = useTx();
  const [status, setStatus] = useState<Status>((initial?.status as Status) ?? "present");
  const [remarks, setRemarks] = useState(initial?.remarks ?? "");
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{staff.staff_code ?? "—"}</TableCell>
      <TableCell className="font-medium">{staff.full_name}</TableCell>
      <TableCell className="text-muted-foreground text-sm">{staff.designation ?? "—"}</TableCell>
      <TableCell>
        <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="present">{tx("উপস্থিত", "Present")}</SelectItem>
            <SelectItem value="absent">{tx("অনুপস্থিত", "Absent")}</SelectItem>
            <SelectItem value="leave">{tx("ছুটি", "Leave")}</SelectItem>
            <SelectItem value="half_day">{tx("অর্ধদিন", "Half day")}</SelectItem>
            <SelectItem value="late">{tx("দেরিতে", "Late")}</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell><Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder={tx("মন্তব্য", "Remarks")} /></TableCell>
      <TableCell>
        <Button size="sm" onClick={() => onSave(status, remarks || null)} disabled={pending} className="bg-gradient-primary text-white">
          <Save className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
