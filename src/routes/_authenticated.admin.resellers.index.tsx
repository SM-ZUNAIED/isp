import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Plus, KeyRound, ShieldCheck, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/hooks/use-i18n";
import { listResellers, updateReseller, resetResellerPassword, deleteReseller } from "@/lib/reseller.functions";

export const Route = createFileRoute("/_authenticated/admin/resellers/")({
  component: ResellersPage,
});

type Row = {
  id: string; name: string; business_name: string | null; username: string;
  email: string | null; phone: string | null; status: string;
  current_balance: number; created_at: string; last_login_at: string | null;
  customer_count: number; module_count: number;
};

function ResellersPage() {
  const { lang } = useI18n();
  const L = (b: { bn: string; en: string }) => (lang === "en" ? b.en : b.bn);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const listFn = useServerFn(listResellers);
  const updateFn = useServerFn(updateReseller);
  const resetFn = useServerFn(resetResellerPassword);
  const delFn = useServerFn(deleteReseller);

  const q = useQuery({ queryKey: ["resellers"], queryFn: () => listFn() });
  const [term, setTerm] = useState("");
  const [pwFor, setPwFor] = useState<Row | null>(null);
  const [pw, setPw] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["resellers"] });

  const statusM = useMutation({
    mutationFn: (v: { id: string; status: string }) => updateFn({ data: { id: v.id, status: v.status as "active" } }),
    onSuccess: () => { toast.success(L({ bn: "আপডেট হয়েছে", en: "Updated" })); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const saveM = useMutation({
    mutationFn: (v: Row) => updateFn({ data: { id: v.id, name: v.name, business_name: v.business_name, phone: v.phone, email: v.email ?? undefined } }),
    onSuccess: () => { toast.success(L({ bn: "সেভ হয়েছে", en: "Saved" })); setEditing(null); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const pwM = useMutation({
    mutationFn: () => resetFn({ data: { id: pwFor!.id, password: pw } }),
    onSuccess: () => { toast.success(L({ bn: "পাসওয়ার্ড রিসেট হয়েছে", en: "Password reset" })); setPwFor(null); setPw(""); },
    onError: (e: Error) => toast.error(e.message),
  });
  const delM = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success(L({ bn: "রিসেলার নিষ্ক্রিয় (ডিলিট) হয়েছে", en: "Reseller soft-deleted" })); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = ((q.data ?? []) as Row[]).filter((r) =>
    !term || [r.name, r.username, r.email, r.phone, r.business_name].join(" ").toLowerCase().includes(term.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{L({ bn: "রিসেলার তালিকা", en: "Resellers" })}</h1>
          <p className="text-sm text-muted-foreground">{L({ bn: "সব রিসেলার ও তাদের অ্যাক্সেস", en: "All resellers and their access" })}</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8 w-56" placeholder={L({ bn: "খুঁজুন...", en: "Search..." })} value={term} onChange={(e) => setTerm(e.target.value)} />
          </div>
          <Button asChild><Link to="/admin/resellers/add"><Plus className="mr-2 h-4 w-4" />{L({ bn: "নতুন রিসেলার", en: "Add Reseller" })}</Link></Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {q.isLoading ? (
            <div className="grid place-items-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{L({ bn: "নাম", en: "Name" })}</TableHead>
                  <TableHead>{L({ bn: "ইউজারনেম", en: "Username" })}</TableHead>
                  <TableHead>{L({ bn: "ফোন", en: "Phone" })}</TableHead>
                  <TableHead>{L({ bn: "ইমেইল", en: "Email" })}</TableHead>
                  <TableHead>{L({ bn: "ব্যালেন্স", en: "Balance" })}</TableHead>
                  <TableHead>{L({ bn: "কাস্টমার", en: "Customers" })}</TableHead>
                  <TableHead>{L({ bn: "অ্যাক্সেস", en: "Access" })}</TableHead>
                  <TableHead>{L({ bn: "স্ট্যাটাস", en: "Status" })}</TableHead>
                  <TableHead className="text-right">{L({ bn: "অ্যাকশন", en: "Actions" })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">{L({ bn: "কোনো রিসেলার নেই", en: "No resellers yet" })}</TableCell></TableRow>
                )}
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.business_name ?? "—"}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{r.username}</TableCell>
                    <TableCell>{r.phone ?? "—"}</TableCell>
                    <TableCell className="text-xs">{r.email ?? "—"}</TableCell>
                    <TableCell>৳{Number(r.current_balance ?? 0).toLocaleString()}</TableCell>
                    <TableCell>{r.customer_count}</TableCell>
                    <TableCell><Badge variant="secondary">{r.module_count} {L({ bn: "মডিউল", en: "modules" })}</Badge></TableCell>
                    <TableCell>
                      <Select value={r.status} onValueChange={(v) => statusM.mutate({ id: r.id, status: v })}>
                        <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">{L({ bn: "সক্রিয়", en: "Active" })}</SelectItem>
                          <SelectItem value="inactive">{L({ bn: "নিষ্ক্রিয়", en: "Inactive" })}</SelectItem>
                          <SelectItem value="suspended">{L({ bn: "সাসপেন্ড", en: "Suspended" })}</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button size="icon" variant="ghost" title={L({ bn: "অ্যাক্সেস", en: "Manage Access" })}
                        onClick={() => navigate({ to: "/admin/resellers/access", search: { reseller: r.id } as never })}>
                        <ShieldCheck className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" title={L({ bn: "এডিট", en: "Edit" })} onClick={() => setEditing(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" title={L({ bn: "পাসওয়ার্ড রিসেট", en: "Reset Password" })} onClick={() => setPwFor(r)}>
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive" title={L({ bn: "ডিলিট", en: "Delete" })}
                        onClick={() => { if (confirm(L({ bn: "রিসেলার ডিলিট করবেন? কাস্টমার ডাটা থাকবে।", en: "Delete reseller? Customer data is kept." }))) delM.mutate(r.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!pwFor} onOpenChange={(o) => !o && setPwFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{L({ bn: "পাসওয়ার্ড রিসেট", en: "Reset Password" })} — {pwFor?.name}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>{L({ bn: "নতুন পাসওয়ার্ড", en: "New password" })}</Label>
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>
          <DialogFooter>
            <Button onClick={() => pwM.mutate()} disabled={pw.length < 6 || pwM.isPending}>
              {pwM.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{L({ bn: "সেভ", en: "Save" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{L({ bn: "রিসেলার এডিট", en: "Edit Reseller" })}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div className="space-y-1.5"><Label>{L({ bn: "নাম", en: "Name" })}</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>{L({ bn: "প্রতিষ্ঠান", en: "Business" })}</Label>
                <Input value={editing.business_name ?? ""} onChange={(e) => setEditing({ ...editing, business_name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>{L({ bn: "ফোন", en: "Phone" })}</Label>
                <Input value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => editing && saveM.mutate(editing)} disabled={saveM.isPending}>
              {saveM.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{L({ bn: "সেভ", en: "Save" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
