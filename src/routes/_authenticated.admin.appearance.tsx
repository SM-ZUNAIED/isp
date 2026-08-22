import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, Palette, RotateCcw, Save, Sun, Moon, MousePointerClick, Type, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { getSettings, updateSettings } from "@/lib/support.functions";
import {
  DEFAULT_PRESET_ID,
  FONT_OPTIONS,
  THEME_PRESETS,
  buildThemeCss,
  isValidHex,
  resolveColors,
  type ThemeColors,
  type ThemeConfig,
} from "@/lib/theme-presets";

export const Route = createFileRoute("/_authenticated/admin/appearance")({
  component: AppearancePage,
});

const COLOR_FIELDS: Array<{ key: keyof ThemeColors; bn: string; en: string }> = [
  { key: "primary", bn: "প্রাইমারি", en: "Primary" },
  { key: "accent", bn: "অ্যাকসেন্ট", en: "Accent" },
  { key: "background", bn: "ব্যাকগ্রাউন্ড", en: "Background" },
  { key: "foreground", bn: "ফোরগ্রাউন্ড", en: "Foreground" },
  { key: "card", bn: "কার্ড", en: "Card" },
  { key: "muted", bn: "মিউটেড", en: "Muted" },
  { key: "border", bn: "বর্ডার", en: "Border" },
];

