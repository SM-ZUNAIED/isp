import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Pencil, Trash2, Loader2, Search, MapPin, Power, PowerOff,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTx, useI18n } from "@/hooks/use-i18n";

export const Route = createFileRoute("/_authenticated/admin/address")({
  head: () => ({ meta: [{ title: "Address Management — Net Bill Pro" }] }),
  component: AddressAdminPage,
});

type Level =
  | "divisions" | "districts" | "upazilas" | "unions"
  | "post_offices" | "villages" | "areas" | "roads" | "buildings";

const LEVELS: Array<{ key: Level; bn: string; en: string; parent?: Level; parentCol?: string }> = [
  { key: "villages", bn: "গ্রাম", en: "Village" },
  { key: "areas", bn: "এরিয়া", en: "Area", parent: "villages", parentCol: "village_id" },
  { key: "roads", bn: "রোড", en: "Road", parent: "areas", parentCol: "area_id" },
  { key: "buildings", bn: "বিল্ডিং", en: "Building", parent: "roads", parentCol: "road_id" },
];

const labelOf = (l: (typeof LEVELS)[number], lang: "bn" | "en") => (lang === "bn" ? l.bn : l.en);

type Row = {
  id: string | number;
  name: string;
  bn_name?: string | null;
  code?: string | null;
  is_active?: boolean;
  holding_number?: string | null;
  house_number?: string | null;
  floor_count?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  google_map_url?: string | null;
  [k: string]: unknown;
};

