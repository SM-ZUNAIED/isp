import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft, Wifi, Search, Shield, CheckCircle2, Loader2,
  Smartphone, Landmark, Wallet, CreditCard, Receipt, Phone, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useI18n } from "@/hooks/use-i18n";
import { ThemeToggle, LangToggle } from "@/components/theme-lang-toggles";
import { lookupPublicBill, submitPublicPayment } from "@/lib/pay-bill.functions";

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

const methodDefs: { id: Method; icon: typeof Wallet; tone: string; key: `pay.method.${Method}` }[] = [
  { id: "bkash",  icon: Smartphone, tone: "from-pink-500 to-rose-600",     key: "pay.method.bkash" },
  { id: "nagad",  icon: Wallet,     tone: "from-orange-500 to-amber-600",  key: "pay.method.nagad" },
  { id: "rocket", icon: Smartphone, tone: "from-fuchsia-500 to-purple-600",key: "pay.method.rocket" },
  { id: "card",   icon: CreditCard, tone: "from-sky-500 to-indigo-600",    key: "pay.method.card" },
  { id: "bank",   icon: Landmark,   tone: "from-emerald-500 to-teal-600",  key: "pay.method.bank" },
];

type Invoice = {
  billId: string | null;
  number: string | null;
  customerName: string;
  customerCode: string;
  pkg: string;
  amount: number;
  due: string;
};

