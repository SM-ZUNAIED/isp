import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/hooks/use-i18n";
import { listResellers, adminGetResellerPermissions, adminSetResellerPermissions } from "@/lib/reseller.functions";
import {
  RESELLER_MODULES, RESELLER_MODULE_LABELS, RESELLER_MODULE_GROUPS, VIEW_ONLY_MODULES,
  type ResellerModuleKey, type ResellerPerm,
} from "@/lib/reseller-keys";

export const Route = createFileRoute("/_authenticated/admin/resellers/access")({
  validateSearch: (s: Record<string, unknown>) => ({ reseller: typeof s.reseller === "string" ? s.reseller : undefined }),
  component: ResellerAccessPage,
});

type PermMap = Record<string, ResellerPerm>;

function emptyMap(): PermMap {
  const m: PermMap = {};
  RESELLER_MODULES.forEach((k) => {
    m[k] = { permission_key: k, can_view: false, can_create: false, can_edit: false, can_delete: false };
  });
  return m;
}

function ResellerAccessPage() {
  const { lang } = useI18n();
  const L = (b: { bn: string; en: string }) => (lang === "en" ? b.en : b.bn);
  const search = useSearch({ from: "/_authenticated/admin/resellers/access" });

  const listFn = useServerFn(listResellers);
  const getFn = useServerFn(adminGetResellerPermissions);
  const setFn = useServerFn(adminSetResellerPermissions);

  const listQ = useQuery({ queryKey: ["resellers"], queryFn: () => listFn() });
  const [selected, setSelected] = useState<string>(search.reseller ?? "");
  const [map, setMap] = useState<PermMap>(emptyMap());

  const permQ = useQuery({
    queryKey: ["reseller-perms", selected],
    queryFn: () => getFn({ data: { reseller_id: selected } }),
    enabled: !!selected,
  });

  useEffect(() => {
    const base = emptyMap();
    (permQ.data ?? []).forEach((p) => { base[p.permission_key] = p; });
    setMap(base);
  }, [permQ.data]);

  useEffect(() => {
    if (!selected && listQ.data?.length) setSelected((listQ.data as Array<{ id: string }>)[0].id);
  }, [listQ.data, selected]);

  const saveM = useMutation({
    mutationFn: () => setFn({ data: { reseller_id: selected, permissions: RESELLER_MODULES.map((k) => map[k]) } }),
    onSuccess: () => toast.success(L({ bn: "পারমিশন সেভ হয়েছে", en: "Permissions saved" })),
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = (k: ResellerModuleKey, field: "can_view" | "can_create" | "can_edit" | "can_delete", v: boolean) =>
    setMap((s) => ({ ...s, [k]: { ...s[k], [field]: v, ...(field === "can_view" && !v ? { can_create: false, can_edit: false, can_delete: false } : {}) } }));

  const bulk = (keys: ResellerModuleKey[], on: boolean) =>
    setMap((s) => {
      const next = { ...s };
      keys.forEach((k) => {
        const viewOnly = VIEW_ONLY_MODULES.includes(k) || k === "admin";
        next[k] = {
          permission_key: k, can_view: on,
          can_create: on && !viewOnly, can_edit: on && !viewOnly, can_delete: false,
        };
      });
      return next;
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{L({ bn: "রিসেলার অ্যাক্সেস", en: "Reseller Access" })}</h1>
          <p className="text-sm text-muted-foreground">
            {L({ bn: "প্রতিটি রিসেলারের মডিউল অনুমতি নিয়ন্ত্রণ করুন", en: "Control each reseller's module permissions" })}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row flex-wrap items-end justify-between gap-3">
          <div className="space-y-1.5 min-w-64">
            <Label className="text-xs text-muted-foreground">{L({ bn: "রিসেলার নির্বাচন", en: "Select Reseller" })}</Label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger><SelectValue placeholder={L({ bn: "রিসেলার", en: "Reseller" })} /></SelectTrigger>
              <SelectContent>
                {((listQ.data ?? []) as Array<{ id: string; name: string; username: string }>).map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name} ({r.username})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => bulk(RESELLER_MODULES, true)}>{L({ bn: "সব চালু", en: "Enable All" })}</Button>
            <Button size="sm" variant="outline" onClick={() => bulk(RESELLER_MODULES, false)}>{L({ bn: "সব বন্ধ", en: "Disable All" })}</Button>
            {RESELLER_MODULE_GROUPS.map((g) => (
              <Button key={g.id} size="sm" variant="secondary" onClick={() => bulk(g.keys, true)}>{L(g.label)}</Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {permQ.isLoading ? (
            <div className="grid place-items-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{L({ bn: "মডিউল", en: "Module" })}</TableHead>
                  <TableHead className="text-center">{L({ bn: "দেখা", en: "View" })}</TableHead>
                  <TableHead className="text-center">{L({ bn: "যোগ", en: "Create" })}</TableHead>
                  <TableHead className="text-center">{L({ bn: "এডিট", en: "Edit" })}</TableHead>
                  <TableHead className="text-center">{L({ bn: "ডিলিট", en: "Delete" })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {RESELLER_MODULES.map((k) => {
                  const viewOnly = VIEW_ONLY_MODULES.includes(k);
                  const restricted = k === "admin";
                  const p = map[k];
                  return (
                    <TableRow key={k}>
                      <TableCell className="font-medium">
                        {L(RESELLER_MODULE_LABELS[k])}
                        {restricted && <Badge variant="outline" className="ml-2 text-[10px]">{L({ bn: "সীমিত", en: "restricted" })}</Badge>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch checked={p.can_view} onCheckedChange={(v) => toggle(k, "can_view", v)} />
                      </TableCell>
                      {(["can_create", "can_edit", "can_delete"] as const).map((f) => (
                        <TableCell key={f} className="text-center">
                          {viewOnly || restricted ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <Switch checked={p[f]} disabled={!p.can_view} onCheckedChange={(v) => toggle(k, f, v)} />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          disabled={!selected || saveM.isPending}
          onClick={() => {
            if (confirm(L({ bn: "এই রিসেলারের পারমিশন আপডেট করবেন?", en: "Update permissions for this reseller?" }))) saveM.mutate();
          }}
        >
          {saveM.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {L({ bn: "পারমিশন সেভ করুন", en: "Save Permissions" })}
        </Button>
      </div>
    </div>
  );
}
