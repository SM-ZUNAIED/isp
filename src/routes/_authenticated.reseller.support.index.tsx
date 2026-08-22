import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/hooks/use-i18n";
import { useResellerCtx } from "./_authenticated.reseller";
import { resellerTickets, resellerCreateTicket, resellerCustomers } from "@/lib/reseller.functions";

export const Route = createFileRoute("/_authenticated/reseller/support/")({
  component: ResellerSupport,
});

const CATEGORIES = ["no_internet", "slow_speed", "payment_issue", "router_issue", "onu_issue", "other"] as const;

function ResellerSupport() {
  const { lang } = useI18n();
  const L = (b: { bn: string; en: string }) => (lang === "en" ? b.en : b.bn);
  const { can } = useResellerCtx();
  const qc = useQueryClient();

  const listFn = useServerFn(resellerTickets);
  const custFn = useServerFn(resellerCustomers);
  const createFn = useServerFn(resellerCreateTicket);

  const q = useQuery({ queryKey: ["reseller-tickets"], queryFn: () => listFn() });
  const custQ = useQuery({ queryKey: ["reseller-customers", "", "all"], queryFn: () => custFn({ data: { limit: 200 } }) });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customer_id: "", subject: "", description: "", category: "other" });

  const createM = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          customer_id: form.customer_id,
          subject: form.subject.trim(),
          description: form.description.trim() || null,
          category: form.category as "other",
        },
      }),
    onSuccess: () => {
      toast.success(L({ bn: "টিকেট তৈরি হয়েছে", en: "Ticket created" }));
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["reseller-tickets"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (q.data ?? []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{L({ bn: "সাপোর্ট", en: "Support" })}</h1>
        {can("support", "create") && (
          <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />{L({ bn: "নতুন টোকেন", en: "Create Token" })}</Button>
        )}
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          {q.isLoading ? (
            <div className="grid place-items-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : q.error ? (
            <p className="p-6 text-destructive">{(q.error as Error).message}</p>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>{L({ bn: "টোকেন", en: "Token" })}</TableHead>
                <TableHead>{L({ bn: "কাস্টমার", en: "Customer" })}</TableHead>
                <TableHead>{L({ bn: "বিষয়", en: "Subject" })}</TableHead>
                <TableHead>{L({ bn: "ক্যাটাগরি", en: "Category" })}</TableHead>
                <TableHead>{L({ bn: "স্ট্যাটাস", en: "Status" })}</TableHead>
                <TableHead>{L({ bn: "তারিখ", en: "Date" })}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">{L({ bn: "কোনো টিকেট নেই", en: "No tickets" })}</TableCell></TableRow>
                )}
                {rows.map((t) => (
                  <TableRow key={String(t.id)}>
                    <TableCell className="font-mono text-xs">{String(t.ticket_number ?? "")}</TableCell>
                    <TableCell>{(t.customers as { full_name?: string } | null)?.full_name ?? "—"}</TableCell>
                    <TableCell>{String(t.subject ?? "")}</TableCell>
                    <TableCell className="text-xs">{String(t.category ?? "")}</TableCell>
                    <TableCell><Badge variant="secondary">{String(t.status ?? "")}</Badge></TableCell>
                    <TableCell>{String(t.created_at ?? "").slice(0, 10)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{L({ bn: "নতুন সাপোর্ট টোকেন", en: "Create Token" })}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{L({ bn: "কাস্টমার", en: "Customer" })}</Label>
              <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {((custQ.data ?? []) as Array<Record<string, unknown>>).map((c) => (
                    <SelectItem key={String(c.id)} value={String(c.id)}>{String(c.full_name)} ({String(c.customer_code)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{L({ bn: "বিষয়", en: "Subject" })}</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{L({ bn: "ক্যাটাগরি", en: "Category" })}</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{L({ bn: "বিবরণ", en: "Description" })}</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => createM.mutate()} disabled={createM.isPending || !form.customer_id || form.subject.length < 3}>
              {createM.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{L({ bn: "সেভ", en: "Save" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
