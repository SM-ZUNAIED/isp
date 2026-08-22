import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, ImagePlus, KeyRound, Loader2, LogOut, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/hooks/use-i18n";
import { useLogoUrl } from "@/hooks/use-logo";
import { getSettings, updateSettings } from "@/lib/support.functions";

type Bn = { bn: string; en: string };

/** Shows the website logo stored in settings.logo_url. */
export function SiteLogo({ className }: { className?: string }) {
  const fetchSettings = useServerFn(getSettings);
  const q = useQuery({ queryKey: ["settings"], queryFn: () => fetchSettings(), staleTime: 60_000 });
  const { data: url } = useLogoUrl((q.data as { logo_url?: string | null } | null)?.logo_url ?? null);
  return (
    <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-full border bg-muted text-xs font-bold", className)}>
      {url ? <img src={url} alt="Logo" className="h-full w-full object-contain" /> : <UserRound className="h-4 w-4 text-muted-foreground" />}
    </span>
  );
}

function LogoDialog({ open, onOpenChange, L }: { open: boolean; onOpenChange: (v: boolean) => void; L: (b: Bn) => string }) {
  const qc = useQueryClient();
  const fetchSettings = useServerFn(getSettings);
  const saveSettings = useServerFn(updateSettings);
  const q = useQuery({ queryKey: ["settings"], queryFn: () => fetchSettings(), enabled: open });
  const current = (q.data as { logo_url?: string | null } | null)?.logo_url ?? null;
  const { data: url } = useLogoUrl(current);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["settings"] });
    qc.invalidateQueries({ queryKey: ["logo-url"] });
    qc.invalidateQueries({ queryKey: ["site-meta"] });
  };

  const save = useMutation({
    mutationFn: (logo_url: string | null) => saveSettings({ data: { logo_url } }),
    onSuccess: () => { refresh(); toast.success(L({ bn: "লোগো সংরক্ষিত হয়েছে", en: "Logo saved" })); },
    onError: (e: Error) => toast.error(L({ bn: "সংরক্ষণ ব্যর্থ", en: "Save failed" }), { description: e.message }),
  });

  const pick = async (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error(L({ bn: "শুধু ছবি আপলোড করুন", en: "Only images allowed" }));
    if (file.size > 2 * 1024 * 1024) return toast.error(L({ bn: "সর্বোচ্চ আকার ২ MB", en: "Max size 2 MB" }));
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("logos").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      if (current && !/^https?:\/\//i.test(current) && current !== path) {
        await supabase.storage.from("logos").remove([current]).catch(() => {});
      }
      await save.mutateAsync(path);
    } catch (e) {
      toast.error(L({ bn: "আপলোড ব্যর্থ", en: "Upload failed" }), { description: (e as Error).message });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{L({ bn: "ওয়েবসাইট লোগো", en: "Website Logo" })}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-xl border bg-muted">
            {url ? <img src={url} alt="Logo" className="h-full w-full object-contain" /> : <span className="text-xs text-muted-foreground">{L({ bn: "লোগো নেই", en: "No logo" })}</span>}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void pick(f); }}
          />
          <div className="flex gap-2">
            <Button onClick={() => fileRef.current?.click()} disabled={busy || save.isPending}>
              {busy || save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
              {L({ bn: "লোগো আপলোড", en: "Upload logo" })}
            </Button>
            {current && (
              <Button variant="outline" className="text-destructive" onClick={() => save.mutate(null)} disabled={save.isPending}>
                <Trash2 className="mr-2 h-4 w-4" />{L({ bn: "মুছুন", en: "Remove" })}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {L({ bn: "এই লোগোটি সম্পূর্ণ ওয়েবসাইট ও প্যানেলে ব্যবহৃত হবে (সর্বোচ্চ ২ MB)।", en: "This logo is used across the website and panels (max 2 MB)." })}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PasswordDialog({ open, onOpenChange, L }: { open: boolean; onOpenChange: (v: boolean) => void; L: (b: Bn) => string }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (pw.length < 6) return toast.error(L({ bn: "কমপক্ষে ৬ অক্ষর দিন", en: "Minimum 6 characters" }));
    if (pw !== pw2) return toast.error(L({ bn: "পাসওয়ার্ড মিলছে না", en: "Passwords do not match" }));
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(L({ bn: "পরিবর্তন ব্যর্থ", en: "Change failed" }), { description: error.message });
    toast.success(L({ bn: "পাসওয়ার্ড পরিবর্তিত হয়েছে", en: "Password changed" }));
    setPw(""); setPw2(""); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{L({ bn: "পাসওয়ার্ড পরিবর্তন", en: "Password Change" })}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{L({ bn: "নতুন পাসওয়ার্ড", en: "New password" })}</Label>
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{L({ bn: "আবার লিখুন", en: "Confirm password" })}</Label>
            <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
            {L({ bn: "সংরক্ষণ", en: "Save" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ProfileMenu({
  name,
  role,
  profileTo,
  onLogout,
  align = "end",
}: {
  name: string;
  role: Bn;
  profileTo: string;
  onLogout: () => void | Promise<void>;
  align?: "start" | "end";
}) {
  const { lang, toggle: toggleLang } = useI18n();
  const L = (b: Bn) => (lang === "en" ? b.en : b.bn);
  const [logoOpen, setLogoOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2 rounded-lg pl-1.5">
            <SiteLogo className="h-6 w-6" />
            <span className="max-w-24 truncate">{name}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="w-60 p-0">
          <div className="flex items-center gap-3 border-b p-3">
            <SiteLogo className="h-11 w-11" />
            <div className="min-w-0">
              <div className="truncate font-semibold">{name}</div>
              <div className="truncate text-xs text-muted-foreground">{L(role)}</div>
            </div>
          </div>
          <div className="p-1">
            <DropdownMenuItem asChild className="gap-3 py-2.5">
              <Link to={profileTo}>
                <UserRound className="h-4 w-4 text-primary" />
                {L({ bn: "আমার প্রোফাইল", en: "My Profile" })}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-3 py-2.5" onSelect={(e) => { e.preventDefault(); setLogoOpen(true); }}>
              <ImagePlus className="h-4 w-4 text-primary" />
              {L({ bn: "লোগো পরিবর্তন", en: "Change Logo" })}
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-3 py-2.5" onSelect={(e) => { e.preventDefault(); setPwOpen(true); }}>
              <KeyRound className="h-4 w-4 text-amber-500" />
              {L({ bn: "পাসওয়ার্ড পরিবর্তন", en: "Password Change" })}
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-3 py-2.5" onSelect={(e) => { e.preventDefault(); toggleLang(); }}>
              <span className="w-4 text-center text-xs font-bold">{lang === "bn" ? "EN" : "বাং"}</span>
              {L({ bn: "English", en: "বাংলা" })}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-3 py-2.5 text-destructive focus:text-destructive" onSelect={() => { void onLogout(); }}>
              <LogOut className="h-4 w-4" />
              {L({ bn: "লগআউট", en: "Logout" })}
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <LogoDialog open={logoOpen} onOpenChange={setLogoOpen} L={L} />
      <PasswordDialog open={pwOpen} onOpenChange={setPwOpen} L={L} />
    </>
  );
}
