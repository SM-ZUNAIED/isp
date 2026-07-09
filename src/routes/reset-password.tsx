import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Eye, EyeOff, KeyRound, Loader2, Lock, ShieldCheck, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useI18n } from "@/hooks/use-i18n";
import { ThemeToggle, LangToggle } from "@/components/theme-lang-toggles";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "পাসওয়ার্ড রিসেট — Net Bill Pro" },
      { name: "description", content: "আপনার Net Bill Pro অ্যাকাউন্টের নতুন পাসওয়ার্ড সেট করুন।" },
    ],
  }),
  component: ResetPasswordPage,
});

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password is too long")
      .regex(/[A-Za-z]/, "Include at least one letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { lang } = useI18n();
  const bn = lang === "bn";

  const [ready, setReady] = useState(false);
  const [validLink, setValidLink] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  useEffect(() => {
    // Supabase v2 auto-processes the recovery hash on load and emits PASSWORD_RECOVERY.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setValidLink(true);
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setValidLink(true);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = passwordSchema.safeParse({ password, confirm });
    if (!parsed.success) {
      const fe: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as "password" | "confirm";
        if (!fe[key]) fe[key] = issue.message;
      }
      setErrors(fe);
      toast.error(bn ? "ফর্মে ত্রুটি আছে" : "Please fix the errors below");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setBusy(false);
    if (error) {
      toast.error(bn ? "পাসওয়ার্ড আপডেট ব্যর্থ" : "Could not update password", { description: error.message });
      return;
    }
    toast.success(bn ? "পাসওয়ার্ড আপডেট হয়েছে" : "Password updated", {
      description: bn ? "এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।" : "Please sign in with your new password.",
    });
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-secondary/25 blur-3xl" />
      </div>

      <header className="flex items-center justify-between px-4 py-4 md:px-8">
        <Link to="/" className="inline-flex items-center gap-2 rounded-full bg-success px-4 py-2 text-sm font-semibold text-success-foreground shadow-glow hover:brightness-110 transition-all">
          <ArrowLeft className="h-4 w-4" /> {bn ? "হোমে ফিরুন" : "Back to home"}
        </Link>
        <div className="flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-72px)] max-w-md items-center px-4 py-8">
        <div className="w-full rounded-3xl border bg-gradient-card p-6 shadow-elevated md:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <KeyRound className="h-6 w-6" />
            </div>
            <h1 className="mt-3 text-2xl font-bold">{bn ? "নতুন পাসওয়ার্ড সেট করুন" : "Set a new password"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {bn ? "কমপক্ষে ৮ অক্ষর, অন্তত একটি অক্ষর ও একটি সংখ্যা।" : "At least 8 characters, with a letter and a number."}
            </p>
          </div>

          {!ready ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !validLink ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
                <div className="font-semibold text-foreground">
                  {bn ? "লিংক অবৈধ অথবা মেয়াদোত্তীর্ণ" : "Invalid or expired link"}
                </div>
                <p className="mt-1 text-muted-foreground">
                  {bn
                    ? "রিসেট লিংকটি কাজ করছে না। অনুগ্রহ করে আবার রিসেট লিংক অনুরোধ করুন।"
                    : "This reset link no longer works. Please request a new one."}
                </p>
              </div>
              <Button asChild className="w-full h-11 bg-gradient-primary text-primary-foreground shadow-glow">
                <Link to="/auth">{bn ? "লগইনে ফিরুন" : "Back to login"}</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="new-pass" className="text-xs font-medium">
                  {bn ? "নতুন পাসওয়ার্ড" : "New password"}
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-pass"
                    type={show ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: undefined })); }}
                    placeholder={bn ? "কমপক্ষে ৮ অক্ষর" : "At least 8 characters"}
                    aria-invalid={!!errors.password}
                    className={`h-11 pl-10 pr-10 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs font-medium text-destructive">{errors.password}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-pass" className="text-xs font-medium">
                  {bn ? "পাসওয়ার্ড নিশ্চিত করুন" : "Confirm password"}
                </Label>
                <div className="relative">
                  <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-pass"
                    type={show ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); if (errors.confirm) setErrors((p) => ({ ...p, confirm: undefined })); }}
                    placeholder={bn ? "আবার লিখুন" : "Re-enter password"}
                    aria-invalid={!!errors.confirm}
                    className={`h-11 pl-10 ${errors.confirm ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                </div>
                {errors.confirm && <p className="text-xs font-medium text-destructive">{errors.confirm}</p>}
              </div>

              <Button type="submit" disabled={busy} className="w-full h-11 bg-gradient-primary text-primary-foreground shadow-glow">
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {bn ? "পাসওয়ার্ড আপডেট করুন" : "Update password"}
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
