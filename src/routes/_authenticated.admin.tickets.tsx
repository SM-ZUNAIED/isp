import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  listTickets, updateTicketStatus, listTicketReplies, addTicketReply,
} from "@/lib/support.functions";
import { useTx, useFmt } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/tickets")({
  head: () => ({ meta: [{ title: "সাপোর্ট টিকেট — Net Bill Pro" }] }),
  component: TicketsPage,
});

const STATUS: Record<string, { bn: string; en: string; tone: string }> = {
  pending: { bn: "অপেক্ষমাণ", en: "Pending", tone: "bg-amber-100 text-amber-700 border-amber-200" },
  in_progress: { bn: "চলমান", en: "In progress", tone: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  solved: { bn: "সমাধান", en: "Solved", tone: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  closed: { bn: "বন্ধ", en: "Closed", tone: "bg-slate-200 text-slate-700 border-slate-300" },
};
const CATEGORY: Record<string, { bn: string; en: string }> = {
  no_internet: { bn: "ইন্টারনেট নেই", en: "No internet" },
  slow_speed: { bn: "স্লো স্পিড", en: "Slow speed" },
  payment_issue: { bn: "পেমেন্ট সমস্যা", en: "Payment issue" },
  router_issue: { bn: "রাউটার সমস্যা", en: "Router issue" },
  onu_issue: { bn: "ONU সমস্যা", en: "ONU issue" },
  other: { bn: "অন্যান্য", en: "Other" },
};

function TicketsPage() {
  const qc = useQueryClient();
  const tx = useTx();
  const { lang } = useFmt();
  const list = useServerFn(listTickets);
  const setStatus = useServerFn(updateTicketStatus);
  const q = useQuery({ queryKey: ["tickets"], queryFn: () => list() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["tickets"] });

  const [openId, setOpenId] = useState<string | null>(null);
  const statusMut = useMutation({
    mutationFn: (v: { id: string; status: "pending" | "in_progress" | "solved" | "closed" }) => setStatus({ data: v }),
    onSuccess: () => { toast.success(tx("স্ট্যাটাস আপডেট", "Status updated")); invalidate(); },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{tx("সাপোর্ট টিকেট", "Support Tickets")}</h1>
        <p className="text-muted-foreground">{tx("গ্রাহকের অভিযোগ ও সাপোর্ট ম্যানেজ করুন", "Manage customer complaints and support")}</p>
      </div>

      {q.isLoading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (q.data ?? []).length === 0 ? (
        <Card><CardContent className="p-10 text-center text-muted-foreground">{tx("কোনো টিকেট নেই।", "No tickets.")}</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {(q.data ?? []).map((t) => {
            const st = STATUS[t.status];
            const cat = CATEGORY[t.category];
            return (
              <Card key={t.id} className="hover:shadow-md transition">
                <CardContent className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-white shrink-0">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{t.subject}</span>
                      <Badge variant="outline" className={st.tone}>{tx(st.bn, st.en)}</Badge>
                      <Badge variant="outline">{cat ? tx(cat.bn, cat.en) : t.category}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      #{t.ticket_number} • {t.customers?.full_name ?? "—"} ({t.customers?.mobile ?? "—"})
                      • {new Date(t.created_at).toLocaleString(lang === "bn" ? "bn-BD" : "en-US")}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={t.status} onValueChange={(v) => statusMut.mutate({ id: t.id, status: v as "pending" | "in_progress" | "solved" | "closed" })}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{tx(v.bn, v.en)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" onClick={() => setOpenId(t.id)}>{tx("বিস্তারিত", "Details")}</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <TicketDialog id={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

function TicketDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const list = useServerFn(listTicketReplies);
  const add = useServerFn(addTicketReply);
  const qc = useQueryClient();
  const [msg, setMsg] = useState("");

  const q = useQuery({
    queryKey: ["ticket-replies", id],
    queryFn: () => list({ data: { ticket_id: id! } }),
    enabled: !!id,
  });
  const mut = useMutation({
    mutationFn: () => add({ data: { ticket_id: id!, message: msg.trim() } }),
    onSuccess: () => { setMsg(""); qc.invalidateQueries({ queryKey: ["ticket-replies", id] }); qc.invalidateQueries({ queryKey: ["tickets"] }); },
    onError: (e: Error) => toast.error("ব্যর্থ", { description: e.message }),
  });

  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>টিকেটের কথোপকথন</DialogTitle></DialogHeader>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {q.isLoading && <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />}
          {(q.data ?? []).map((r) => (
            <div key={r.id} className={`rounded-xl p-3 ${r.is_staff ? "bg-primary/10 ml-8" : "bg-muted mr-8"}`}>
              <div className="text-xs text-muted-foreground mb-1">
                {r.is_staff ? "স্টাফ" : "কাস্টমার"} • {new Date(r.created_at).toLocaleString("bn-BD")}
              </div>
              <div className="text-sm whitespace-pre-wrap">{r.message}</div>
            </div>
          ))}
          {!q.isLoading && (q.data ?? []).length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">কোনো উত্তর নেই।</p>
          )}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (msg.trim()) mut.mutate(); }} className="flex gap-2 pt-2">
          <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={2} placeholder="উত্তর লিখুন..." />
          <Button type="submit" disabled={mut.isPending || !msg.trim()} className="bg-gradient-primary text-white self-end">
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
