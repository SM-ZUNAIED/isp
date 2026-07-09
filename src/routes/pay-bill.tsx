import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft, Wifi, Search, Shield, CheckCircle2, Loader2,
  Smartphone, Landmark, Wallet, CreditCard, Receipt, Phone, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/pay-bill")({
  head: () => ({
    meta: [
      { title: "বিল পরিশোধ করুন | Pay Your Bill — Net Bill Pro" },
      { name: "description", content: "বিকাশ, নগদ, রকেট বা কার্ডের মাধ্যমে সহজেই আপনার ইন্টারনেট বিল পরিশোধ করুন। Pay your internet bill online instantly." },
    ],
  }),
  component: PayBillPage,
});

type Method = "bkash" | "nagad" | "rocket" | "card" | "bank";

const methods: { id: Method; name: string; en: string; icon: typeof Wallet; tone: string }[] = [
  { id: "bkash",  name: "বিকাশ",   en: "bKash",         icon: Smartphone, tone: "from-pink-500 to-rose-600" },
  { id: "nagad",  name: "নগদ",     en: "Nagad",         icon: Wallet,     tone: "from-orange-500 to-amber-600" },
  { id: "rocket", name: "রকেট",    en: "Rocket",        icon: Smartphone, tone: "from-fuchsia-500 to-purple-600" },
  { id: "card",   name: "কার্ড",    en: "Debit / Credit", icon: CreditCard, tone: "from-sky-500 to-indigo-600" },
  { id: "bank",   name: "ব্যাংক",   en: "Bank Transfer", icon: Landmark,   tone: "from-emerald-500 to-teal-600" },
];

