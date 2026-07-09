import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Loader2, LogIn, UserPlus, Wifi, Mail, Lock, User, Phone,
  Eye, EyeOff, ShieldCheck, Zap, HeadphonesIcon, ArrowLeft, KeyRound,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useI18n } from "@/hooks/use-i18n";
import { ThemeToggle, LangToggle } from "@/components/theme-lang-toggles";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "লগইন / সাইন আপ — Net Bill Pro" },
      { name: "description", content: "Net Bill Pro অ্যাডমিন ও কাস্টমার পোর্টাল লগইন।" },
    ],
  }),
  component: AuthPage,
});

async function routeAfterLogin(userId: string): Promise<"/admin" | "/customer"> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const roles = (data ?? []).map((r) => r.role);
  if (roles.includes("admin") || roles.includes("staff")) return "/admin";
  return "/customer";
}

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const { lang } = useI18n();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");

  useEffect(() => {
    if (!loading && session) {
      routeAfterLogin(session.user.id).then((to) => navigate({ to }));
    }
  }, [loading, session, navigate]);

  const bn = lang === "bn";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-primary/25 blur-3xl animate-float" />
        <div className="absolute top-1/3 -right-40 h-[520px] w-[520px] rounded-full bg-secondary/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-accent/15 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] [background-size:56px_56px]" />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-4 py-4 md:px-8">
        <Link to="/" className="inline-flex items-center gap-2 rounded-full bg-success px-4 py-2 text-sm font-semibold text-success-foreground shadow-glow hover:brightness-110 hover:-translate-x-0.5 transition-all">
          <ArrowLeft className="h-4 w-4" /> {bn ? "হোমে ফিরুন" : "Back to home"}
        </Link>
        <div className="flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
        </div>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-72px)] max-w-6xl grid-cols-1 items-center gap-10 px-4 py-8 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-8">
        {/* Brand / features panel */}
        <section className="hidden lg:block animate-fade-in-up">
          <Link to="/" className="inline-flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
              <Wifi className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <div className="text-2xl font-extrabold tracking-tight">Net Bill Pro</div>
              <div className="text-xs text-muted-foreground">
                {bn ? "আপনার ISP এর সম্পূর্ণ ম্যানেজমেন্ট" : "Complete ISP management suite"}
              </div>
            </div>
          </Link>

          <h1 className="mt-8 text-4xl xl:text-5xl font-extrabold leading-tight">
            {bn ? (
              <>
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">দ্রুত</span>,
                নিরাপদ ও <br /> সহজ ISP পোর্টাল
              </>
            ) : (
              <>
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">Fast</span>,
                secure & simple <br /> ISP portal
              </>
            )}
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            {bn
              ? "কাস্টমার হিসেবে বিল দেখুন ও পরিশোধ করুন। অ্যাডমিন হিসেবে পুরো ব্যবসা পরিচালনা করুন — এক প্ল্যাটফর্মে।"
              : "Pay your bill as a customer, or manage the whole ISP as an admin — all in one place."}
          </p>

          <ul className="mt-8 space-y-4">
            {[
              { Icon: Zap, t: bn ? "তাৎক্ষণিক সংযোগ অ্যাক্টিভেশন" : "Instant connection activation" },
              { Icon: ShieldCheck, t: bn ? "SSL এনক্রিপ্টেড ও নিরাপদ লগইন" : "SSL-encrypted secure login" },
              { Icon: HeadphonesIcon, t: bn ? "২৪/৭ কাস্টমার সাপোর্ট" : "24/7 customer support" },
            ].map(({ Icon, t }, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="pt-1.5 text-sm font-medium">{t}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Form card */}
        <section className="mx-auto w-full max-w-md animate-fade-in-up">
          {/* Mobile brand mini */}
          <Link to="/" className="mb-6 flex items-center justify-center gap-2 lg:hidden hover:opacity-80 transition-opacity">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
              <Wifi className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-extrabold">Net Bill Pro</span>
          </Link>

          <div className="rounded-3xl border bg-gradient-card p-6 shadow-elevated md:p-8">
            {mode === "forgot" ? (
              <ForgotForm onBack={() => setMode("login")} />
            ) : (
              <>
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-bold">
                    {mode === "login"
                      ? bn ? "স্বাগতম" : "Welcome back"
                      : bn ? "অ্যাকাউন্ট তৈরি করুন" : "Create your account"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {mode === "login"
                      ? bn ? "আপনার পোর্টালে প্রবেশ করুন" : "Sign in to your portal"
                      : bn ? "কয়েক সেকেন্ডে শুরু করুন" : "Get started in seconds"}
                  </p>
                </div>

                <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">{bn ? "লগইন" : "Login"}</TabsTrigger>
                    <TabsTrigger value="signup">{bn ? "সাইন আপ" : "Sign up"}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="login" className="mt-5">
                    <LoginForm onForgot={() => setMode("forgot")} />
                  </TabsContent>
                  <TabsContent value="signup" className="mt-5">
                    <SignupForm onDone={() => setMode("login")} />
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            {bn
              ? "প্রথম সাইন আপকারী স্বয়ংক্রিয়ভাবে ISP মালিক (Admin) হবেন, পরবর্তীরা কাস্টমার।"
              : "The first signup becomes the ISP owner (Admin); everyone else joins as a customer."}
          </p>
        </section>
      </main>
    </div>
  );
}

/* ---------- Login ---------- */
function LoginForm({ onForgot }: { onForgot: () => void }) {
  const navigate = useNavigate();
  const { lang } = useI18n();
  const bn = lang === "bn";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setBusy(false);
      toast.error(bn ? "লগইন ব্যর্থ" : "Login failed", { description: error.message });
      return;
    }
    toast.success(bn ? "সফলভাবে লগইন হয়েছে" : "Signed in successfully");
    const to = await routeAfterLogin(data.user.id);
    setBusy(false);
    navigate({ to });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <IconField id="l-email" icon={Mail} label={bn ? "ইমেইল" : "Email"}>
        <Input
          id="l-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="owner@example.com"
          className="h-11 pl-10"
        />
      </IconField>

      <IconField
        id="l-pass"
        icon={Lock}
        label={bn ? "পাসওয়ার্ড" : "Password"}
        right={
          <button
            type="button"
            aria-label="Show password"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
      >
        <Input
          id="l-pass"
          type={show ? "text" : "password"}
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="h-11 pl-10 pr-10"
        />
      </IconField>

      <div className="flex justify-end">
        <button type="button" onClick={onForgot} className="text-xs font-medium text-primary hover:underline">
          {bn ? "পাসওয়ার্ড ভুলে গেছেন?" : "Forgot password?"}
        </button>
      </div>

      <Button type="submit" disabled={busy} className="w-full h-11 text-base bg-gradient-primary text-primary-foreground shadow-glow">
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
        {bn ? "লগইন করুন" : "Sign in"}
      </Button>
    </form>
  );
}

/* ---------- Signup ---------- */
function SignupForm({ onDone }: { onDone: () => void }) {
  const { lang } = useI18n();
  const bn = lang === "bn";
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile && !/^01[3-9]\d{8}$/.test(mobile)) {
      return toast.error(bn ? "সঠিক মোবাইল নম্বর দিন" : "Enter a valid mobile number");
    }
    if (password.length < 6) {
      return toast.error(bn ? "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর" : "Password must be at least 6 characters");
    }
    setBusy(true);
    const redirectTo = `${window.location.origin}/auth`;
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: { full_name: fullName.trim(), mobile: mobile.trim() || null },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(bn ? "সাইন আপ ব্যর্থ" : "Signup failed", { description: error.message });
      return;
    }
    toast.success(bn ? "অ্যাকাউন্ট তৈরি হয়েছে" : "Account created", {
      description: bn ? "এখন লগইন করুন।" : "You can log in now.",
    });
    onDone();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <IconField id="s-name" icon={User} label={bn ? "পূর্ণ নাম" : "Full name"}>
        <Input
          id="s-name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={bn ? "আপনার নাম" : "Your name"}
          className="h-11 pl-10"
        />
      </IconField>

      <IconField id="s-mobile" icon={Phone} label={bn ? "মোবাইল" : "Mobile"}>
        <Input
          id="s-mobile"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          inputMode="numeric"
          maxLength={11}
          placeholder="01XXXXXXXXX"
          className="h-11 pl-10 tracking-wider"
        />
      </IconField>

      <IconField id="s-email" icon={Mail} label={bn ? "ইমেইল" : "Email"}>
        <Input
          id="s-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="h-11 pl-10"
        />
      </IconField>

      <IconField
        id="s-pass"
        icon={Lock}
        label={bn ? "পাসওয়ার্ড" : "Password"}
        right={
          <button
            type="button"
            aria-label="Show password"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
      >
        <Input
          id="s-pass"
          type={show ? "text" : "password"}
          required
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={bn ? "কমপক্ষে ৬ অক্ষর" : "At least 6 characters"}
          className="h-11 pl-10 pr-10"
        />
      </IconField>

      <Button type="submit" disabled={busy} className="w-full h-11 text-base bg-gradient-primary text-primary-foreground shadow-glow">
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
        {bn ? "অ্যাকাউন্ট তৈরি করুন" : "Create account"}
      </Button>
    </form>
  );
}

