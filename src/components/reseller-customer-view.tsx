import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResellerPageHeader, useL, type Bn } from "@/components/reseller-data-table";
import { resellerCustomers, resellerRefs } from "@/lib/reseller.functions";
import { resellerBulkUpdateCustomers } from "@/lib/reseller-extra.functions";
import { useResellerCtx } from "@/routes/_authenticated.reseller";

const STATUSES = ["active", "pending", "suspended", "expired", "no_payment"] as const;

export type CustomerFilter = "online" | "offline" | "free" | "recent" | "due" | "none";

export function ResellerCustomerView({
  title,
  subtitle,
  status,
  filter,
  bulk,
  note,
}: {
  title: Bn;
  subtitle?: Bn;
  status?: string;
  filter?: CustomerFilter;
  bulk?: "package" | "cycle" | "status";
  note?: Bn;
}) {
  const L = useL();
  const { can } = useResellerCtx();
  const qc = useQueryClient();
  const listFn = useServerFn(resellerCustomers);
  const refsFn = useServerFn(resellerRefs);
  const bulkFn = useServerFn(resellerBulkUpdateCustomers);

  const [term, setTerm] = useState("");
  const q = useQuery({
    queryKey: ["reseller-customers", status ?? "all", term],
    queryFn: () => listFn({ data: { q: term || undefined, status, limit: 500 } }),
  });
  const refs = useQuery({ queryKey: ["reseller-refs"], queryFn: () => refsFn(), enabled: !!bulk });

  const [selected, setSelected] = useState<string[]>([]);
  const [pkg, setPkg] = useState("");
  const [expiry, setExpiry] = useState("");
  const [newStatus, setNewStatus] = useState("active");

  const rows = useMemo(() => {
    const all = (q.data ?? []) as Array<Record<string, unknown>>;
    if (filter === "none") return [];
    if (filter === "online") return all.filter((c) => c.status === "active");
    if (filter === "offline") return all.filter((c) => c.status !== "active");
    if (filter === "free") return all.filter((c) => Number(c.monthly_bill ?? 0) === 0);
    if (filter === "recent") return all.slice(0, 50);
    return all;
  }, [q.data, filter]);

  const bulkM = useMutation({
    mutationFn: () =>
      bulkFn({
        data: {
          ids: selected,
          package_id: bulk === "package" ? pkg || null : null,
          expiry_date: bulk === "cycle" ? expiry || null : null,
          status: bulk === "status" ? (newStatus as "active") : null,
        },
      }),
    onSuccess: (r) => {
      toast.success(L({ bn: `${r.updated} জন আপডেট হয়েছে`, en: `${r.updated} customers updated` }));
      setSelected([]);
      qc.invalidateQueries({ queryKey: ["reseller-customers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const allChecked = rows.length > 0 && selected.length === rows.length;
  const canBulk = !!bulk && can("customers", "edit");

  return (
    <div className="space-y-6">
      <ResellerPageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="w-56 pl-8" value={term} onChange={(e) => setTerm(e.target.value)} placeholder={L({ bn: "নাম / আইডি / মোবাইল", en: "Name / ID / mobile" })} />
          </div>
        }
      />

      {note && <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">{L(note)}</p>}

      {canBulk && (
        <Card>
          <CardContent className="flex flex-wrap items-end gap-3 p-4">
            {bulk === "package" && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{L({ bn: "নতুন প্যাকেজ", en: "New package" })}</Label>
                <Select value={pkg} onValueChange={setPkg}>
                  <SelectTrigger className="w-56"><SelectValue placeholder={L({ bn: "প্যাকেজ বাছুন", en: "Select package" })} /></SelectTrigger>
                  <SelectContent>
                    {((refs.data?.packages ?? []) as Array<{ id: string; name: string }>).map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {bulk === "cycle" && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{L({ bn: "নতুন মেয়াদ / বিলিং তারিখ", en: "New expiry / billing date" })}</Label>
                <Input type="date" className="w-48" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
              </div>
            )}
            {bulk === "status" && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{L({ bn: "নতুন স্ট্যাটাস", en: "New status" })}</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <Button disabled={!selected.length || bulkM.isPending} onClick={() => bulkM.mutate()}>
              {bulkM.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {L({ bn: `প্রয়োগ করুন (${selected.length})`, en: `Apply to ${selected.length}` })}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="overflow-x-auto p-0">
          {q.isLoading ? (
            <div className="grid place-items-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : q.error ? (
            <p className="p-6 text-destructive">{(q.error as Error).message}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {canBulk && (
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allChecked}
                        onCheckedChange={(v) => setSelected(v ? rows.map((r) => String(r.id)) : [])}
                      />
                    </TableHead>
                  )}
                  <TableHead>{L({ bn: "ইউজার আইডি", en: "User ID" })}</TableHead>
                  <TableHead>{L({ bn: "নাম", en: "Name" })}</TableHead>
                  <TableHead>{L({ bn: "মোবাইল", en: "Mobile" })}</TableHead>
                  <TableHead>{L({ bn: "প্যাকেজ", en: "Package" })}</TableHead>
                  <TableHead>{L({ bn: "মাসিক বিল", en: "Monthly" })}</TableHead>
                  <TableHead>{L({ bn: "মেয়াদ", en: "Expiry" })}</TableHead>
                  <TableHead>{L({ bn: "স্ট্যাটাস", en: "Status" })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canBulk ? 8 : 7} className="py-10 text-center text-muted-foreground">
                      {L({ bn: "কোনো কাস্টমার নেই", en: "No customers" })}
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((c) => {
                  const id = String(c.id);
                  return (
                    <TableRow key={id}>
                      {canBulk && (
                        <TableCell>
                          <Checkbox
                            checked={selected.includes(id)}
                            onCheckedChange={(v) => setSelected((s) => (v ? [...s, id] : s.filter((x) => x !== id)))}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-mono text-xs">{String(c.customer_code ?? "")}</TableCell>
                      <TableCell className="font-medium">{String(c.full_name ?? "")}</TableCell>
                      <TableCell>{String(c.mobile ?? "—")}</TableCell>
                      <TableCell>{(c.packages as { name?: string } | null)?.name ?? "—"}</TableCell>
                      <TableCell>৳{Number(c.monthly_bill ?? 0).toLocaleString()}</TableCell>
                      <TableCell>{c.expiry_date ? String(c.expiry_date) : "—"}</TableCell>
                      <TableCell><Badge variant="secondary">{String(c.status)}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
