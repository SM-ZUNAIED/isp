import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Plus, Trash2, Bell, Pencil, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  listNoticesAdmin, createNotice, updateNotice, toggleNotice, deleteNotice,
} from "@/lib/support.functions";
import { broadcastSms, runCronTask } from "@/lib/notify.functions";
import { useTx, useFmt } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/notices")({
  head: () => ({ meta: [{ title: "নোটিশ — Net Bill Pro" }] }),
  component: NoticesPage,
});

type NoticeRow = { id: string; title: string; body?: string | null; is_active?: boolean | null; created_at: string };

function NoticesPage() {
  const qc = useQueryClient();
  const tx = useTx();
  const { lang } = useFmt();
  const list = useServerFn(listNoticesAdmin);
  const toggle = useServerFn(toggleNotice);
  const del = useServerFn(deleteNotice);

  const q = useQuery({ queryKey: ["notices-admin"], queryFn: () => list() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["notices-admin"] });

  const toggleMut = useMutation({
    mutationFn: (v: { id: string; is_active: boolean }) => toggle({ data: v }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success(tx("মুছে ফেলা হয়েছে", "Deleted")); invalidate(); },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{tx("নোটিশ ও ঘোষণা", "Notices & Announcements")}</h1>
          <p className="text-muted-foreground">{tx("হোম পেজে দেখানো নোটিশ ম্যানেজ করুন", "Manage notices shown on the home page")}</p>
        </div>
        <NoticeFormDialog mode="create" onSaved={invalidate} />
      </div>

      {q.isLoading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (q.data ?? []).length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">{tx("কোনো নোটিশ নেই।", "No notices.")}</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {(q.data ?? []).map((n) => (
            <Card key={n.id}>
              <CardContent className="p-4 flex gap-3 items-start">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-white shrink-0">
                  <Bell className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{n.title}</div>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{n.body || "—"}</p>
                  <div className="text-xs text-muted-foreground mt-2">
                    {new Date(n.created_at).toLocaleString(lang === "bn" ? "bn-BD" : "en-US")}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Switch checked={!!n.is_active}
                    onCheckedChange={(v) => toggleMut.mutate({ id: n.id, is_active: v })} />
                  <div className="flex gap-1">
                    <NoticeFormDialog mode="edit" initial={n as NoticeRow} onSaved={invalidate} />
                    <Button variant="ghost" size="icon" className="text-destructive"
                      onClick={() => delMut.mutate(n.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function NoticeFormDialog({
  mode, initial, onSaved,
}: {
  mode: "create" | "edit";
  initial?: NoticeRow;
  onSaved: () => void;
}) {
  const tx = useTx();
  const create = useServerFn(createNotice);
  const update = useServerFn(updateNotice);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active !== false);

  const mut = useMutation({
    mutationFn: async () => {
      const payload = { title: title.trim(), body: body || null, is_active: isActive };
      if (mode === "create") await create({ data: payload });
      else await update({ data: { id: initial!.id, ...payload } });
    },
    onSuccess: () => {
      toast.success(mode === "create" ? tx("নোটিশ যুক্ত হয়েছে", "Notice added") : tx("আপডেট হয়েছে", "Updated"));
      setOpen(false); onSaved();
      if (mode === "create") { setTitle(""); setBody(""); setIsActive(true); }
    },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });
  return (
    <Dialog open={open} onOpenChange={(v) => {
      setOpen(v);
      if (v && initial) { setTitle(initial.title); setBody(initial.body ?? ""); setIsActive(initial.is_active !== false); }
    }}>
      <DialogTrigger asChild>
        {mode === "create"
          ? <Button className="bg-gradient-primary text-white"><Plus className="mr-2 h-4 w-4" />{tx("নতুন নোটিশ", "New Notice")}</Button>
          : <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{mode === "create" ? tx("নতুন নোটিশ", "New Notice") : tx("নোটিশ এডিট", "Edit Notice")}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (title.trim()) mut.mutate(); }} className="space-y-3">
          <div className="space-y-1.5"><Label>{tx("শিরোনাম", "Title")} *</Label>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>{tx("বিস্তারিত", "Details")}</Label>
            <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} /></div>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={isActive} onCheckedChange={setIsActive} /> {tx("সক্রিয়", "Active")}
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{tx("বাতিল", "Cancel")}</Button>
            <Button type="submit" disabled={mut.isPending} className="bg-gradient-primary text-white">
              {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {tx("সংরক্ষণ", "Save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