/* ---------- Forgot ---------- */
function ForgotForm({ onBack }: { onBack: () => void }) {
  const { lang } = useI18n();
  const bn = lang === "bn";
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth`,
    });
    setBusy(false);
    if (error) {
      toast.error(bn ? "পাঠানো যায়নি" : "Could not send", { description: error.message });
      return;
    }
    setSent(true);
    toast.success(bn ? "রিসেট লিংক পাঠানো হয়েছে" : "Reset link sent");
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <KeyRound className="h-6 w-6" />
        </div>
        <h2 className="mt-3 text-2xl font-bold">{bn ? "পাসওয়ার্ড রিসেট" : "Reset password"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {bn ? "আপনার ইমেইলে রিসেট লিংক পাঠানো হবে।" : "We'll email you a reset link."}
        </p>
      </div>

      {sent ? (
        <div className="rounded-2xl border bg-success/10 p-4 text-sm">
          {bn
            ? "লিংক পাঠানো হয়েছে। আপনার ইমেইল চেক করুন।"
            : "The link has been sent. Please check your inbox."}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <IconField id="f-email" icon={Mail} label={bn ? "ইমেইল" : "Email"}>
            <Input
              id="f-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-11 pl-10"
            />
          </IconField>
          <Button type="submit" disabled={busy} className="w-full h-11 bg-gradient-primary text-primary-foreground shadow-glow">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {bn ? "রিসেট লিংক পাঠান" : "Send reset link"}
          </Button>
        </form>
      )}

      <button
        type="button"
        onClick={onBack}
        className="mt-5 inline-flex w-full items-center justify-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        {bn ? "লগইনে ফিরুন" : "Back to login"}
      </button>
    </div>
  );
}

/* ---------- Small helper ---------- */
function IconField({
  id, icon: Icon, label, children, right,
}: {
  id: string;
  icon: typeof Mail;
  label: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium">{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        {children}
        {right}
      </div>
    </div>
  );
}