function AppearancePage() {
  const { lang } = useI18n();
  const T = (bn: string, en: string) => (lang === "en" ? en : bn);
  const qc = useQueryClient();
  const fetchSettings = useServerFn(getSettings);
  const saveSettings = useServerFn(updateSettings);

  const settingsQ = useQuery({ queryKey: ["settings"], queryFn: () => fetchSettings() });
  const landing = (settingsQ.data?.landing_content ?? {}) as Record<string, unknown>;
  const savedTheme = (landing?.["theme"] ?? null) as ThemeConfig | null;

  const [cfg, setCfg] = useState<ThemeConfig>({ preset: DEFAULT_PRESET_ID });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (savedTheme) setCfg(savedTheme);
  }, [settingsQ.dataUpdatedAt]);

  // Live preview: apply current draft to the whole app while editing.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.getElementById("app-theme-vars") as HTMLStyleElement | null;
    if (el) el.textContent = buildThemeCss(cfg);
  }, [cfg]);

  const light = useMemo(() => resolveColors(cfg, "light"), [cfg]);
  const dark = useMemo(() => resolveColors(cfg, "dark"), [cfg]);

  const setColor = (mode: "light" | "dark", key: keyof ThemeColors, value: string) =>
    setCfg((c) => ({ ...c, [mode]: { ...(c[mode] ?? {}), [key]: value } }));

  async function save() {
    setSaving(true);
    try {
      await saveSettings({ data: { landing_content: { ...landing, theme: cfg } } as never });
      await qc.invalidateQueries({ queryKey: ["settings"] });
      await qc.invalidateQueries({ queryKey: ["app-theme"] });
      await qc.invalidateQueries({ queryKey: ["landing"] });
      toast.success(T("থিম সেভ হয়েছে — সব প্যানেলে প্রয়োগ হলো", "Theme saved — applied everywhere"));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setCfg({ preset: DEFAULT_PRESET_ID });
    toast.info(T("ডিফল্টে রিসেট করা হয়েছে (সেভ করুন)", "Reset to defaults (remember to save)"));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{T("অ্যাপিয়ারেন্স", "Appearance")}</h1>
          <p className="text-muted-foreground">
            {T("পুরো ওয়েবসাইট ও সব প্যানেলের রঙ ও ডিজাইন কাস্টমাইজ করুন।", "Customize colors and design across the whole site and every panel.")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset}><RotateCcw className="mr-2 h-4 w-4" />{T("রিসেট", "Reset to Defaults")}</Button>
          <Button onClick={save} disabled={saving} className="bg-gradient-primary text-white">
            <Save className="mr-2 h-4 w-4" />{saving ? T("সেভ হচ্ছে…", "Saving…") : T("সেভ করুন", "Save Changes")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" />{T("কুইক থিম প্রিসেট", "Quick Theme Presets")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {T("একটি প্রিসেট বাছুন — লাইট ও ডার্ক দুই মোডের সম্পূর্ণ প্যালেট প্রয়োগ হবে।", "Pick a preset to instantly apply a complete palette for both light & dark modes.")}
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {THEME_PRESETS.map((p) => {
            const active = (cfg.preset ?? DEFAULT_PRESET_ID) === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setCfg({ ...cfg, preset: p.id, light: {}, dark: {} })}
                className={cn(
                  "relative rounded-xl border p-3 text-left transition hover:shadow-soft",
                  active ? "border-primary ring-2 ring-primary/30 bg-primary/5" : "bg-card",
                )}
              >
                {active && <Check className="absolute right-2 top-2 h-4 w-4 text-primary" />}
                <div className="mb-2 flex gap-1.5">
                  {[p.light.primary, p.light.accent, p.light.background, p.dark.background].map((c, i) => (
                    <span key={i} className="h-5 w-5 rounded-md border" style={{ background: c }} />
                  ))}
                </div>
                <div className="text-sm font-medium">{p.emoji} {p.name}</div>
                <div className="mt-2 h-1.5 rounded-full" style={{ background: `linear-gradient(90deg, ${p.light.primary}, ${p.light.accent})` }} />
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Tabs defaultValue="light">
        <TabsList>
          <TabsTrigger value="light"><Sun className="mr-1.5 h-4 w-4" />{T("লাইট", "Light")}</TabsTrigger>
          <TabsTrigger value="dark"><Moon className="mr-1.5 h-4 w-4" />{T("ডার্ক", "Dark")}</TabsTrigger>
          <TabsTrigger value="buttons"><MousePointerClick className="mr-1.5 h-4 w-4" />{T("বাটন", "Buttons")}</TabsTrigger>
          <TabsTrigger value="typography"><Type className="mr-1.5 h-4 w-4" />{T("টাইপোগ্রাফি", "Typography")}</TabsTrigger>
          <TabsTrigger value="layout"><LayoutGrid className="mr-1.5 h-4 w-4" />{T("লেআউট", "Layout")}</TabsTrigger>
        </TabsList>

        {(["light", "dark"] as const).map((mode) => {
          const resolved = mode === "light" ? light : dark;
          return (
            <TabsContent key={mode} value={mode}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {mode === "light" ? T("লাইট রঙ ফাইন-টিউন", "Fine-Tune Light Colors") : T("ডার্ক রঙ ফাইন-টিউন", "Fine-Tune Dark Colors")}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {T("আলাদা রঙ ম্যানুয়ালি সেট করুন। খালি রাখলে প্রিসেটের রঙ থাকবে।", "Manually adjust individual colors. Leave empty for preset defaults.")}
                  </p>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="rounded-xl border p-4" style={{ background: resolved.background, color: resolved.foreground }}>
                    <div className="mb-3 flex h-2 overflow-hidden rounded-full">
                      {[resolved.primary, resolved.accent, resolved.muted, resolved.foreground, resolved.border].map((c, i) => (
                        <span key={i} className="flex-1" style={{ background: c }} />
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg px-3 py-1.5 text-sm font-medium" style={{ background: resolved.primary, color: "#fff" }}>
                        {T("বাটন", "Button")}
                      </span>
                      <span className="rounded-lg border px-3 py-1.5 text-sm" style={{ background: resolved.card, borderColor: resolved.border }}>
                        {T("কার্ড প্রিভিউ", "Card preview")}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {COLOR_FIELDS.map((f) => {
                      const val = (cfg[mode]?.[f.key] ?? "") as string;
                      return (
                        <div key={f.key} className="space-y-1.5">
                          <Label>{T(f.bn, f.en)}</Label>
                          <div className="flex items-center gap-2 rounded-lg border px-2">
                            <input
                              type="color"
                              value={isValidHex(val) ? val : resolved[f.key as keyof typeof resolved]}
                              onChange={(e) => setColor(mode, f.key, e.target.value.toUpperCase())}
                              className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                              aria-label={f.en}
                            />
                            <Input
                              value={val}
                              placeholder={resolved[f.key as keyof typeof resolved]}
                              onChange={(e) => setColor(mode, f.key, e.target.value)}
                              className="border-0 font-mono text-xs shadow-none focus-visible:ring-0"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}

        <TabsContent value="buttons">
          <Card>
            <CardHeader><CardTitle className="text-base">{T("বাটন স্টাইল", "Button Style")}</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>{T("বাটন কর্নার রেডিয়াস", "Button corner radius")}: {(cfg.buttonRadius ?? 0.625).toFixed(3)}rem</Label>
                <input
                  type="range" min={0} max={2} step={0.125}
                  value={cfg.buttonRadius ?? 0.625}
                  onChange={(e) => setCfg({ ...cfg, buttonRadius: Number(e.target.value) })}
                  className="w-full accent-[var(--primary)]"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button className="bg-gradient-primary text-white">{T("প্রাইমারি", "Primary")}</Button>
                <Button variant="outline">{T("আউটলাইন", "Outline")}</Button>
                <Button variant="secondary">{T("সেকেন্ডারি", "Secondary")}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography">
          <Card>
            <CardHeader><CardTitle className="text-base">{T("টাইপোগ্রাফি", "Typography")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>{T("ফন্ট ফ্যামিলি", "Font family")}</Label>
                <select
                  value={cfg.fontFamily ?? "Anek Bangla"}
                  onChange={(e) => setCfg({ ...cfg, fontFamily: e.target.value })}
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                >
                  {FONT_OPTIONS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </div>
              <p className="text-2xl font-bold" style={{ fontFamily: `"${cfg.fontFamily ?? "Anek Bangla"}", sans-serif` }}>
                {T("নমুনা লেখা — Net Bill Pro", "Sample heading — Net Bill Pro")}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout">
          <Card>
            <CardHeader><CardTitle className="text-base">{T("লেআউট", "Layout")}</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>{T("গ্লোবাল কর্নার রেডিয়াস", "Global corner radius")}: {(cfg.radius ?? 0.875).toFixed(3)}rem</Label>
                <input
                  type="range" min={0} max={2} step={0.125}
                  value={cfg.radius ?? 0.875}
                  onChange={(e) => setCfg({ ...cfg, radius: Number(e.target.value) })}
                  className="w-full accent-[var(--primary)]"
                />
              </div>
              <div className="space-y-2">
                <Label>{T("কনটেইনার প্রস্থ", "Container width")}: {cfg.containerWidth ?? 1280}px</Label>
                <input
                  type="range" min={1024} max={1680} step={16}
                  value={cfg.containerWidth ?? 1280}
                  onChange={(e) => setCfg({ ...cfg, containerWidth: Number(e.target.value) })}
                  className="w-full accent-[var(--primary)]"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
