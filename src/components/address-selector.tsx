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
import { createVillageFn } from "@/lib/address.functions";
import { useTx } from "@/hooks/use-i18n";

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

/** Cascading Bangladesh address selector. Reset children when a parent changes. */
export function AddressSelector({
  value, onChange, disabled,
}: {
  value: AddressValue;
  onChange: (v: AddressValue) => void;
  disabled?: boolean;
}) {
  const tx = useTx();

  // Village dropdown reads all villages (no parent filter).
  const villages = useQuery({
    queryKey: ["addr", "villages", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("villages").select("id,name,bn_name").order("name");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
    staleTime: 5 * 60_000,
  });

  const patch = (p: Partial<AddressValue>) => onChange({ ...value, ...p });
  const setVillage = (id: string | null) => patch({ village_id: id });

  const composed = useMemo(() => composeAddress({
    holding: value.holding_no,
    road: value.road_name,
    mohalla: value.mohalla,
    village: pickName(villages.data, value.village_id),
  }), [value, villages.data]);

  useEffect(() => {
    if (composed && composed !== value.address_line) {
      onChange({ ...value, address_line: composed });
    }
  }, [composed]); // eslint-disable-line

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <PickField
          label={tx("গ্রাম", "Village")} icon
          rows={villages.data} loading={villages.isLoading}
          value={value.village_id}
          onSelect={(v) => setVillage(v as string | null)}
          disabled={disabled}
          placeholderLabel={tx("গ্রাম বাছাই করুন", "Select village")}
          searchLabel={tx("গ্রাম সার্চ করুন...", "Search village...")}
          emptyLabel={tx("কিছু পাওয়া যায়নি।", "No results.")}
        />
        <div className="space-y-1.5">
          <Label className="text-xs">{tx("মহল্লা / এরিয়া (ঐচ্ছিক)", "Mohalla / Area (optional)")}</Label>
          <Input value={value.mohalla ?? ""} disabled={disabled}
            onChange={(e) => patch({ mohalla: e.target.value || null })}
            placeholder={tx("যেমন: পশ্চিমপাড়া", "e.g. Paschimpara")} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{tx("রোড / রাস্তা (ঐচ্ছিক)", "Road / Street (optional)")}</Label>
          <Input value={value.road_name ?? ""} disabled={disabled}
            onChange={(e) => patch({ road_name: e.target.value || null })}
            placeholder={tx("যেমন: মেইন রোড", "e.g. Main Road")} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{tx("হোল্ডিং / বিল্ডিং (ঐচ্ছিক)", "Holding / Building (optional)")}</Label>
          <Input value={value.holding_no ?? ""} disabled={disabled}
            onChange={(e) => patch({ holding_no: e.target.value || null })}
            placeholder={tx("যেমন: বাসা #১২", "e.g. House #12")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          {tx("সম্পূর্ণ ঠিকানা", "Full Address")}
        </Label>
        <Input value={value.address_line ?? ""} disabled={disabled}
          onChange={(e) => onChange({ ...value, address_line: e.target.value })}
          placeholder={tx(
            "বাছাই করলে অটো তৈরি হবে (এডিটও করা যাবে)",
            "Auto-generated from selections (editable)",
          )} />
      </div>
    </div>
  );
}

/* ============ Single-level searchable combobox ============ */

function PickField({
  label, rows, loading, value, onSelect, disabled, icon,
  placeholderLabel, searchLabel, emptyLabel,
}: {
  label: string;
  rows: Row[] | undefined;
  loading: boolean;
  value: string | number | null;
  onSelect: (id: string | number | null) => void;
  disabled?: boolean;
  icon?: boolean;
  placeholderLabel: string;
  searchLabel: string;
  emptyLabel: string;
}) {
  const [open, setOpen] = useState(false);
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
                {selected ? (selected.bn_name || selected.name) : placeholderLabel}
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
              <CommandInput placeholder={searchLabel} />
              <CommandList>
                {loading ? (
                  <div className="py-6 grid place-items-center"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
                ) : (
                  <>
                    <CommandEmpty>{emptyLabel}</CommandEmpty>
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
      </div>
    </div>
  );
}

/* ============ helpers ============ */

function pickName(rows: Row[] | undefined, id: string | number | null): string | null {
  if (!rows || id == null) return null;
  const r = rows.find((x) => String(x.id) === String(id));
  return r ? (r.bn_name || r.name) : null;
}

export function composeAddress(parts: {
  holding?: string | null; road?: string | null; mohalla?: string | null;
  village?: string | null; post_office?: string | null; union?: string | null;
  upazila?: string | null; district?: string | null; division?: string | null;
}): string | null {
  const seq = [
    parts.holding, parts.road, parts.mohalla,
    parts.village && `${parts.village} গ্রাম`,
    parts.post_office && `${parts.post_office} পোস্ট অফিস`,
    parts.union && `${parts.union} ইউনিয়ন`,
    parts.upazila, parts.district, parts.division,
  ].filter(Boolean);
  return seq.length ? seq.join(", ") : null;
}
