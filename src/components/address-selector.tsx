import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, ChevronsUpDown, Loader2, MapPin, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  createUnionFn, createPostOfficeFn, createVillageFn,
} from "@/lib/address.functions";

export type AddressValue = {
  division_id: number | null;
  district_id: number | null;
  upazila_id: number | null;
  union_id: string | null;
  post_office_id: string | null;
  village_id: string | null;
  area_id: string | null;
  road_id: string | null;
  building_id: string | null;
  mohalla: string | null;
  road_name: string | null;
  holding_no: string | null;
  address_line: string | null;
};

export const emptyAddress: AddressValue = {
  division_id: null, district_id: null, upazila_id: null,
  union_id: null, post_office_id: null, village_id: null,
  area_id: null, road_id: null, building_id: null,
  mohalla: null, road_name: null, holding_no: null, address_line: null,
};

type Row = { id: string | number; name: string; bn_name?: string | null };

const LABELS = {
  division: "বিভাগ", district: "জেলা", upazila: "উপজেলা",
  union: "ইউনিয়ন", post_office: "পোস্ট অফিস", village: "গ্রাম",
} as const;

/** Cascading Bangladesh address selector. Reset children when a parent changes. */
export function AddressSelector({
  value, onChange, disabled,
}: {
  value: AddressValue;
  onChange: (v: AddressValue) => void;
  disabled?: boolean;
}) {
  // ---------- level readers (RLS: anon SELECT allowed) ----------
  const divisions = useQuery({
    queryKey: ["addr", "divisions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("divisions").select("id,name,bn_name").order("name");
      if (error) throw error; return (data ?? []) as Row[];
    },
    staleTime: 10 * 60_000,
  });
  const districts = useQuery({
    queryKey: ["addr", "districts", value.division_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("districts")
        .select("id,name,bn_name").eq("division_id", value.division_id!).order("name");
      if (error) throw error; return (data ?? []) as Row[];
    },
    enabled: value.division_id != null,
    staleTime: 10 * 60_000,
  });
  const upazilas = useQuery({
    queryKey: ["addr", "upazilas", value.district_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("upazilas")
        .select("id,name,bn_name").eq("district_id", value.district_id!).order("name");
      if (error) throw error; return (data ?? []) as Row[];
    },
    enabled: value.district_id != null,
    staleTime: 10 * 60_000,
  });
  const unions = useQuery({
    queryKey: ["addr", "unions", value.upazila_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("unions")
        .select("id,name,bn_name").eq("upazila_id", value.upazila_id!).order("name");
      if (error) throw error; return (data ?? []) as Row[];
    },
    enabled: value.upazila_id != null,
    staleTime: 5 * 60_000,
  });
  const postOffices = useQuery({
    queryKey: ["addr", "post_offices", value.union_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("post_offices")
        .select("id,name,bn_name").eq("union_id", value.union_id!).order("name");
      if (error) throw error; return (data ?? []) as Row[];
    },
    enabled: value.union_id != null,
    staleTime: 5 * 60_000,
  });
  const villages = useQuery({
    queryKey: ["addr", "villages", value.post_office_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("villages")
        .select("id,name,bn_name").eq("post_office_id", value.post_office_id!).order("name");
      if (error) throw error; return (data ?? []) as Row[];
    },
    enabled: value.post_office_id != null,
    staleTime: 5 * 60_000,
  });

  // ---------- change helpers (auto-reset children) ----------
  const patch = (p: Partial<AddressValue>) => onChange({ ...value, ...p });
  const setDivision = (id: number | null) => patch({
    division_id: id, district_id: null, upazila_id: null, union_id: null,
    post_office_id: null, village_id: null,
  });
  const setDistrict = (id: number | null) => patch({
    district_id: id, upazila_id: null, union_id: null,
    post_office_id: null, village_id: null,
  });
  const setUpazila = (id: number | null) => patch({
    upazila_id: id, union_id: null, post_office_id: null, village_id: null,
  });
  const setUnion = (id: string | null) => patch({
    union_id: id, post_office_id: null, village_id: null,
  });
  const setPO = (id: string | null) => patch({ post_office_id: id, village_id: null });
  const setVillage = (id: string | null) => patch({ village_id: id });

  // ---------- auto-compose formatted address line ----------
  const composed = useMemo(() => composeAddress({
    holding: value.holding_no,
    road: value.road_name,
    mohalla: value.mohalla,
    village: pickName(villages.data, value.village_id),
    post_office: pickName(postOffices.data, value.post_office_id),
    union: pickName(unions.data, value.union_id),
    upazila: pickName(upazilas.data, value.upazila_id),
    district: pickName(districts.data, value.district_id),
    division: pickName(divisions.data, value.division_id),
  }), [
    value, villages.data,
    postOffices.data, unions.data, upazilas.data, districts.data, divisions.data,
  ]);

  useEffect(() => {
    if (composed && composed !== value.address_line) {
      onChange({ ...value, address_line: composed });
    }
  }, [composed]); // eslint-disable-line

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <PickField label={LABELS.division} icon rows={divisions.data} loading={divisions.isLoading}
          value={value.division_id} onSelect={(v) => setDivision(v as number | null)} disabled={disabled} />
        <PickField label={LABELS.district} rows={districts.data} loading={districts.isFetching}
          value={value.district_id} onSelect={(v) => setDistrict(v as number | null)}
          disabled={disabled || value.division_id == null} depHint="প্রথমে বিভাগ" />
        <PickField label={LABELS.upazila} rows={upazilas.data} loading={upazilas.isFetching}
          value={value.upazila_id} onSelect={(v) => setUpazila(v as number | null)}
          disabled={disabled || value.district_id == null} depHint="প্রথমে জেলা" />
        <PickField label={LABELS.union} rows={unions.data} loading={unions.isFetching}
          value={value.union_id} onSelect={(v) => setUnion(v as string | null)}
          disabled={disabled || value.upazila_id == null} depHint="প্রথমে উপজেলা"
          add={value.upazila_id ? { level: "union", parentId: value.upazila_id, onCreated: (r) => setUnion(String(r.id)) } : undefined} />
        <PickField label={LABELS.post_office} rows={postOffices.data} loading={postOffices.isFetching}
          value={value.post_office_id} onSelect={(v) => setPO(v as string | null)}
          disabled={disabled || value.union_id == null} depHint="প্রথমে ইউনিয়ন"
          add={value.union_id ? { level: "post_office", parentId: value.union_id, onCreated: (r) => setPO(String(r.id)) } : undefined} />
        <PickField label={LABELS.village} rows={villages.data} loading={villages.isFetching}
          value={value.village_id} onSelect={(v) => setVillage(v as string | null)}
          disabled={disabled || value.post_office_id == null} depHint="প্রথমে পোস্ট অফিস"
          add={value.post_office_id ? { level: "village", parentId: value.post_office_id, onCreated: (r) => setVillage(String(r.id)) } : undefined} />
      </div>

      {/* Optional free-text fields */}
      <div className="grid gap-3 sm:grid-cols-3 pt-1">
        <div className="space-y-1.5">
          <Label className="text-xs">মহল্লা / এরিয়া (ঐচ্ছিক)</Label>
          <Input value={value.mohalla ?? ""} disabled={disabled}
            onChange={(e) => patch({ mohalla: e.target.value || null })}
            placeholder="যেমন: পশ্চিমপাড়া" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">রোড / রাস্তা (ঐচ্ছিক)</Label>
          <Input value={value.road_name ?? ""} disabled={disabled}
            onChange={(e) => patch({ road_name: e.target.value || null })}
            placeholder="যেমন: মেইন রোড" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">হোল্ডিং / বিল্ডিং (ঐচ্ছিক)</Label>
          <Input value={value.holding_no ?? ""} disabled={disabled}
            onChange={(e) => patch({ holding_no: e.target.value || null })}
            placeholder="যেমন: বাসা #১২" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary" /> সম্পূর্ণ ঠিকানা
        </Label>
        <Input value={value.address_line ?? ""} disabled={disabled}
          onChange={(e) => onChange({ ...value, address_line: e.target.value })}
          placeholder="বাছাই করলে অটো তৈরি হবে (এডিটও করা যাবে)" />
      </div>
    </div>
  );
}

