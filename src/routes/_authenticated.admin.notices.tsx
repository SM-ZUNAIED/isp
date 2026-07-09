import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Plus, Trash2, Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  listNoticesAdmin, createNotice, toggleNotice, deleteNotice,
} from "@/lib/support.functions";

export const Route = createFileRoute("/_authenticated/admin/notices")({
  head: () => ({ meta: [{ title: "নোটিশ — Net Bill Pro" }] }),
  component: NoticesPage,
});

function NoticesPage() {
  const qc = useQueryClient();
  const list = useServerFn(listNoticesAdmin);
  const toggle = useServerFn(toggleNotice);
  const del = useServerFn(deleteNotice);

  const q = useQuery({ queryKey: ["notices-admin"], queryFn: () => list() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["notices-admin"] });

  const toggleMut = useMutation({
    mutationFn: (v: { id: string; is_active: boolean }) => toggle({ data: v }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error("ব্যর্থ", { description: e.message }),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("মুছে ফেলা হয়েছে"); invalidate(); },
    onError: (e: Error) => toast.error("ব্যর্থ", { description: e.message }),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">নোটিশ ও ঘোষণা</h1>
          <p className="text-muted-foreground">হোম পেজে দেখানো নোটিশ ম্যানেজ করুন</p>
        </div>
        <NewNoticeDialog onCreated={invalidate} />
      </div>

      {q.isLoading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (q.data ?? []).length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">কোনো নোটিশ নেই।</CardContent></Card>
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
                    {new Date(n.created_at).toLocaleString("bn-BD")}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Switch checked={!!n.is_active}
                    onCheckedChange={(v) => toggleMut.mutate({ id: n.id, is_active: v })} />
                  <Button variant="ghost" size="icon" className="text-destructive"
                    onClick={() => delMut.mutate(n.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function NewNoticeDialog({ onCreated }: { onCreated: () => void }) {
  const create = useServerFn(createNotice);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const mut = useMutation({
    mutationFn: () => create({ data: { title: title.trim(), body: body || null, is_active: true } }),
    onSuccess: () => {
      toast.success("নোটিশ যুক্ত হয়েছে");
      setOpen(false); setTitle(""); setBody(""); onCreated();
    },
    onError: (e: Error) => toast.error("ব্যর্থ", { description: e.message }),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary text-white"><Plus className="mr-2 h-4 w-4" />নতুন নোটিশ</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>নতুন নোটিশ</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (title.trim()) mut.mutate(); }} className="space-y-3">
          <div className="space-y-1.5"><Label>শিরোনাম *</Label>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>বিস্তারিত</Label>
            <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>বাতিল</Button>
            <Button type="submit" disabled={mut.isPending} className="bg-gradient-primary text-white">
              {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} প্রকাশ করুন
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