function AddressAdminPage() {
  const tx = useTx();
  const { lang } = useI18n();
  const [tab, setTab] = useState<Level>("villages");

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-white shadow-soft">
          <MapPin className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{tx("ঠিকানা ব্যবস্থাপনা", "Address Management")}</h1>
          <p className="text-muted-foreground text-sm">
            {tx(
              "বাংলাদেশের সম্পূর্ণ ঠিকানা স্তর (বিভাগ → বিল্ডিং) পরিচালনা করুন। নিচের যেকোনো স্তরে ক্লিক করে যোগ, এডিট, ডিলিট বা সক্রিয়/নিষ্ক্রিয় করুন।",
              "Manage the full address hierarchy of Bangladesh (Division → Building). Click any level below to add, edit, delete, or activate/deactivate items.",
            )}
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Level)}>
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList className="inline-flex w-max">
            {LEVELS.map((l) => (
              <TabsTrigger key={l.key} value={l.key} className="whitespace-nowrap">
                {labelOf(l, lang)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {LEVELS.map((l) => (
          <TabsContent key={l.key} value={l.key} className="mt-4">
            <LevelPanel level={l.key} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function LevelPanel({ level }: { level: Level }) {
  const tx = useTx();
  const { lang } = useI18n();
  const meta = LEVELS.find((l) => l.key === level)!;
  const chain = useMemo(() => {
    const c: Level[] = [];
    let cur: Level | undefined = meta.parent;
    while (cur) {
      c.unshift(cur);
      cur = LEVELS.find((x) => x.key === cur)?.parent;
    }
    return c;
  }, [meta]);

  const [parents, setParents] = useState<Record<string, string | number | "">>({});
  const parentValue = meta.parentCol ? parents[meta.parentCol] ?? "" : "";
  const [search, setSearch] = useState("");

  const setParent = (col: string, val: string | number | "") => {
    const idx = LEVELS.findIndex((l) => l.parentCol === col);
    setParents((prev) => {
      const next = { ...prev, [col]: val };
      for (let i = idx + 1; i < LEVELS.length; i++) {
        const c = LEVELS[i].parentCol;
        if (c) delete next[c];
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {chain.length > 0 && (
        <Card>
          <CardContent className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {chain.map((p) => {
              const pmeta = LEVELS.find((x) => x.key === p)!;
              const parentCol = pmeta.parentCol;
              const parentVal = parentCol ? parents[parentCol] ?? "" : "";
              const disabled = !!parentCol && !parentVal;
              return (
                <ParentSelect
                  key={p}
                  level={p}
                  label={labelOf(pmeta, lang)}
                  disabled={disabled}
                  parentCol={parentCol}
                  parentVal={parentVal || null}
                  value={LEVELS.find((x) => x.key === p)!.key
                    ? (parents[nextParentCol(p)!] ?? "") : ""}
                  selected={parents[nextParentCol(p)!] ?? ""}
                  onChange={(v) => setParent(nextParentCol(p)!, v)}
                />
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={tx("নাম দিয়ে খুঁজুন...", "Search by name...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <UpsertDialog
          level={level}
          parentCol={meta.parentCol}
          parentVal={parentValue || null}
        />
      </div>

      <RowsTable
        level={level}
        parentCol={meta.parentCol}
        parentVal={parentValue || null}
        search={search}
      />
    </div>
  );
}

function nextParentCol(l: Level): string | null {
  return LEVELS.find((x) => x.key === l)!.key === l
    ? LEVELS.find((x) => x.parent === l)?.parentCol ?? null
    : null;
}

function ParentSelect({
  level, label, disabled, parentCol, parentVal, selected, onChange,
}: {
  level: Level; label: string; disabled: boolean;
  parentCol: string | undefined; parentVal: string | number | null;
  value: string | number | ""; selected: string | number | "";
  onChange: (v: string | number | "") => void;
}) {
  const tx = useTx();
  const { lang } = useI18n();
  const q = useQuery({
    queryKey: ["addr-parent", level, parentCol, parentVal],
    enabled: !disabled,
    queryFn: async () => {
      let query = supabase.from(level).select("id, name, bn_name").order("name");
      if (parentCol && parentVal !== null && parentVal !== "") {
        query = query.eq(parentCol, parentVal as never);
      }
      const { data, error } = await query.limit(2000);
      if (error) throw error;
      return (data ?? []) as unknown as Array<{ id: string | number; name: string; bn_name: string | null }>;
    },
  });

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Select
        disabled={disabled}
        value={selected === "" ? "" : String(selected)}
        onValueChange={(v) => {
          if (v === "__clear__") return onChange("");
          const asNum = Number(v);
          onChange(!Number.isNaN(asNum) && String(asNum) === v ? asNum : v);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={
            disabled ? tx("উপরের স্তর নির্বাচন করুন", "Select parent level first")
            : q.isLoading ? tx("লোড হচ্ছে...", "Loading...")
            : tx("নির্বাচন করুন", "Select")
          } />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__clear__">{tx("সব দেখান", "Show all")}</SelectItem>
          {(q.data ?? []).map((r) => (
            <SelectItem key={String(r.id)} value={String(r.id)}>
              {lang === "bn" ? (r.bn_name || r.name) : (r.name || r.bn_name)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function RowsTable({
  level, parentCol, parentVal, search,
}: {
  level: Level; parentCol: string | undefined;
  parentVal: string | number | null; search: string;
}) {
  const qc = useQueryClient();
  const tx = useTx();
  const { lang } = useI18n();
  const q = useQuery({
    queryKey: ["addr-rows", level, parentCol, parentVal, search],
    queryFn: async () => {
      let query = supabase.from(level).select("*").order("name").limit(500);
      if (parentCol && parentVal !== null && parentVal !== "") {
        query = query.eq(parentCol, parentVal as never);
      }
      if (search.trim()) {
        const s = `%${search.trim()}%`;
        query = query.or(`name.ilike.${s},bn_name.ilike.${s}`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Row[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["addr-rows", level] });

  const toggleMut = useMutation({
    mutationFn: async (r: Row) => {
      const { error } = await supabase
        .from(level).update({ is_active: !r.is_active } as never).eq("id", r.id as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success(tx("স্ট্যাটাস পরিবর্তন হয়েছে", "Status updated")); invalidate(); },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });

  const delMut = useMutation({
    mutationFn: async (id: string | number) => {
      const { error } = await supabase.from(level).delete().eq("id", id as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success(tx("মুছে ফেলা হয়েছে", "Deleted")); invalidate(); },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), {
      description: e.message.includes("foreign")
        ? tx("এর অধীনে সাব-এলাকা আছে, আগে সেগুলো মুছে ফেলুন", "It has sub-locations; delete them first")
        : e.message,
    }),
  });

  if (q.isLoading) {
    return <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  const rows = q.data ?? [];
  if (rows.length === 0) {
    return (
      <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">
        {tx('কোনো ডেটা পাওয়া যায়নি। উপরে "নতুন যোগ করুন" ক্লিক করুন।', 'No data found. Click "Add new" above.')}
      </CardContent></Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0 divide-y">
        {rows.map((r) => (
          <div key={String(r.id)} className="flex items-center gap-3 p-3 sm:p-4 hover:bg-muted/40 transition">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-muted-foreground">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">
                {lang === "bn" ? (r.bn_name || r.name) : (r.name || r.bn_name)}
                {r.bn_name && r.name && (
                  <span className="text-muted-foreground font-normal ml-2 text-xs">
                    ({lang === "bn" ? r.name : r.bn_name})
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground truncate flex items-center gap-2 flex-wrap">
                {r.code && <span>{tx("কোড", "Code")}: {r.code}</span>}
                {level === "buildings" && r.holding_number && <span>{tx("হোল্ডিং", "Holding")}: {r.holding_number}</span>}
                {level === "buildings" && r.house_number && <span>{tx("বাসা", "House")}: {r.house_number}</span>}
                {typeof r.latitude === "number" && <span>{r.latitude?.toFixed(4)}, {r.longitude?.toFixed(4)}</span>}
              </div>
            </div>
            <Badge variant={r.is_active === false ? "secondary" : "default"} className="hidden sm:inline-flex">
              {r.is_active === false ? tx("নিষ্ক্রিয়", "Inactive") : tx("সক্রিয়", "Active")}
            </Badge>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" title={tx("সক্রিয়/নিষ্ক্রিয়", "Activate/Deactivate")}
                onClick={() => toggleMut.mutate(r)} disabled={toggleMut.isPending}>
                {r.is_active === false ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
              </Button>
              <UpsertDialog level={level} parentCol={LEVELS.find(l => l.key === level)!.parentCol} parentVal={null} editRow={r} />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{tx("মুছে ফেলবেন?", "Delete?")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {tx(
                        `"${r.bn_name || r.name}" মুছে ফেলা হবে। এর অধীনে কোনো সাব-এলাকা থাকলে ব্যর্থ হবে।`,
                        `"${r.name || r.bn_name}" will be deleted. It will fail if sub-locations exist.`,
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{tx("বাতিল", "Cancel")}</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground"
                      onClick={() => delMut.mutate(r.id)}>{tx("মুছে ফেলুন", "Delete")}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function UpsertDialog({
  level, parentCol, parentVal, editRow,
}: {
  level: Level; parentCol: string | undefined;
  parentVal: string | number | null; editRow?: Row;
}) {
  const qc = useQueryClient();
  const tx = useTx();
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  const isEdit = !!editRow;

  const [name, setName] = useState(editRow?.name ?? "");
  const [bnName, setBnName] = useState(editRow?.bn_name ?? "");
  const [code, setCode] = useState(editRow?.code ?? "");
  const [manualId, setManualId] = useState(
    editRow && typeof editRow.id === "number" ? String(editRow.id) : "",
  );
  const [holding, setHolding] = useState(editRow?.holding_number ?? "");
  const [house, setHouse] = useState(editRow?.house_number ?? "");
  const [lat, setLat] = useState(editRow?.latitude != null ? String(editRow.latitude) : "");
  const [lng, setLng] = useState(editRow?.longitude != null ? String(editRow.longitude) : "");
  const [mapUrl, setMapUrl] = useState(editRow?.google_map_url ?? "");

  const numericIdTable = level === "divisions" || level === "districts" || level === "upazilas";
  const needsParent = !!parentCol;

  const reset = () => {
    setName(editRow?.name ?? ""); setBnName(editRow?.bn_name ?? "");
    setCode(editRow?.code ?? ""); setManualId(editRow && typeof editRow.id === "number" ? String(editRow.id) : "");
    setHolding(editRow?.holding_number ?? ""); setHouse(editRow?.house_number ?? "");
    setLat(editRow?.latitude != null ? String(editRow.latitude) : "");
    setLng(editRow?.longitude != null ? String(editRow.longitude) : "");
    setMapUrl(editRow?.google_map_url ?? "");
  };

  const mut = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = { name: name.trim() };
      if (bnName.trim()) payload.bn_name = bnName.trim(); else payload.bn_name = null;
      if (["divisions","districts","upazilas","unions","post_offices"].includes(level)) {
        payload.code = code.trim() || null;
      }
      if (level === "buildings") {
        payload.holding_number = holding.trim() || null;
        payload.house_number = house.trim() || null;
        payload.google_map_url = mapUrl.trim() || null;
      }
      if (["unions","areas","roads","buildings","upazilas","districts","villages"].includes(level)) {
        payload.latitude = lat.trim() ? Number(lat) : null;
        payload.longitude = lng.trim() ? Number(lng) : null;
      }

      if (isEdit) {
        const { error } = await supabase.from(level).update(payload as never).eq("id", editRow!.id as never);
        if (error) throw error;
      } else {
        if (needsParent) {
          if (parentVal === null || parentVal === "") throw new Error(tx("প্যারেন্ট নির্বাচন করুন (উপরে ফিল্টার সেট করুন)", "Select parent (set filter above)"));
          payload[parentCol!] = parentVal;
        }
        if (numericIdTable) {
          const id = Number(manualId);
          if (!id || Number.isNaN(id)) throw new Error(tx("সংখ্যাসূচক ID দিন", "Enter a numeric ID"));
          payload.id = id;
        }
        const { error } = await supabase.from(level).insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? tx("আপডেট হয়েছে", "Updated") : tx("যোগ হয়েছে", "Added"));
      qc.invalidateQueries({ queryKey: ["addr-rows", level] });
      qc.invalidateQueries({ queryKey: ["addr-parent"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(tx("ব্যর্থ", "Failed"), { description: e.message }),
  });

  const levelLabel = labelOf(LEVELS.find((l) => l.key === level)!, lang);

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) reset(); }}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button>
        ) : (
          <Button className="bg-gradient-primary text-white shadow-soft">
            <Plus className="mr-2 h-4 w-4" /> {tx("নতুন যোগ করুন", "Add new")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? tx("এডিট করুন", "Edit") : tx("নতুন যোগ করুন", "Add new")} — {levelLabel}
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}>
          {!isEdit && needsParent && (
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              {tx("প্যারেন্ট", "Parent")}: <b>{parentVal ? String(parentVal) : tx("নির্বাচিত নয় — উপরে ক্যাসকেড ফিল্টারে সিলেক্ট করুন", "Not selected — pick from cascade filter above")}</b>
            </div>
          )}
          {!isEdit && numericIdTable && (
            <div className="space-y-1.5">
              <Label>{tx("ID (সংখ্যা) *", "ID (number) *")}</Label>
              <Input required inputMode="numeric" value={manualId}
                onChange={(e) => setManualId(e.target.value.replace(/\D/g, ""))} placeholder={tx("যেমন: 65", "e.g. 65")} />
              <p className="text-xs text-muted-foreground">
                {tx("Bangladesh geo-code (BBS) ID ব্যবহার করুন যাতে অন্য সিস্টেমের সাথে ম্যাপ হয়।",
                    "Use the Bangladesh geo-code (BBS) ID so it maps to other systems.")}
              </p>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{tx("English নাম *", "English name *")}</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{tx("বাংলা নাম", "Bangla name")}</Label>
              <Input value={bnName ?? ""} onChange={(e) => setBnName(e.target.value)} />
            </div>
          </div>

          {["divisions","districts","upazilas","unions","post_offices"].includes(level) && (
            <div className="space-y-1.5">
              <Label>{tx("কোড (ঐচ্ছিক)", "Code (optional)")}</Label>
              <Input value={code ?? ""} onChange={(e) => setCode(e.target.value)} />
            </div>
          )}

          {level === "buildings" && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{tx("হোল্ডিং নম্বর", "Holding No.")}</Label>
                <Input value={holding ?? ""} onChange={(e) => setHolding(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{tx("বাসা নম্বর", "House No.")}</Label>
                <Input value={house ?? ""} onChange={(e) => setHouse(e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Google Map URL</Label>
                <Input value={mapUrl ?? ""} onChange={(e) => setMapUrl(e.target.value)} placeholder="https://maps.google.com/..." />
              </div>
            </div>
          )}

          {["unions","areas","roads","buildings","upazilas","districts","villages"].includes(level) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Latitude</Label>
                <Input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="23.8103" />
              </div>
              <div className="space-y-1.5">
                <Label>Longitude</Label>
                <Input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="90.4125" />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{tx("বাতিল", "Cancel")}</Button>
            <Button type="submit" className="bg-gradient-primary text-white" disabled={mut.isPending}>
              {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? tx("সংরক্ষণ", "Save") : tx("যোগ করুন", "Add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