/* ============ Single-level searchable combobox ============ */

function PickField({
  label, rows, loading, value, onSelect, disabled, depHint, icon, add,
}: {
  label: string;
  rows: Row[] | undefined;
  loading: boolean;
  value: string | number | null;
  onSelect: (id: string | number | null) => void;
  disabled?: boolean;
  depHint?: string;
  icon?: boolean;
  add?: { level: AddLevel; parentId: string | number; onCreated: (r: Row) => void };
}) {
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const selected = rows?.find((r) => String(r.id) === String(value));

  return (
    <div className="space-y-1.5">
      <Label className="text-xs flex items-center gap-1.5">
        {icon && <MapPin className="h-3.5 w-3.5 text-primary" />}
        {label}
      </Label>
      <div className="flex gap-1">
        <Popover open={open} onOpenChange={(v) => !disabled && setOpen(v)}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" disabled={disabled}
              className={cn("flex-1 justify-between font-normal", !selected && "text-muted-foreground")}>
              <span className="truncate">
                {selected ? (selected.bn_name || selected.name) : (disabled ? (depHint ?? "নিষ্ক্রিয়") : `${label} বাছাই করুন`)}
              </span>
              {value != null ? (
                <X className="ml-2 h-3.5 w-3.5 opacity-70 hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); onSelect(null); }} />
              ) : (
                <ChevronsUpDown className="ml-2 h-3.5 w-3.5 opacity-50" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
            <Command>
              <CommandInput placeholder={`${label} সার্চ করুন...`} />
              <CommandList>
                {loading ? (
                  <div className="py-6 grid place-items-center"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
                ) : (
                  <>
                    <CommandEmpty>কিছু পাওয়া যায়নি।</CommandEmpty>
                    <CommandGroup>
                      {(rows ?? []).map((r) => (
                        <CommandItem key={r.id} value={`${r.name} ${r.bn_name ?? ""}`}
                          onSelect={() => { onSelect(r.id); setOpen(false); }}>
                          <Check className={cn("mr-2 h-4 w-4",
                            String(value) === String(r.id) ? "opacity-100" : "opacity-0")} />
                          <span className="truncate">{r.bn_name || r.name}</span>
                          {r.bn_name && <span className="ml-auto text-xs text-muted-foreground truncate">{r.name}</span>}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {add && (
          <Button type="button" variant="outline" size="icon" title="নতুন যোগ করুন"
            onClick={() => setAddOpen(true)} disabled={disabled}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
      {add && (
        <AddChildDialog open={addOpen} onOpenChange={setAddOpen}
          level={add.level} label={label} parentId={add.parentId}
          onCreated={(r) => { add.onCreated(r); setAddOpen(false); }} />
      )}
    </div>
  );
}

/* ============ Add-child dialog ============ */

type AddLevel = "union" | "post_office" | "village";

function AddChildDialog({
  open, onOpenChange, level, label, parentId, onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  level: AddLevel;
  label: string;
  parentId: string | number;
  onCreated: (r: Row) => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [bnName, setBnName] = useState("");

  const uFn = useServerFn(createUnionFn);
  const pFn = useServerFn(createPostOfficeFn);
  const vFn = useServerFn(createVillageFn);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["addr"] });

  const m = useMutation({
    mutationFn: async () => {
      const nm = name.trim();
      if (!nm) throw new Error("নাম দিন");
      switch (level) {
        case "union":       return uFn({ data: { upazila_id: Number(parentId), name: nm, bn_name: bnName || null } });
        case "post_office": return pFn({ data: { union_id: String(parentId), name: nm, bn_name: bnName || null } });
        case "village":     return vFn({ data: { post_office_id: String(parentId), name: nm, bn_name: bnName || null } });
      }
    },
    onSuccess: (r) => {
      toast.success(`${label} যোগ হয়েছে`);
      setName(""); setBnName("");
      invalidate();
      onCreated(r as Row);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>নতুন {label} যোগ করুন</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">নাম (English) *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">নাম (বাংলা)</Label>
            <Input value={bnName} onChange={(e) => setBnName(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>বাতিল</Button>
          <Button className="bg-gradient-primary text-white" onClick={() => m.mutate()} disabled={m.isPending}>
            {m.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} যোগ করুন
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============ helpers ============ */

function pickName(rows: Row[] | undefined, id: string | number | null): string | null {
  if (!rows || id == null) return null;
  const r = rows.find((x) => String(x.id) === String(id));
  return r ? (r.bn_name || r.name) : null;
}

export function composeAddress(parts: {
  building?: string | null; road?: string | null; area?: string | null;
  village?: string | null; post_office?: string | null; union?: string | null;
  upazila?: string | null; district?: string | null; division?: string | null;
}): string | null {
  const seq = [
    parts.building, parts.road, parts.area,
    parts.village && `${parts.village} গ্রাম`,
    parts.post_office && `${parts.post_office} পোস্ট অফিস`,
    parts.union && `${parts.union} ইউনিয়ন`,
    parts.upazila, parts.district, parts.division,
  ].filter(Boolean);
  return seq.length ? seq.join(", ") : null;
}
