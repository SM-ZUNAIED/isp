import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/hooks/use-i18n";
import { resellerCustomers } from "@/lib/reseller.functions";

export const Route = createFileRoute("/_authenticated/reseller/customer-search")({
  component: CustomerSearch,
});

function CustomerSearch() {
  const { lang } = useI18n();
  const L = (b: { bn: string; en: string }) => (lang === "en" ? b.en : b.bn);
  const fn = useServerFn(resellerCustomers);
  const [f, setF] = useState({ q: "", status: "all", expire_from: "", expire_to: "" });
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);

  const m = useMutation({
    mutationFn: () =>
      fn({
        data: {
          q: f.q || undefined,
          status: f.status === "all" ? undefined : f.status,
          expire_from: f.expire_from || undefined,
          expire_to: f.expire_to || undefined,
          limit: 300,
        },
      }),
    onSuccess: (d) => setRows(d as Array<Record<string, unknown>>),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{L({ bn: "কাস্টমার সার্চ", en: "Customer Search" })}</h1>
      <Card>
        <CardHeader><CardTitle className="text-base">{L({ bn: "অনুসন্ধান", en: "Search filters" })}</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{L({ bn: "CID / ইউজারনেম / নাম / কন্টাক্ট", en: "CID / Username / Name / Contact" })}</Label>
            <Input value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{L({ bn: "কাস্টমার স্ট্যাটাস", en: "Customer Status" })}</Label>
            <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{L({ bn: "সব", en: "All" })}</SelectItem>
                {["active", "pending", "suspended", "expired", "no_payment"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{L({ bn: "মেয়াদ (শুরু)", en: "Expire Date From" })}</Label>
            <Input type="date" value={f.expire_from} onChange={(e) => setF({ ...f, expire_from: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{L({ bn: "মেয়াদ (শেষ)", en: "Expire Date To" })}</Label>
            <Input type="date" value={f.expire_to} onChange={(e) => setF({ ...f, expire_to: e.target.value })} />
          </div>
          <div>
            <Button onClick={() => m.mutate()} disabled={m.isPending}>
              {m.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              {L({ bn: "খুঁজুন", en: "Search" })}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{L({ bn: "ইউজার আইডি", en: "User ID" })}</TableHead>
                <TableHead>{L({ bn: "নাম", en: "Name" })}</TableHead>
                <TableHead>{L({ bn: "মোবাইল", en: "Contact" })}</TableHead>
                <TableHead>{L({ bn: "প্যাকেজ", en: "Package" })}</TableHead>
                <TableHead>{L({ bn: "মেয়াদ", en: "Expiry" })}</TableHead>
                <TableHead>{L({ bn: "স্ট্যাটাস", en: "Status" })}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">{L({ bn: "ফলাফল নেই", en: "No results" })}</TableCell></TableRow>
              )}
              {rows.map((c) => (
                <TableRow key={String(c.id)}>
                  <TableCell className="font-mono text-xs">{String(c.customer_code ?? "")}</TableCell>
                  <TableCell>{String(c.full_name ?? "")}</TableCell>
                  <TableCell>{String(c.mobile ?? "—")}</TableCell>
                  <TableCell>{(c.packages as { name?: string } | null)?.name ?? "—"}</TableCell>
                  <TableCell>{c.expiry_date ? String(c.expiry_date) : "—"}</TableCell>
                  <TableCell>{String(c.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
