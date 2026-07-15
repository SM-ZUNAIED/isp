import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Shield, KeyRound, UserCog, Pencil, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  listUsers, createUser, assignRole, removeRole, resetPassword, deleteUser, updateUser,
  type UserRow,
} from "@/lib/users.functions";
import {
  getUserPermissions, setUserPermissions,
  PERMISSION_KEYS, PERMISSION_LABELS, type PermissionKey,
} from "@/lib/permissions.functions";
import { useAuth } from "@/hooks/use-auth";
import { useTx, useFmt } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "ইউজার ও রোল — Net Bill Pro" }] }),
  component: UsersPage,
});

type Role = "admin" | "manager" | "staff" | "customer";
const ALL_ROLES: Role[] = ["admin", "manager", "staff", "customer"];
const ROLE_LABEL: Record<Role, string> = { admin: "Admin", manager: "Manager", staff: "Staff", customer: "Customer" };
const ROLE_COLOR: Record<Role, string> = {
  admin: "bg-red-500/10 text-red-600 border-red-500/20",
  manager: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  staff: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  customer: "bg-green-500/10 text-green-600 border-green-500/20",
};

function UsersPage() {
  const { user: me } = useAuth();
  const tx = useTx();
  const qc = useQueryClient();
  const list = useServerFn(listUsers);
  const create = useServerFn(createUser);
  const assign = useServerFn(assignRole);
  const remove = useServerFn(removeRole);
  const reset = useServerFn(resetPassword);
  const del = useServerFn(deleteUser);
  const upd = useServerFn(updateUser);

  const q = useQuery({ queryKey: ["admin-users"], queryFn: () => list() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-users"] });

  const createMut = useMutation({
    mutationFn: (d: { email: string; password: string; full_name: string; mobile: string; role: Role }) =>
      create({ data: d }),
    onSuccess: () => { toast.success(tx("ইউজার তৈরি হয়েছে", "User created")); invalidate(); },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });

  const assignMut = useMutation({
    mutationFn: (d: { user_id: string; role: Role }) => assign({ data: d }),
    onSuccess: () => { toast.success(tx("Role যোগ হয়েছে", "Role added")); invalidate(); },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });

  const removeMut = useMutation({
    mutationFn: (d: { user_id: string; role: Role }) => remove({ data: d }),
    onSuccess: () => { toast.success(tx("Role সরানো হয়েছে", "Role removed")); invalidate(); },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });

  const resetMut = useMutation({
    mutationFn: (d: { user_id: string; password: string }) => reset({ data: d }),
    onSuccess: () => toast.success(tx("পাসওয়ার্ড রিসেট হয়েছে", "Password reset")),
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { user_id: id } }),
    onSuccess: () => { toast.success(tx("ইউজার ডিলিট হয়েছে", "User deleted")); invalidate(); },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });

  const updMut = useMutation({
    mutationFn: (d: { user_id: string; email?: string; full_name?: string; mobile?: string }) =>
      upd({ data: d }),
    onSuccess: () => { toast.success(tx("আপডেট হয়েছে", "Updated")); invalidate(); },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });

  if (q.isLoading) return <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (q.error) return <div className="text-destructive">{tx("লোড ব্যর্থ", "Load failed")}: {(q.error as Error).message}</div>;

  const users = q.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><UserCog className="h-7 w-7" /> {tx("ইউজার ও রোল", "Users & Roles")}</h1>
          <p className="text-muted-foreground">{tx("সিস্টেমের ইউজার এবং তাদের অ্যাক্সেস রোল ব্যবস্থাপনা", "Manage system users and their access roles")}</p>
        </div>
        <CreateUserDialog onSubmit={(v) => createMut.mutate(v)} pending={createMut.isPending} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tx("নাম / ইমেইল", "Name / Email")}</TableHead>
                  <TableHead>{tx("মোবাইল", "Mobile")}</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>{tx("শেষ লগইন", "Last Login")}</TableHead>
                  <TableHead className="text-right">{tx("অ্যাকশন", "Action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{tx("কোনো ইউজার নেই", "No users")}</TableCell></TableRow>
                )}
                {users.map((u) => (
                  <UserRowView
                    key={u.id}
                    u={u}
                    isMe={u.id === me?.id}
                    onAssign={(role) => assignMut.mutate({ user_id: u.id, role })}
                    onRemove={(role) => removeMut.mutate({ user_id: u.id, role })}
                    onReset={(password) => resetMut.mutate({ user_id: u.id, password })}
                    onUpdate={(patch) => updMut.mutate({ user_id: u.id, ...patch })}
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
            <strong className="text-foreground">{tx("রোল সিস্টেম:", "Role system:")}</strong> {tx("Admin — সম্পূর্ণ কন্ট্রোল; Staff — অপারেশনাল অ্যাক্সেস; Customer — নিজের বিল ও তথ্য। একজন ইউজারের একাধিক role থাকতে পারে। শেষ Admin এর role সরানো যাবে না।", "Admin — full control; Staff — operational access; Customer — own bills and info. A user can have multiple roles. The last Admin's role cannot be removed.")}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type UserPatch = { email?: string; full_name?: string; mobile?: string };

function UserRowView({
  u, isMe, onAssign, onRemove, onReset, onUpdate, onDelete,
}: {
  u: UserRow; isMe: boolean;
  onAssign: (r: Role) => void; onRemove: (r: Role) => void;
  onReset: (pw: string) => void; onUpdate: (patch: UserPatch) => void; onDelete: () => void;
}) {
  const tx = useTx();
  const { lang } = useFmt();
  const available = ALL_ROLES.filter((r) => !u.roles.includes(r));
  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{u.full_name || "—"} {isMe && <span className="text-xs text-primary">({tx("আপনি", "You")})</span>}</div>
        <div className="text-xs text-muted-foreground">{u.email}</div>
      </TableCell>
      <TableCell className="text-sm">{u.mobile || "—"}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {u.roles.length === 0 && <span className="text-xs text-muted-foreground">{tx("কোনো role নেই", "No role")}</span>}
          {u.roles.map((r) => (
            <Badge key={r} variant="outline" className={ROLE_COLOR[r]}>
              {ROLE_LABEL[r]}
              <button
                onClick={() => onRemove(r)}
                className="ml-1.5 hover:text-destructive"
                title={tx("Role সরান", "Remove role")}
              >×</button>
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString(lang === "bn" ? "bn-BD" : "en-US") : tx("কখনো না", "Never")}
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
          <EditUserDialog u={u} onSubmit={onUpdate} />
          <ResetPasswordDialog onSubmit={onReset} />
          {!isMe && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{tx("ইউজার ডিলিট করবেন?", "Delete user?")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    <strong>{u.email}</strong> — {tx("এই কাজটি ফেরানো যাবে না। ইউজারের সমস্ত ডেটা মুছে যাবে।", "This cannot be undone. All user data will be deleted.")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tx("বাতিল", "Cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">{tx("ডিলিট", "Delete")}</AlertDialogAction>
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
  const tx = useTx();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ email: "", password: "", full_name: "", mobile: "", role: "staff" as Role });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary text-white"><Plus className="h-4 w-4 mr-1" /> {tx("নতুন ইউজার", "New User")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{tx("নতুন ইউজার তৈরি", "Create New User")}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); setOpen(false); setF({ email: "", password: "", full_name: "", mobile: "", role: "staff" }); }} className="space-y-3">
          <div className="grid gap-1.5"><Label>{tx("পূর্ণ নাম", "Full Name")}</Label><Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label>{tx("ইমেইল", "Email")} *</Label><Input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label>{tx("পাসওয়ার্ড", "Password")} * (min 6)</Label><Input type="text" required minLength={6} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label>{tx("মোবাইল", "Mobile")}</Label><Input value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value })} /></div>
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{tx("বাতিল", "Cancel")}</Button>
            <Button type="submit" disabled={pending} className="bg-gradient-primary text-white">
              {pending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} {tx("তৈরি করুন", "Create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PermissionsDialog({ userId, userLabel }: { userId: string; userLabel: string }) {
  const tx = useTx();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<Record<PermissionKey, { can_view: boolean; can_edit: boolean }>>(
    () => Object.fromEntries(PERMISSION_KEYS.map((k) => [k, { can_view: false, can_edit: false }])) as never,
  );

  const getFn = useServerFn(getUserPermissions);
  const setFn = useServerFn(setUserPermissions);

  const q = useQuery({
    queryKey: ["user-permissions", userId],
    queryFn: () => getFn({ data: { user_id: userId } }),
    enabled: open,
  });

  useEffect(() => {
    if (!q.data) return;
    const next = Object.fromEntries(
      PERMISSION_KEYS.map((k) => [k, { can_view: false, can_edit: false }]),
    ) as Record<PermissionKey, { can_view: boolean; can_edit: boolean }>;
    q.data.forEach((r) => {
      if (PERMISSION_KEYS.includes(r.permission_key)) {
        next[r.permission_key] = { can_view: r.can_view, can_edit: r.can_edit };
      }
    });
    setState(next);
  }, [q.data]);

  const saveMut = useMutation({
    mutationFn: () => setFn({
      data: {
        user_id: userId,
        permissions: PERMISSION_KEYS.map((k) => ({
          permission_key: k,
          can_view: state[k].can_view,
          can_edit: state[k].can_edit,
        })),
      },
    }),
    onSuccess: () => {
      toast.success(tx("Permissions সেভ হয়েছে", "Permissions saved"));
      setOpen(false);
    },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });

  const toggle = (k: PermissionKey, field: "can_view" | "can_edit", v: boolean) => {
    setState((s) => {
      const cur = { ...s[k], [field]: v };
      // If edit is enabled, view must also be enabled
      if (field === "can_edit" && v) cur.can_view = true;
      // If view is disabled, edit must also be disabled
      if (field === "can_view" && !v) cur.can_edit = false;
      return { ...s, [k]: cur };
    });
  };

  const setAll = (field: "can_view" | "can_edit", v: boolean) => {
    setState((s) => {
      const next = { ...s };
      PERMISSION_KEYS.forEach((k) => {
        const cur = { ...next[k], [field]: v };
        if (field === "can_edit" && v) cur.can_view = true;
        if (field === "can_view" && !v) cur.can_edit = false;
        next[k] = cur;
      });
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8" title={tx("Permissions", "Permissions")}>
          <Lock className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {tx("Permissions — ", "Permissions — ")}<span className="text-primary">{userLabel}</span>
          </DialogTitle>
        </DialogHeader>
        {q.isLoading ? (
          <div className="grid place-items-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tx("পেজ / সেকশন", "Page / Section")}</TableHead>
                  <TableHead className="text-center w-24">
                    {tx("দেখা", "View")}
                    <button
                      type="button"
                      onClick={() => setAll("can_view", !PERMISSION_KEYS.every((k) => state[k].can_view))}
                      className="block mx-auto text-[10px] text-primary hover:underline"
                    >{tx("সব", "All")}</button>
                  </TableHead>
                  <TableHead className="text-center w-24">
                    {tx("এডিট", "Edit")}
                    <button
                      type="button"
                      onClick={() => setAll("can_edit", !PERMISSION_KEYS.every((k) => state[k].can_edit))}
                      className="block mx-auto text-[10px] text-primary hover:underline"
                    >{tx("সব", "All")}</button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PERMISSION_KEYS.map((k) => (
                  <TableRow key={k}>
                    <TableCell className="font-medium">{PERMISSION_LABELS[k].bn} <span className="text-xs text-muted-foreground">/ {PERMISSION_LABELS[k].en}</span></TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={state[k].can_view}
                        onCheckedChange={(v) => toggle(k, "can_view", !!v)}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={state[k].can_edit}
                        onCheckedChange={(v) => toggle(k, "can_edit", !!v)}
                        disabled={!state[k].can_view}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>{tx("বাতিল", "Cancel")}</Button>
          <Button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending}
            className="bg-gradient-primary text-white"
          >
            {saveMut.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {tx("সেভ", "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ onSubmit }: { onSubmit: (pw: string) => void }) {
  const tx = useTx();
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8" title={tx("পাসওয়ার্ড রিসেট", "Reset password")}><KeyRound className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{tx("পাসওয়ার্ড রিসেট", "Reset Password")}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(pw); setOpen(false); setPw(""); }} className="space-y-3">
          <div className="grid gap-1.5"><Label>{tx("নতুন পাসওয়ার্ড (min 6)", "New password (min 6)")}</Label><Input type="text" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{tx("বাতিল", "Cancel")}</Button>
            <Button type="submit" className="bg-gradient-primary text-white">{tx("রিসেট", "Reset")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({ u, onSubmit }: { u: UserRow; onSubmit: (patch: UserPatch) => void }) {
  const tx = useTx();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    email: u.email ?? "",
    full_name: u.full_name ?? "",
    mobile: u.mobile ?? "",
  });
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setF({ email: u.email ?? "", full_name: u.full_name ?? "", mobile: u.mobile ?? "" });
      }}
    >
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8" title={tx("এডিট", "Edit")}>
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{tx("ইউজার এডিট", "Edit User")}</DialogTitle></DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const patch: UserPatch = {};
            if (f.email && f.email !== (u.email ?? "")) patch.email = f.email.trim();
            if (f.full_name !== (u.full_name ?? "")) patch.full_name = f.full_name.trim();
            if (f.mobile !== (u.mobile ?? "")) patch.mobile = f.mobile.trim();
            if (Object.keys(patch).length === 0) {
              setOpen(false);
              return;
            }
            onSubmit(patch);
            setOpen(false);
          }}
          className="space-y-3"
        >
          <div className="grid gap-1.5">
            <Label>{tx("পূর্ণ নাম", "Full Name")}</Label>
            <Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label>{tx("ইমেইল", "Email")}</Label>
            <Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label>{tx("মোবাইল", "Mobile")}</Label>
            <Input value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{tx("বাতিল", "Cancel")}</Button>
            <Button type="submit" className="bg-gradient-primary text-white">{tx("সেভ", "Save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
