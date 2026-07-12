import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Plus, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { listLeaves, createLeave, setLeaveStatus, deleteLeave } from "@/lib/hr.functions";
import { listStaff } from "@/lib/staff.functions";
import { useTx } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/hr/leaves")({
  head: () => ({ meta: [{ title: "Leaves — Net Bill Pro" }] }),
  component: LeavesPage,
});

type LeaveType = "casual" | "sick" | "annual" | "unpaid" | "other";
type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

const STATUS_TONE: Record<LeaveStatus, string> = {
  pending: "bg-amber-500",
  approved: "bg-emerald-500",
  rejected: "bg-rose-500",
  cancelled: "bg-muted text-foreground",
};

function LeavesPage() {
  const tx = useTx();
  const qc = useQueryClient();
  const list = useServerFn(listLeaves);
  const setStatus = useServerFn(setLeaveStatus);
  const del = useServerFn(deleteLeave);

  const q = useQuery({ queryKey: ["hr", "leaves"], queryFn: () => list() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["hr", "leaves"] });

  const statusMut = useMutation({
    mutationFn: (v: { id: string; status: LeaveStatus }) => setStatus({ data: v }),
    onSuccess: () => { toast.success(tx("আপডেট", "Updated")); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success(tx("মুছে ফেলা হয়েছে", "Deleted")); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{tx("ছুটি ব্যবস্থাপনা", "Leave Management")}</h1>
          <p className="text-muted-foreground">{tx(`মোট ${q.data?.length ?? 0}টি আবেদন`, `Total ${q.data?.length ?? 0} requests`)}</p>
        </div>
        <NewLeaveDialog onSaved={invalidate} />
      </div>

      <Card>
        <CardContent className="p-0">
          {q.isLoading ? (
            <div className="grid place-items-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tx("স্টাফ", "Staff")}</TableHead>
                    <TableHead>{tx("ধরন", "Type")}</TableHead>
                    <TableHead>{tx("থেকে", "From")}</TableHead>
                    <TableHead>{tx("পর্যন্ত", "To")}</TableHead>
                    <TableHead>{tx("কারণ", "Reason")}</TableHead>
                    <TableHead>{tx("স্ট্যাটাস", "Status")}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(q.data ?? []).map((l) => {
                    const s = l.status as LeaveStatus;
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">
                          {(l as unknown as { staff?: { full_name?: string } }).staff?.full_name ?? "—"}
                        </TableCell>
                        <TableCell className="capitalize">{l.leave_type}</TableCell>
                        <TableCell>{l.from_date}</TableCell>
                        <TableCell>{l.to_date}</TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground text-sm">{l.reason ?? "—"}</TableCell>
                        <TableCell><Badge className={`${STATUS_TONE[s]} text-white`}>{s}</Badge></TableCell>
                        <TableCell className="flex gap-1">
                          {s === "pending" && <>
                            <Button size="sm" variant="ghost" className="text-emerald-600" onClick={() => statusMut.mutate({ id: l.id, status: "approved" })}><Check className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => statusMut.mutate({ id: l.id, status: "rejected" })}><X className="h-4 w-4" /></Button>
                          </>}
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => delMut.mutate(l.id)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(q.data ?? []).length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">{tx("কোনো আবেদন নেই", "No leave requests")}</TableCell></TableRow>
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

function NewLeaveDialog({ onSaved }: { onSaved: () => void }) {
  const tx = useTx();
  const [open, setOpen] = useState(false);
  const listS = useServerFn(listStaff);
  const create = useServerFn(createLeave);
  const staffQ = useQuery({ queryKey: ["staff-brief"], queryFn: () => listS(), enabled: open });
  const [f, setF] = useState({
    staff_id: "", leave_type: "casual" as LeaveType,
    from_date: new Date().toISOString().slice(0, 10),
    to_date: new Date().toISOString().slice(0, 10),
    reason: "",
  });
  const mut = useMutation({
    mutationFn: () => create({ data: { ...f, reason: f.reason || null } }),
    onSuccess: () => { toast.success(tx("যোগ হয়েছে", "Added")); setOpen(false); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary text-white"><Plus className="mr-2 h-4 w-4" />{tx("নতুন আবেদন", "New Request")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{tx("ছুটির আবেদন", "Leave Request")}</DialogTitle></DialogHeader>
        <form className="grid grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
          <div className="col-span-2 space-y-1.5">
            <Label>{tx("স্টাফ *", "Staff *")}</Label>
            <Select value={f.staff_id} onValueChange={(v) => setF({ ...f, staff_id: v })}>
              <SelectTrigger><SelectValue placeholder={tx("বাছাই করুন", "Select")} /></SelectTrigger>
              <SelectContent>
                {(staffQ.data ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.staff_code ?? "—"})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{tx("ধরন", "Type")}</Label>
            <Select value={f.leave_type} onValueChange={(v) => setF({ ...f, leave_type: v as LeaveType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="sick">Sick</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>{tx("থেকে", "From")}</Label>
            <Input type="date" value={f.from_date} onChange={(e) => setF({ ...f, from_date: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>{tx("পর্যন্ত", "To")}</Label>
            <Input type="date" value={f.to_date} onChange={(e) => setF({ ...f, to_date: e.target.value })} /></div>
          <div className="col-span-2 space-y-1.5">
            <Label>{tx("কারণ", "Reason")}</Label>
            <Input value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />
          </div>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{tx("বাতিল", "Cancel")}</Button>
            <Button type="submit" className="bg-gradient-primary text-white" disabled={mut.isPending || !f.staff_id}>
              {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{tx("সংরক্ষণ", "Save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