function PayBillPage() {
  const [customerId, setCustomerId] = useState("");
  const [invoice, setInvoice] = useState<null | { id: string; name: string; pkg: string; amount: number; due: string }>(null);
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<Method>("bkash");
  const [msisdn, setMsisdn] = useState("");

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId.trim()) return toast.error("গ্রাহক আইডি দিন / Enter Customer ID");
    setLoading(true);
    setTimeout(() => {
      setInvoice({
        id: customerId.trim().toUpperCase(),
        name: "গ্রাহক / Customer",
        pkg: "Fiber 20 Mbps",
        amount: 800,
        due: new Date(Date.now() + 5 * 864e5).toLocaleDateString("en-GB"),
      });
      setLoading(false);
    }, 700);
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (method !== "card" && method !== "bank" && !/^01[3-9]\d{8}$/.test(msisdn)) {
      return toast.error("সঠিক মোবাইল নম্বর দিন / Enter a valid mobile number");
    }
    toast.success("পেমেন্ট গেটওয়ে খোলা হচ্ছে... / Redirecting to gateway...");
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      {/* Top bar */}
      <header className="sticky top-0 z-40 glass border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> হোমে ফিরুন / Back
          </Link>
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary shadow-glow">
              <Wifi className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold">Net Bill Pro</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 md:py-16">
        {/* Title */}
        <div className="mx-auto max-w-3xl text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium">
            <Shield className="h-3.5 w-3.5 text-success" />
            <span>100% নিরাপদ পেমেন্ট • Secure Payment</span>
          </div>
          <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight">
            বিল পরিশোধ করুন
            <span className="block text-lg md:text-2xl font-semibold text-muted-foreground mt-1">
              Pay Your Internet Bill
            </span>
          </h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground">
            মাত্র কয়েক সেকেন্ডে আপনার মাসিক বিল পরিশোধ করুন • Settle your monthly bill in seconds
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-[1.15fr_1fr]">
          {/* Left: form */}
          <div className="rounded-3xl border bg-gradient-card p-6 md:p-8 shadow-elevated animate-fade-in-up">
            {/* Step 1: lookup */}
            <div className="flex items-center gap-3">
              <StepBadge n={1} active />
              <div>
                <h2 className="font-bold text-lg">গ্রাহক তথ্য / Customer Lookup</h2>
                <p className="text-xs text-muted-foreground">আপনার Customer ID অথবা মোবাইল নম্বর দিন</p>
              </div>
            </div>

            <form onSubmit={handleLookup} className="mt-5 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  placeholder="যেমন / e.g. NBP-1024 বা 01XXXXXXXXX"
                  className="pl-9 h-12 text-base"
                />
              </div>
              <Button type="submit" disabled={loading} className="h-12 px-6 bg-gradient-primary text-primary-foreground shadow-glow">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>খুঁজুন / Search</>}
              </Button>
            </form>

            {/* Invoice */}
            {invoice && (
              <div className="mt-6 rounded-2xl border bg-card p-5 animate-fade-in-up">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Customer ID</div>
                      <div className="font-bold">{invoice.id}</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-warning/15 px-3 py-1 text-xs font-semibold text-warning">
                    বকেয়া / Due {invoice.due}
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <Field label="নাম / Name" value={invoice.name} />
                  <Field label="প্যাকেজ / Package" value={invoice.pkg} />
                </dl>
                <div className="mt-4 flex items-baseline justify-between border-t pt-4">
                  <span className="text-sm text-muted-foreground">মোট বিল / Total Amount</span>
                  <span className="text-3xl font-extrabold text-primary">৳ {invoice.amount.toLocaleString("en-BD")}</span>
                </div>
              </div>
            )}

            {/* Step 2: method */}
            <div className={`mt-8 ${invoice ? "" : "opacity-50 pointer-events-none"}`}>
              <div className="flex items-center gap-3">
                <StepBadge n={2} active={!!invoice} />
                <div>
                  <h2 className="font-bold text-lg">পেমেন্ট মাধ্যম / Payment Method</h2>
                  <p className="text-xs text-muted-foreground">যেভাবে পরিশোধ করবেন তা বেছে নিন</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {methods.map((m) => {
                  const Icon = m.icon;
                  const active = method === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethod(m.id)}
                      className={`group relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all ${
                        active
                          ? "border-primary bg-primary/5 shadow-glow -translate-y-0.5"
                          : "hover:border-primary/50 hover:-translate-y-0.5"
                      }`}
                    >
                      <span className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${m.tone} text-white shadow-soft`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-sm font-bold leading-tight">{m.name}</span>
                      <span className="text-[11px] text-muted-foreground -mt-1">{m.en}</span>
                      {active && (
                        <CheckCircle2 className="absolute right-2 top-2 h-4 w-4 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handlePay} className="mt-6 space-y-4">
                {(method === "bkash" || method === "nagad" || method === "rocket") && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      {methods.find((m) => m.id === method)?.name} নম্বর / Wallet Number
                    </Label>
                    <Input
                      value={msisdn}
                      onChange={(e) => setMsisdn(e.target.value)}
                      inputMode="numeric"
                      maxLength={11}
                      placeholder="01XXXXXXXXX"
                      className="h-12 text-base tracking-wider"
                    />
                  </div>
                )}
                {method === "card" && (
                  <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                    আপনাকে সিকিউর পেমেন্ট গেটওয়েতে পাঠানো হবে। / You'll be redirected to a secure gateway.
                  </p>
                )}
                {method === "bank" && (
                  <div className="rounded-xl bg-muted/50 p-4 text-sm space-y-1">
                    <div><b>Bank:</b> Dutch-Bangla Bank Ltd.</div>
                    <div><b>A/C Name:</b> Net Bill Pro</div>
                    <div><b>A/C No:</b> 1234-5678-9012</div>
                    <div><b>Branch:</b> Dhanmondi</div>
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-14 text-base bg-gradient-primary text-primary-foreground shadow-glow"
                >
                  ৳ {invoice?.amount.toLocaleString("en-BD") ?? 0} পরিশোধ করুন • Pay Now
                </Button>
              </form>
            </div>
          </div>

          {/* Right: help / trust */}
          <aside className="space-y-4">
            <div className="rounded-3xl border bg-gradient-hero p-6 text-primary-foreground shadow-elevated">
              <Shield className="h-7 w-7" />
              <h3 className="mt-3 text-xl font-bold">
                নিরাপদ ও তাৎক্ষণিক
                <span className="block text-sm font-medium opacity-90">Safe & Instant Payments</span>
              </h3>
              <p className="mt-2 text-sm opacity-90">
                সকল লেনদেন SSL এনক্রিপশনে সুরক্ষিত। পেমেন্ট নিশ্চিত হলে আপনার সংযোগ সাথে সাথেই সক্রিয় হবে।
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {[
                  ["তাৎক্ষণিক অ্যাক্টিভেশন", "Instant activation"],
                  ["ডিজিটাল রিসিট ইমেইলে", "Digital receipt via email"],
                  ["২৪/৭ পেমেন্ট সাপোর্ট", "24/7 payment support"],
                ].map(([bn, en]) => (
                  <li key={en} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{bn} <span className="opacity-75">• {en}</span></span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border bg-card p-6 shadow-soft">
              <h3 className="font-bold">সহায়তা প্রয়োজন? / Need Help?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                বিল সংক্রান্ত যেকোনো সমস্যায় আমাদের টিম আপনাকে সহায়তা করতে প্রস্তুত।
              </p>
              <div className="mt-4 grid gap-2">
                <a href="tel:01339562416" className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/50 transition-colors">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Phone className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-xs text-muted-foreground">হটলাইন / Hotline</div>
                    <div className="font-semibold">01339562416</div>
                  </div>
                </a>
                <a href="https://wa.me/8801339562416" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/50 transition-colors">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-success/15 text-success">
                    <MessageCircle className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-xs text-muted-foreground">WhatsApp</div>
                    <div className="font-semibold">01339562416</div>
                  </div>
                </a>
              </div>
            </div>

            <div className="rounded-3xl border bg-card p-6 shadow-soft">
              <h3 className="font-bold text-sm">গৃহীত পেমেন্ট / We Accept</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {methods.map((m) => (
                  <span key={m.id} className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br ${m.tone} px-3 py-1 text-xs font-semibold text-white shadow-soft`}>
                    <m.icon className="h-3 w-3" /> {m.en}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function StepBadge({ n, active }: { n: number; active: boolean }) {
  return (
    <span className={`grid h-9 w-9 place-items-center rounded-full font-bold text-sm ${
      active ? "bg-gradient-primary text-primary-foreground shadow-glow" : "bg-muted text-muted-foreground"
    }`}>{n}</span>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
