import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Plus, Trash2, Shield, KeyRound, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  listUsers, createUser, assignRole, removeRole, resetPassword, deleteUser,
  type UserRow,
} from "@/lib/users.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "ইউজার ও রোল — Net Bill Pro" }] }),
  component: UsersPage,
});

type Role = "admin" | "staff" | "customer";
const ALL_ROLES: Role[] = ["admin", "staff", "customer"];
const ROLE_LABEL: Record<Role, string> = { admin: "Admin", staff: "Staff", customer: "Customer" };
const ROLE_COLOR: Record<Role, string> = {
  admin: "bg-red-500/10 text-red-600 border-red-500/20",
  staff: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  customer: "bg-green-500/10 text-green-600 border-green-500/20",
};

function UsersPage() {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const list = useServerFn(listUsers);
  const create = useServerFn(createUser);
  const assign = useServerFn(assignRole);
  const remove = useServerFn(removeRole);
  const reset = useServerFn(resetPassword);
  const del = useServerFn(deleteUser);

  const q = useQuery({ queryKey: ["admin-users"], queryFn: () => list() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-users"] });

  const createMut = useMutation({
    mutationFn: (d: { email: string; password: string; full_name: string; mobile: string; role: Role }) =>
      create({ data: d }),
    onSuccess: () => { toast.success("ইউজার তৈরি হয়েছে"); invalidate(); },
    onError: (e: Error) => toast.error("ব্যর্থ", { description: e.message }),
  });

  const assignMut = useMutation({
    mutationFn: (d: { user_id: string; role: Role }) => assign({ data: d }),
    onSuccess: () => { toast.success("Role যোগ হয়েছে"); invalidate(); },
    onError: (e: Error) => toast.error("ব্যর্থ", { description: e.message }),
  });

  const removeMut = useMutation({
    mutationFn: (d: { user_id: string; role: Role }) => remove({ data: d }),
    onSuccess: () => { toast.success("Role সরানো হয়েছে"); invalidate(); },
    onError: (e: Error) => toast.error("ব্যর্থ", { description: e.message }),
  });

  const resetMut = useMutation({
    mutationFn: (d: { user_id: string; password: string }) => reset({ data: d }),
    onSuccess: () => toast.success("পাসওয়ার্ড রিসেট হয়েছে"),
    onError: (e: Error) => toast.error("ব্যর্থ", { description: e.message }),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { user_id: id } }),
    onSuccess: () => { toast.success("ইউজার ডিলিট হয়েছে"); invalidate(); },
    onError: (e: Error) => toast.error("ব্যর্থ", { description: e.message }),
  });

  if (q.isLoading) return <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (q.error) return <div className="text-destructive">লোড ব্যর্থ: {(q.error as Error).message}</div>;

  const users = q.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><UserCog className="h-7 w-7" /> ইউজার ও রোল</h1>
          <p className="text-muted-foreground">সিস্টেমের ইউজার এবং তাদের অ্যাক্সেস রোল ব্যবস্থাপনা</p>
        </div>
        <CreateUserDialog onSubmit={(v) => createMut.mutate(v)} pending={createMut.isPending} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>নাম / ইমেইল</TableHead>
                  <TableHead>মোবাইল</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>শেষ লগইন</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">কোনো ইউজার নেই</TableCell></TableRow>
                )}
                {users.map((u) => (
                  <UserRowView
                    key={u.id}
                    u={u}
                    isMe={u.id === me?.id}
                    onAssign={(role) => assignMut.mutate({ user_id: u.id, role })}
                    onRemove={(role) => removeMut.mutate({ user_id: u.id, role })}
                    onReset={(password) => resetMut.mutate({ user_id: u.id, password })}
                    onDelete={() => delMut.mutate(u.id)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="p-4 text-sm text-muted-foreground flex gap-3">
          <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <strong className="text-foreground">রোল সিস্টেম:</strong> Admin — সম্পূর্ণ কন্ট্রোল; Staff — অপারেশনাল অ্যাক্সেস; Customer — নিজের বিল ও তথ্য। একজন ইউজারের একাধিক role থাকতে পারে। শেষ Admin এর role সরানো যাবে না।
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UserRowView({
  u, isMe, onAssign, onRemove, onReset, onDelete,
}: {
  u: UserRow; isMe: boolean;
  onAssign: (r: Role) => void; onRemove: (r: Role) => void;
  onReset: (pw: string) => void; onDelete: () => void;
}) {
  const available = ALL_ROLES.filter((r) => !u.roles.includes(r));
  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{u.full_name || "—"} {isMe && <span className="text-xs text-primary">(আপনি)</span>}</div>
        <div className="text-xs text-muted-foreground">{u.email}</div>
      </TableCell>
      <TableCell className="text-sm">{u.mobile || "—"}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {u.roles.length === 0 && <span className="text-xs text-muted-foreground">কোনো role নেই</span>}
          {u.roles.map((r) => (
            <Badge key={r} variant="outline" className={ROLE_COLOR[r]}>
              {ROLE_LABEL[r]}
              <button
                onClick={() => onRemove(r)}
                className="ml-1.5 hover:text-destructive"
                title="Role সরান"
              >×</button>
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString("bn-BD") : "কখনো না"}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          {available.length > 0 && (
            <Select onValueChange={(v) => onAssign(v as Role)}>
              <SelectTrigger className="h-8 w-[130px]"><SelectValue placeholder="+ Role" /></SelectTrigger>
              <SelectContent>
                {available.map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <ResetPasswordDialog onSubmit={onReset} />
          {!isMe && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>ইউজার ডিলিট করবেন?</AlertDialogTitle>
                  <AlertDialogDescription>
                    <strong>{u.email}</strong> — এই কাজটি ফেরানো যাবে না। ইউজারের সমস্ত ডেটা মুছে যাবে।
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>বাতিল</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">ডিলিট</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function CreateUserDialog({ onSubmit, pending }: { onSubmit: (v: { email: string; password: string; full_name: string; mobile: string; role: Role }) => void; pending: boolean }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ email: "", password: "", full_name: "", mobile: "", role: "staff" as Role });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary text-white"><Plus className="h-4 w-4 mr-1" /> নতুন ইউজার</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>নতুন ইউজার তৈরি</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); setOpen(false); setF({ email: "", password: "", full_name: "", mobile: "", role: "staff" }); }} className="space-y-3">
          <div className="grid gap-1.5"><Label>পূর্ণ নাম</Label><Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label>ইমেইল *</Label><Input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label>পাসওয়ার্ড * (min 6)</Label><Input type="text" required minLength={6} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label>মোবাইল</Label><Input value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value })} /></div>
          <div className="grid gap-1.5">
            <Label>Role *</Label>
            <Select value={f.role} onValueChange={(v) => setF({ ...f, role: v as Role })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>বাতিল</Button>
            <Button type="submit" disabled={pending} className="bg-gradient-primary text-white">
              {pending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} তৈরি করুন
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ onSubmit }: { onSubmit: (pw: string) => void }) {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8" title="পাসওয়ার্ড রিসেট"><KeyRound className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>পাসওয়ার্ড রিসেট</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(pw); setOpen(false); setPw(""); }} className="space-y-3">
          <div className="grid gap-1.5"><Label>নতুন পাসওয়ার্ড (min 6)</Label><Input type="text" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>বাতিল</Button>
            <Button type="submit" className="bg-gradient-primary text-white">রিসেট</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
