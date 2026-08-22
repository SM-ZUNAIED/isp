import { useMemo, useState, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Loader2, Trash2, Pencil, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/hooks/use-i18n";
import { opsList, opsInsert, opsUpdate, opsDelete, type OpsTable } from "@/lib/ops.functions";

export type Bi = { bn: string; en: string };

export type CrudField = {
  key: string;
  label: Bi;
  type: "text" | "number" | "date" | "datetime" | "time" | "textarea" | "select" | "switch" | "ref";
  options?: Array<{ value: string; label: Bi }>;
  ref?: { table: OpsTable; labelField: string; orderBy?: string };
  required?: boolean;
  defaultValue?: string | number | boolean;
  hideInTable?: boolean;
  badge?: boolean;
  prefix?: string;
};

export type CrudExtraColumn = {
  key: string;
  label: Bi;
  render: (row: Record<string, unknown>) => ReactNode;
};

export type CrudProps = {
  table: OpsTable;
  title: Bi;
  subtitle?: Bi;
  fields: CrudField[];
  orderBy?: string;
  ascending?: boolean;
  searchFields?: string[];
  readOnly?: boolean;
  extraColumns?: CrudExtraColumn[];
};

type Row = Record<string, unknown>;

export function CrudManager(props: CrudProps) {
  const { table, fields, orderBy = "created_at", ascending = false } = props;
  const { lang } = useI18n();
  const L = (b: Bi) => (lang === "en" ? b.en : b.bn);
  const qc = useQueryClient();

  const list = useServerFn(opsList);
  const insert = useServerFn(opsInsert);
  const update = useServerFn(opsUpdate);
  const remove = useServerFn(opsDelete);

  const q = useQuery({
    queryKey: ["ops", table],
    queryFn: () => list({ data: { table, orderBy, ascending } }),
  });

  const refFields = fields.filter((f) => f.type === "ref" && f.ref);
  const refQueries = useQuery({
    queryKey: ["ops-refs", table, refFields.map((f) => f.ref!.table).join(",")],
    enabled: refFields.length > 0,
    queryFn: async () => {
      const out: Record<string, Array<{ id: string; label: string }>> = {};
      for (const f of refFields) {
        const rows = await list({
          data: { table: f.ref!.table, orderBy: f.ref!.orderBy ?? f.ref!.labelField, ascending: true },
        });
        out[f.key] = (rows as Row[]).map((r) => ({
          id: String(r.id),
          label: String(r[f.ref!.labelField] ?? r.id),
        }));
      }
      return out;
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["ops", table] });
    qc.invalidateQueries({ queryKey: ["hr-stats"] });
    qc.invalidateQueries({ queryKey: ["call-stats"] });
  };

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [search, setSearch] = useState("");

  const blank = () => {
    const o: Record<string, unknown> = {};
    for (const f of fields) o[f.key] = f.defaultValue ?? (f.type === "switch" ? true : "");
    return o;
  };

  const openCreate = () => { setEditing(null); setForm(blank()); setOpen(true); };
  const openEdit = (r: Row) => {
    const o: Record<string, unknown> = {};
    for (const f of fields) {
      let v = r[f.key];
      if (f.type === "datetime" && typeof v === "string") v = v.slice(0, 16);
      if (f.type === "date" && typeof v === "string") v = v.slice(0, 10);
      if (f.type === "time" && typeof v === "string") v = v.slice(0, 5);
      o[f.key] = v ?? (f.type === "switch" ? false : "");
    }
    setEditing(r); setForm(o); setOpen(true);
  };

  const payload = () => {
    const o: Record<string, unknown> = {};
    for (const f of fields) {
      const v = form[f.key];
      if (f.type === "switch") o[f.key] = !!v;
      else if (f.type === "number") o[f.key] = v === "" || v == null ? 0 : Number(v);
      else if (v === "" || v == null) o[f.key] = null;
      else o[f.key] = v;
    }
    return o;
  };

  const saveMut = useMutation({
    mutationFn: async () =>
      editing
        ? update({ data: { table, id: String(editing.id), values: payload() } })
        : insert({ data: { table, values: payload() } }),
    onSuccess: () => {
      toast.success(lang === "en" ? "Saved" : "সংরক্ষিত হয়েছে");
      setOpen(false); invalidate();
    },
    onError: (e: Error) => toast.error(lang === "en" ? "Failed" : "ব্যর্থ", { description: e.message }),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => remove({ data: { table, id } }),
    onSuccess: () => { toast.success(lang === "en" ? "Deleted" : "মুছে ফেলা হয়েছে"); invalidate(); },
    onError: (e: Error) => toast.error(lang === "en" ? "Failed" : "ব্যর্থ", { description: e.message }),
  });

  const refMap = (key: string) => {
    const arr = refQueries.data?.[key] ?? [];
    const m: Record<string, string> = {};
    for (const o of arr) m[o.id] = o.label;
    return m;
  };

  const display = (f: CrudField, r: Row) => {
    const v = r[f.key];
    if (v === null || v === undefined || v === "") return "—";
    if (f.type === "switch") return v ? (lang === "en" ? "Yes" : "হ্যাঁ") : (lang === "en" ? "No" : "না");
    if (f.type === "ref") return refMap(f.key)[String(v)] ?? "—";
    if (f.type === "select") {
      const o = f.options?.find((x) => x.value === String(v));
      return o ? L(o.label) : String(v);
    }
    if (f.type === "datetime") return new Date(String(v)).toLocaleString(lang === "bn" ? "bn-BD" : "en-US");
    if (f.type === "number") return `${f.prefix ?? ""}${Number(v).toLocaleString(lang === "bn" ? "bn-BD" : "en-US")}`;
    return String(v);
  };

  const rows = (q.data ?? []) as Row[];
  const searchFields = props.searchFields ?? fields.filter((f) => f.type === "text").map((f) => f.key);
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      searchFields.some((k) => String(r[k] ?? "").toLowerCase().includes(s)),
    );
  }, [rows, search, searchFields]);

  const tableFields = fields.filter((f) => !f.hideInTable);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{L(props.title)}</h1>
          {props.subtitle && <p className="text-muted-foreground">{L(props.subtitle)}</p>}
        </div>
        {!props.readOnly && (
          <Button className="bg-gradient-primary text-white" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> {lang === "en" ? "Add New" : "নতুন যোগ করুন"}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder={lang === "en" ? "Search…" : "খুঁজুন…"}
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {q.isLoading ? (
            <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : q.error ? (
            <p className="text-sm text-destructive">{(q.error as Error).message}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {tableFields.map((f) => <TableHead key={f.key}>{L(f.label)}</TableHead>)}
                    {!props.readOnly && <TableHead className="text-right">{lang === "en" ? "Actions" : "অ্যাকশন"}</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={String(r.id)}>
                      {tableFields.map((f) => (
                        <TableCell key={f.key}>
                          {f.badge ? <Badge variant="secondary">{display(f, r)}</Badge> : display(f, r)}
                        </TableCell>
                      ))}
                      {!props.readOnly && (
                        <TableCell className="text-right whitespace-nowrap">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive"
                            onClick={() => delMut.mutate(String(r.id))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={tableFields.length + 1} className="text-center text-muted-foreground py-8">
                        {lang === "en" ? "No records found." : "কোনো তথ্য নেই।"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? (lang === "en" ? "Edit" : "এডিট") : (lang === "en" ? "Add New" : "নতুন যোগ করুন")} — {L(props.title)}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); saveMut.mutate(); }}>
            {fields.map((f) => {
              const v = form[f.key];
              return (
                <div key={f.key} className="space-y-1.5">
                  <Label>{L(f.label)}{f.required ? " *" : ""}</Label>
                  {f.type === "textarea" ? (
                    <Textarea value={String(v ?? "")} required={f.required}
                      onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))} />
                  ) : f.type === "switch" ? (
                    <div><Switch checked={!!v} onCheckedChange={(c) => setForm((s) => ({ ...s, [f.key]: c }))} /></div>
                  ) : f.type === "select" || f.type === "ref" ? (
                    <Select value={v ? String(v) : ""}
                      onValueChange={(val) => setForm((s) => ({ ...s, [f.key]: val }))}>
                      <SelectTrigger><SelectValue placeholder={lang === "en" ? "Select…" : "নির্বাচন করুন…"} /></SelectTrigger>
                      <SelectContent>
                        {f.type === "select"
                          ? (f.options ?? []).map((o) => <SelectItem key={o.value} value={o.value}>{L(o.label)}</SelectItem>)
                          : (refQueries.data?.[f.key] ?? []).map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={f.type === "number" ? "number" : f.type === "date" ? "date"
                        : f.type === "datetime" ? "datetime-local" : f.type === "time" ? "time" : "text"}
                      step={f.type === "number" ? "any" : undefined}
                      required={f.required}
                      value={String(v ?? "")}
                      onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                    />
                  )}
                </div>
              );
            })}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {lang === "en" ? "Cancel" : "বাতিল"}
              </Button>
              <Button type="submit" className="bg-gradient-primary text-white" disabled={saveMut.isPending}>
                {saveMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {lang === "en" ? "Save" : "সংরক্ষণ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function StatGrid({ items }: { items: Array<{ label: Bi; value: string; icon: React.ComponentType<{ className?: string }>; tone?: string }> }) {
  const { lang } = useI18n();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it, i) => {
        const Icon = it.icon;
        return (
          <Card key={i}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">{lang === "en" ? it.label.en : it.label.bn}</div>
                <div className="mt-1 text-2xl font-bold">{it.value}</div>
              </div>
              <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white ${it.tone ?? "from-indigo-500 to-indigo-600"}`}>
                <Icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