function PayBillPage() {
  const { t, lang } = useI18n();
  const [customerId, setCustomerId] = useState("");
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState<Method>("bkash");
  const [msisdn, setMsisdn] = useState("");
  const [txnId, setTxnId] = useState("");
  const [success, setSuccess] = useState<null | { receipt: string; amount: number }>(null);

  const lookupFn = useServerFn(lookupPublicBill);
  const payFn = useServerFn(submitPublicPayment);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId.trim()) return toast.error(t("pay.err.id"));
    setLoading(true);
    setInvoice(null);
    setSuccess(null);
    try {
      const res = await lookupFn({ data: { customer_code: customerId.trim() } });
      if (!res.bill) {
        toast.info(lang === "bn" ? "কোনো বকেয়া বিল নেই" : "No outstanding bill");
        setInvoice({
          billId: null,
          number: null,
          customerName: res.customer.name,
          customerCode: res.customer.code,
          pkg: res.customer.package ?? "—",
          amount: 0,
          due: "—",
        });
      } else {
        setInvoice({
          billId: res.bill.id,
          number: res.bill.number,
          customerName: res.customer.name,
          customerCode: res.customer.code,
          pkg: res.customer.package ?? "—",
          amount: res.bill.due,
          due: res.bill.due_date ? new Date(res.bill.due_date).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB") : "—",
        });
      }
    } catch (err: any) {
      const msg = String(err?.message ?? err);
      toast.error(
        msg.includes("NOT_FOUND")
          ? lang === "bn" ? "গ্রাহক পাওয়া যায়নি" : "Customer not found"
          : lang === "bn" ? "লুকআপ ব্যর্থ" : "Lookup failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice?.billId) return;
    if ((method === "bkash" || method === "nagad" || method === "rocket") && !/^01[3-9]\d{8}$/.test(msisdn)) {
      return toast.error(t("pay.err.mobile"));
    }
    setPaying(true);
    try {
      const res = await payFn({
        data: {
          bill_id: invoice.billId,
          method,
          transaction_id: txnId.trim() || null,
          msisdn: method === "card" || method === "bank" ? null : msisdn,
        },
      });
      setSuccess({ receipt: res.receipt, amount: res.amount });
      toast.success(lang === "bn" ? "পেমেন্ট সফল হয়েছে" : "Payment successful");
    } catch (err: any) {
      toast.error(String(err?.message ?? err));
    } finally {
      setPaying(false);
    }
  };

  const resetAll = () => {
    setCustomerId("");
    setInvoice(null);
    setSuccess(null);
    setMsisdn("");
    setTxnId("");
    setMethod("bkash");
  };

  const amtFmt = (n: number) => n.toLocaleString(lang === "bn" ? "bn-BD" : "en-BD");


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
            <ArrowLeft className="h-4 w-4" /> {t("pay.back")}
          </Link>
          <div className="flex items-center gap-2">
            <LangToggle />
            <ThemeToggle />
            <Link to="/" className="ml-1 flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary shadow-glow">
                <Wifi className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold hidden sm:inline">Net Bill Pro</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 md:py-16">
        {/* Brand banner */}
        <div className="mx-auto max-w-3xl flex justify-center animate-fade-in-up">
          <Link to="/" className="inline-flex items-center gap-3 rounded-2xl glass border px-4 py-2.5 shadow-elevated hover:shadow-glow transition-shadow">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary shadow-glow">
              <Wifi className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="text-left">
              <div className="text-base font-extrabold tracking-tight leading-tight">Net Bill Pro</div>
              <div className="text-[11px] text-muted-foreground leading-tight">
                {lang === "bn" ? "আপনার ISP এর সম্পূর্ণ ম্যানেজমেন্ট" : "Complete ISP management suite"}
              </div>
            </div>
          </Link>
        </div>

        {/* Title */}
        <div className="mx-auto max-w-3xl text-center animate-fade-in-up mt-6">
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium">
            <Shield className="h-3.5 w-3.5 text-success" />
            <span>{t("pay.secure")}</span>
          </div>
          <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight">
            {t("pay.title")}
          </h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground">
            {t("pay.subtitle")}
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-[1.15fr_1fr]">
          {/* Left: form */}
          <div className="rounded-3xl border bg-gradient-card p-6 md:p-8 shadow-elevated animate-fade-in-up">
            {/* Step 1: lookup */}
            <div className="flex items-center gap-3">
              <StepBadge n={1} active />
              <div>
                <h2 className="font-bold text-lg">{t("pay.step1")}</h2>
                <p className="text-xs text-muted-foreground">{t("pay.step1.desc")}</p>
              </div>
            </div>

            <form onSubmit={handleLookup} className="mt-5 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  placeholder={t("pay.placeholder")}
                  className="pl-9 h-12 text-base"
                />
              </div>
              <Button type="submit" disabled={loading} className="h-12 px-6 bg-gradient-primary text-primary-foreground shadow-glow">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("pay.search")}
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
                      <div className="text-xs text-muted-foreground">{t("pay.customerId")}</div>
                      <div className="font-bold">{invoice.customerCode}</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-warning/15 px-3 py-1 text-xs font-semibold text-warning">
                    {t("pay.due")}: {invoice.due}
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <Field label={t("pay.package")} value={invoice.pkg} />
                  <Field label={t("pay.name")} value={invoice.customerName} />
                </dl>
                <div className="mt-4 flex items-baseline justify-between border-t pt-4">
                  <span className="text-sm text-muted-foreground">{t("pay.total")}</span>
                  <span className="text-3xl font-extrabold text-primary">৳ {amtFmt(invoice.amount)}</span>
                </div>
              </div>
            )}

            {/* Success view */}
            {success && (
              <div className="mt-6 rounded-2xl border-2 border-success/40 bg-success/5 p-6 animate-fade-in-up">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                  <div>
                    <div className="text-lg font-bold">{lang === "bn" ? "পেমেন্ট সফল" : "Payment Successful"}</div>
                    <div className="text-xs text-muted-foreground">{lang === "bn" ? "রিসিট নম্বর" : "Receipt No."}: <b>{success.receipt}</b></div>
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between border-t pt-4">
                  <span className="text-sm text-muted-foreground">{lang === "bn" ? "পরিশোধিত" : "Paid"}</span>
                  <span className="text-2xl font-extrabold text-success">৳ {amtFmt(success.amount)}</span>
                </div>
                <Button onClick={resetAll} variant="outline" className="mt-4 w-full">
                  {lang === "bn" ? "নতুন পেমেন্ট" : "New Payment"}
                </Button>
              </div>
            )}

            {/* Step 2: method */}
            {!success && (
            <div className={`mt-8 ${invoice?.billId ? "" : "opacity-50 pointer-events-none"}`}>
              <div className="flex items-center gap-3">
                <StepBadge n={2} active={!!invoice?.billId} />
                <div>
                  <h2 className="font-bold text-lg">{t("pay.step2")}</h2>
                  <p className="text-xs text-muted-foreground">{t("pay.step2.desc")}</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {methodDefs.map((m) => {
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
                      <span className="text-sm font-bold leading-tight">{t(m.key)}</span>
                      {active && (
                        <CheckCircle2 className="absolute right-2 top-2 h-4 w-4 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handlePay} className="mt-6 space-y-4">
                {(method === "bkash" || method === "nagad" || method === "rocket") && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        {t(`pay.method.${method}` as const)} — {t("pay.wallet")}
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
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        {lang === "bn" ? "ট্রানজেকশন আইডি (TrxID)" : "Transaction ID (TrxID)"}
                      </Label>
                      <Input
                        value={txnId}
                        onChange={(e) => setTxnId(e.target.value)}
                        placeholder={lang === "bn" ? "যেমন 8N7A1B2C3D" : "e.g. 8N7A1B2C3D"}
                        className="h-12 text-base tracking-wider uppercase"
                      />
                    </div>
                  </>
                )}
                {method === "card" && (
                  <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                    {t("pay.cardNote")}
                  </p>
                )}
                {method === "bank" && (
                  <>
                    <div className="rounded-xl bg-muted/50 p-4 text-sm space-y-1">
                      <div><b>Bank:</b> Dutch-Bangla Bank Ltd.</div>
                      <div><b>A/C Name:</b> Net Bill Pro</div>
                      <div><b>A/C No:</b> 1234-5678-9012</div>
                      <div><b>Branch:</b> Dhanmondi</div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        {lang === "bn" ? "ব্যাংক রেফারেন্স" : "Bank Reference"}
                      </Label>
                      <Input
                        value={txnId}
                        onChange={(e) => setTxnId(e.target.value)}
                        placeholder={lang === "bn" ? "রেফারেন্স নম্বর" : "Reference number"}
                        className="h-12 text-base"
                      />
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  size="lg"
                  disabled={paying || !invoice?.billId}
                  className="w-full h-14 text-base bg-gradient-primary text-primary-foreground shadow-glow"
                >
                  {paying ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>৳ {amtFmt(invoice?.amount ?? 0)} — {t("pay.now")}</>
                  )}
                </Button>
              </form>
            </div>
            )}
          </div>

          {/* Right: help / trust */}
          <aside className="space-y-4">
            <div className="rounded-3xl border bg-gradient-hero p-6 text-primary-foreground shadow-elevated">
              <Shield className="h-7 w-7" />
              <h3 className="mt-3 text-xl font-bold">{t("pay.trust.title")}</h3>
              <p className="mt-2 text-sm opacity-90">{t("pay.trust.desc")}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {([1, 2, 3] as const).map((i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{t(`pay.trust.${i}` as const)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border bg-card p-6 shadow-soft">
              <h3 className="font-bold">{t("pay.help.title")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("pay.help.desc")}</p>
              <div className="mt-4 grid gap-2">
                <a href="tel:01339562416" className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/50 transition-colors">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Phone className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-xs text-muted-foreground">{t("contact.hotline")}</div>
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
              <h3 className="font-bold text-sm">{t("pay.accept")}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {methodDefs.map((m) => (
                  <span key={m.id} className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br ${m.tone} px-3 py-1 text-xs font-semibold text-white shadow-soft`}>
                    <m.icon className="h-3 w-3" /> {t(m.key)}
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
