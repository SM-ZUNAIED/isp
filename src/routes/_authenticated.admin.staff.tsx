import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, UserCheck, Users2, Search, Link2, Link2Off } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  listStaff, createStaff, updateStaff, deleteStaff, listAssignableUsers,
  type StaffRow,
} from "@/lib/staff.functions";
import { useTx } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/staff")({
  head: () => ({ meta: [{ title: "স্টাফ ম্যানেজমেন্ট — Net Bill Pro" }] }),
  component: StaffPage,
});

type FormState = {
  id?: string;
  staff_code: string;
  full_name: string;
  mobile: string;
  email: string;
  designation: string;
  department: string;
  joining_date: string;
  salary: string;
  status: "active" | "inactive";
  address: string;
  nid: string;
  notes: string;
  user_id: string | null;
};

const EMPTY_FORM: FormState = {
  staff_code: "",
  full_name: "",
  mobile: "",
  email: "",
  designation: "",
  department: "",
  joining_date: "",
  salary: "0",
  status: "active",
  address: "",
  nid: "",
  notes: "",
  user_id: null,
};

function genCode() {
  const d = new Date();
  const ym = `${d.getFullYear().toString().slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}`;
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `S${ym}${rnd}`;
}

function StaffPage() {
  const tx = useTx();
  const qc = useQueryClient();
  const list = useServerFn(listStaff);
  const create = useServerFn(createStaff);
  const update = useServerFn(updateStaff);
  const del = useServerFn(deleteStaff);
  const listUsers = useServerFn(listAssignableUsers);

  const q = useQuery({ queryKey: ["admin-staff"], queryFn: () => list() });
  const usersQ = useQuery({ queryKey: ["assignable-users"], queryFn: () => listUsers() });
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-staff"] });
    qc.invalidateQueries({ queryKey: ["assignable-users"] });
    qc.invalidateQueries({ queryKey: ["admin-users"] });
    qc.invalidateQueries({ queryKey: ["my-roles"] });
  };

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [delTarget, setDelTarget] = useState<StaffRow | null>(null);
  const [search, setSearch] = useState("");

  const createMut = useMutation({
    mutationFn: (d: Record<string, unknown>) => create({ data: d as never }),
    onSuccess: () => {
      toast.success(tx("স্টাফ যোগ হয়েছে", "Staff added"));
      setOpen(false); setForm(EMPTY_FORM); invalidate();
    },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });

  const updateMut = useMutation({
    mutationFn: (d: Record<string, unknown>) => update({ data: d as never }),
    onSuccess: () => {
      toast.success(tx("আপডেট হয়েছে", "Updated"));
      setOpen(false); setForm(EMPTY_FORM); invalidate();
    },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success(tx("ডিলিট হয়েছে", "Deleted"));
      setDelTarget(null); invalidate();
    },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, staff_code: genCode() });
    setOpen(true);
  };
  const openEdit = (s: StaffRow) => {
    setForm({
      id: s.id,
      staff_code: s.staff_code,
      full_name: s.full_name,
      mobile: s.mobile ?? "",
      email: s.email ?? "",
      designation: s.designation ?? "",
      department: s.department ?? "",
      joining_date: s.joining_date ?? "",
      salary: String(s.salary ?? 0),
      status: s.status,
      address: s.address ?? "",
      nid: s.nid ?? "",
      notes: s.notes ?? "",
      user_id: s.user_id,
    });
    setOpen(true);
  };

  const submit = () => {
    if (!form.staff_code.trim() || !form.full_name.trim()) {
      toast.error(tx("স্টাফ কোড এবং নাম প্রয়োজন", "Staff code and name required"));
      return;
    }
    const payload = {
      staff_code: form.staff_code.trim(),
      full_name: form.full_name.trim(),
      mobile: form.mobile.trim() || null,
      email: form.email.trim() || null,
      designation: form.designation.trim() || null,
      department: form.department.trim() || null,
      joining_date: form.joining_date || null,
      salary: Number(form.salary) || 0,
      status: form.status,
      address: form.address.trim() || null,
      nid: form.nid.trim() || null,
      notes: form.notes.trim() || null,
      user_id: form.user_id || null,
    };
    if (form.id) {
      updateMut.mutate({ id: form.id, ...payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const rows = q.data ?? [];
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      [r.staff_code, r.full_name, r.mobile, r.email, r.designation, r.department]
        .some((v) => (v ?? "").toLowerCase().includes(s)),
    );
  }, [rows, search]);

  const assignableUsers = usersQ.data ?? [];
  // When editing an already-linked staff, include their current user in options.
  const userOptions = useMemo(() => {
    if (!form.user_id) return assignableUsers;
    if (assignableUsers.find((u) => u.id === form.user_id)) return assignableUsers;
    const current = rows.find((r) => r.user_id === form.user_id);
    return [
      { id: form.user_id, email: current?.linked_user_email ?? null, full_name: current?.full_name ?? null },
      ...assignableUsers,
    ];
  }, [assignableUsers, form.user_id, rows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Users2 className="h-7 w-7" /> {tx("স্টাফ ম্যানেজমেন্ট", "Staff Management")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {tx("স্টাফ যোগ, এডিট এবং লগইন অ্যাকাউন্টের সাথে লিংক করুন", "Add, edit staff and link them to login accounts")}
          </p>
        </div>
        <Button onClick={openCreate} className="bg-gradient-primary text-white">
          <Plus className="mr-2 h-4 w-4" /> {tx("নতুন স্টাফ", "New Staff")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tx("খুঁজুন...", "Search...")}
              className="pl-9"
            />
          </div>

          {q.isLoading ? (
            <div className="grid place-items-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : q.error ? (
            <div className="text-destructive text-sm">{(q.error as Error).message}</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">
              {tx("কোনো স্টাফ পাওয়া যায়নি", "No staff found")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tx("কোড", "Code")}</TableHead>
                    <TableHead>{tx("নাম", "Name")}</TableHead>
                    <TableHead>{tx("পদবি", "Designation")}</TableHead>
                    <TableHead>{tx("মোবাইল", "Mobile")}</TableHead>
                    <TableHead>{tx("ইমেইল", "Email")}</TableHead>
                    <TableHead>{tx("বেতন", "Salary")}</TableHead>
                    <TableHead>{tx("লগইন", "Login")}</TableHead>
                    <TableHead>{tx("স্ট্যাটাস", "Status")}</TableHead>
                    <TableHead className="text-right">{tx("অ্যাকশন", "Actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.staff_code}</TableCell>
                      <TableCell className="font-medium">{s.full_name}</TableCell>
                      <TableCell className="text-sm">{s.designation ?? "—"}</TableCell>
                      <TableCell className="text-sm">{s.mobile ?? "—"}</TableCell>
                      <TableCell className="text-sm">{s.email ?? "—"}</TableCell>
                      <TableCell className="text-sm">৳ {Number(s.salary).toFixed(0)}</TableCell>
                      <TableCell className="text-sm">
                        {s.user_id ? (
                          <Badge variant="outline" className="gap-1 border-green-500/30 text-green-600">
                            <Link2 className="h-3 w-3" />
                            {s.linked_user_email ?? tx("লিংকড", "Linked")}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-muted-foreground">
                            <Link2Off className="h-3 w-3" /> {tx("লিংক নেই", "Unlinked")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={s.status === "active"
                          ? "bg-green-500/10 text-green-600 border-green-500/20"
                          : "bg-muted text-muted-foreground"}
                          variant="outline">
                          {s.status === "active" ? tx("সক্রিয়", "Active") : tx("নিষ্ক্রিয়", "Inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setDelTarget(s)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {form.id ? tx("স্টাফ এডিট", "Edit Staff") : tx("নতুন স্টাফ", "New Staff")}
            </DialogTitle>
            <DialogDescription>
              {tx("সব তথ্য পূরণ করুন এবং প্রয়োজনে লগইন ইউজার লিংক করুন", "Fill details and optionally link a login user")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{tx("স্টাফ কোড *", "Staff Code *")}</Label>
              <Input value={form.staff_code} onChange={(e) => setForm({ ...form, staff_code: e.target.value })} />
            </div>
            <div>
              <Label>{tx("পূর্ণ নাম *", "Full Name *")}</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div>
              <Label>{tx("মোবাইল", "Mobile")}</Label>
              <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            </div>
            <div>
              <Label>{tx("ইমেইল", "Email")}</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>{tx("পদবি", "Designation")}</Label>
              <Select
                value={form.designation || "__none"}
                onValueChange={(v) => setForm({ ...form, designation: v === "__none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tx("রোল নির্বাচন করুন", "Select role")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">{tx("নির্বাচন করা হয়নি", "Not selected")}</SelectItem>
                  {rolesQ.data?.filter((r) => r.is_active).map((r) => (
                    <SelectItem key={r.id} value={r.name}>
                      {tx(r.bn_name || r.name, r.name)}
                    </SelectItem>
                  ))}
                  {form.designation &&
                    !(rolesQ.data ?? []).some((r) => r.name === form.designation) && (
                      <SelectItem value={form.designation}>{form.designation}</SelectItem>
                    )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{tx("বিভাগ", "Department")}</Label>
              <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div>
              <Label>{tx("যোগদানের তারিখ", "Joining Date")}</Label>
              <Input type="date" value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} />
            </div>
            <div>
              <Label>{tx("বেতন", "Salary")}</Label>
              <Input type="number" min="0" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
            </div>
            <div>
              <Label>{tx("NID", "NID")}</Label>
              <Input value={form.nid} onChange={(e) => setForm({ ...form, nid: e.target.value })} />
            </div>
            <div>
              <Label>{tx("স্ট্যাটাস", "Status")}</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "active" | "inactive" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{tx("সক্রিয়", "Active")}</SelectItem>
                  <SelectItem value="inactive">{tx("নিষ্ক্রিয়", "Inactive")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" /> {tx("লগইন ইউজার (User ID)", "Login User (User ID)")}
              </Label>
              <Select
                value={form.user_id ?? "__none__"}
                onValueChange={(v) => setForm({ ...form, user_id: v === "__none__" ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tx("কোনো ইউজার লিংক করা হয়নি", "No user linked")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    <span className="text-muted-foreground">{tx("— কোনটি নয় —", "— None —")}</span>
                  </SelectItem>
                  {userOptions.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      <div className="flex flex-col">
                        <span className="text-sm">{u.email ?? u.id}</span>
                        {u.full_name && <span className="text-xs text-muted-foreground">{u.full_name}</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {tx(
                  "লিংক করলে ওই ইউজার স্বয়ংক্রিয়ভাবে 'staff' রোল পাবে। ইউজার তৈরি না থাকলে 'ইউজার ও রোল' পেজে গিয়ে আগে ইউজার বানান।",
                  "Linking auto-grants the 'staff' role. Create the user first from 'Users & Roles' if not available.",
                )}
              </p>
            </div>

            <div className="md:col-span-2">
              <Label>{tx("ঠিকানা", "Address")}</Label>
              <Textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>{tx("নোট", "Notes")}</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{tx("বাতিল", "Cancel")}</Button>
            <Button
              onClick={submit}
              disabled={createMut.isPending || updateMut.isPending}
              className="bg-gradient-primary text-white"
            >
              {(createMut.isPending || updateMut.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {form.id ? tx("আপডেট", "Update") : tx("যোগ করুন", "Add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!delTarget} onOpenChange={(o) => !o && setDelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tx("স্টাফ ডিলিট করবেন?", "Delete staff?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tx(
                `"${delTarget?.full_name}" ডিলিট করা হবে। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।`,
                `"${delTarget?.full_name}" will be permanently deleted.`,
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tx("বাতিল", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => delTarget && delMut.mutate(delTarget.id)}
              className="bg-destructive text-destructive-foreground"
            >
              {tx("ডিলিট", "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
