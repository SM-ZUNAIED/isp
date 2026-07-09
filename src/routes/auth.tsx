import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "লগইন / সাইন আপ — Net Bill Pro" },
      { name: "description", content: "Net Bill Pro অ্যাডমিন ও কাস্টমার পোর্টাল লগইন।" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session) {
      navigate({ to: "/admin" });
    }
  }, [loading, session, navigate]);

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-hero p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center text-white">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 backdrop-blur">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </Link>
          <h1 className="mt-3 text-2xl font-bold">Net Bill Pro</h1>
          <p className="text-sm text-white/80">অ্যাডমিন ও কাস্টমার পোর্টাল</p>
        </div>

        <div className="rounded-3xl bg-card p-6 shadow-elevated">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">লগইন</TabsTrigger>
              <TabsTrigger value="signup">সাইন আপ</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-4">
              <LoginForm />
            </TabsContent>
            <TabsContent value="signup" className="mt-4">
              <SignupForm />
            </TabsContent>
          </Tabs>
        </div>

        <p className="mt-4 text-center text-xs text-white/70">
          প্রথম সাইন আপকারী স্বয়ংক্রিয়ভাবে ISP মালিক (Admin) হিসেবে যুক্ত হবেন।
        </p>
      </div>
    </div>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error("লগইন ব্যর্থ", { description: error.message });
      return;
    }
    toast.success("সফলভাবে লগইন হয়েছে");
    navigate({ to: "/admin" });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="l-email">ইমেইল</Label>
        <Input
          id="l-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="owner@example.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="l-pass">পাসওয়ার্ড</Label>
        <Input
          id="l-pass"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>
      <Button type="submit" disabled={busy} className="w-full h-11 text-base">
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
        লগইন করুন
      </Button>
    </form>
  );
}

function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const redirectTo = `${window.location.origin}/auth`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: { full_name: fullName },
      },
    });
    setBusy(false);
    if (error) {
      toast.error("সাইন আপ ব্যর্থ", { description: error.message });
      return;
    }
    toast.success("অ্যাকাউন্ট তৈরি হয়েছে", {
      description: "ইমেইল ভেরিফাই ছাড়াই লগইন করতে পারবেন।",
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="s-name">পূর্ণ নাম</Label>
        <Input id="s-name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="আপনার নাম" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="s-email">ইমেইল</Label>
        <Input id="s-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="s-pass">পাসওয়ার্ড</Label>
        <Input id="s-pass" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="কমপক্ষে ৬ অক্ষর" />
      </div>
      <Button type="submit" disabled={busy} className="w-full h-11 text-base">
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
        অ্যাকাউন্ট তৈরি করুন
      </Button>
    </form>
  );
}
