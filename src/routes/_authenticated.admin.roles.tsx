import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Plus, Pencil, Trash2, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  listJobRoles, createJobRole, updateJobRole, deleteJobRole, type JobRoleRow,
} from "@/lib/job-roles.functions";
import { useTx } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/roles")({
  head: () => ({
    meta: [
      { title: "রোল ম্যানেজমেন্ট — Roles" },
      { name: "description", content: "Create and manage staff roles / designations used across the panel." },
      { property: "og:title", content: "রোল ম্যানেজমেন্ট — Roles" },
      { property: "og:description", content: "Create and manage staff roles / designations used across the panel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RolesPage,
});

type FormState = { id?: string; name: string; bn_name: string; description: string; is_active: boolean };
const EMPTY: FormState = { name: "", bn_name: "", description: "", is_active: true };

function RolesPage() {
  const tx = useTx();
  const qc = useQueryClient();
  const list = useServerFn(listJobRoles);
  const create = useServerFn(createJobRole);
  const update = useServerFn(updateJobRole);
  const remove = useServerFn(deleteJobRole);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [delId, setDelId] = useState<string | null>(null);

  const q = useQuery({ queryKey: ["job-roles"], queryFn: () => list() });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["job-roles"] });
    qc.invalidateQueries({ queryKey: ["staff"] });
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        bn_name: form.bn_name.trim() || null,
        description: form.description.trim() || null,
        is_active: form.is_active,
      };
      if (form.id) return update({ data: { id: form.id, ...payload } });
      return create({ data: payload });
    },
    onSuccess: () => {
      toast.success(tx("সেভ হয়েছে", "Saved"));
      setOpen(false);
      setForm(EMPTY);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success(tx("ডিলিট হয়েছে", "Deleted"));
      setDelId(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (q.data ?? []) as JobRoleRow[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BadgeCheck className="h-6 w-6" />
            {tx("রোল / পদবি", "Roles / Designations")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {tx(
              "এখানে তৈরি করা রোলগুলো স্টাফ ফর্মের পদবি অপশনে দেখা যাবে",
              "Roles created here appear in the staff designation dropdown",
            )}
          </p>
        </div>
        <Button onClick={() => { setForm(EMPTY); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          {tx("নতুন রোল", "New Role")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {q.isLoading ? (
            <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {tx("কোনো রোল নেই", "No roles yet")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tx("নাম (English)", "Name (English)")}</TableHead>
                  <TableHead>{tx("বাংলা নাম", "Bengali Name")}</TableHead>
                  <TableHead>{tx("বিবরণ", "Description")}</TableHead>
                  <TableHead>{tx("স্ট্যাটাস", "Status")}</TableHead>
                  <TableHead className="text-right">{tx("অ্যাকশন", "Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.bn_name || "—"}</TableCell>
                    <TableCell className="max-w-[280px] truncate">{r.description || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={r.is_active ? "default" : "secondary"}>
                        {r.is_active ? tx("সক্রিয়", "Active") : tx("নিষ্ক্রিয়", "Inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setForm({
                            id: r.id,
                            name: r.name,
                            bn_name: r.bn_name ?? "",
                            description: r.description ?? "",
                            is_active: r.is_active,
                          });
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDelId(r.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {form.id ? tx("রোল এডিট", "Edit Role") : tx("নতুন রোল", "New Role")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{tx("নাম (English) *", "Name (English) *")}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>{tx("বাংলা নাম", "Bengali Name")}</Label>
              <Input value={form.bn_name} onChange={(e) => setForm({ ...form, bn_name: e.target.value })} />
            </div>
            <div>
              <Label>{tx("বিবরণ", "Description")}</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>{tx("সক্রিয়", "Active")}</Label>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{tx("বাতিল", "Cancel")}</Button>
            <Button
              disabled={form.name.trim().length < 2 || save.isPending}
              onClick={() => save.mutate()}
            >
              {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {tx("সেভ", "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tx("রোল ডিলিট করবেন?", "Delete this role?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tx(
                "এই রোলটি আর পদবি অপশনে দেখা যাবে না।",
                "This role will no longer appear in the designation dropdown.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tx("বাতিল", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => delId && del.mutate(delId)}>
              {tx("ডিলিট", "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
