import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft, Wifi, Shield, CheckCircle2, Loader2, Lock,
  Smartphone, Landmark, Wallet, CreditCard, Phone, MessageCircle,
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

type MethodDef = {
  id: Method;
  icon: typeof Wallet;
  label: string;
  bg: string;
  shadow: string;
  key: `pay.method.${Method}`;
};

const methodDefs: MethodDef[] = [
  { id: "bkash",  icon: Smartphone, label: "bKash",  bg: "bg-[#E2136E]",   shadow: "shadow-[0_8px_24px_-6px_rgba(226,19,110,0.55)]", key: "pay.method.bkash" },
  { id: "nagad",  icon: Wallet,     label: "Nagad",  bg: "bg-[#F7941D]",   shadow: "shadow-[0_8px_24px_-6px_rgba(247,148,29,0.55)]", key: "pay.method.nagad" },
  { id: "rocket", icon: Smartphone, label: "Rocket", bg: "bg-[#8C3494]",   shadow: "shadow-[0_8px_24px_-6px_rgba(140,52,148,0.55)]", key: "pay.method.rocket" },
  { id: "card",   icon: CreditCard, label: "Cards",  bg: "bg-indigo-600",  shadow: "shadow-[0_8px_24px_-6px_rgba(79,70,229,0.55)]",  key: "pay.method.card" },
  { id: "bank",   icon: Landmark,   label: "Bank",   bg: "bg-emerald-600", shadow: "shadow-[0_8px_24px_-6px_rgba(5,150,105,0.55)]",  key: "pay.method.bank" },
];

type Invoice = {
  billId: string | null;
  number: string | null;
  customerName: string;
  customerCode: string;
  pkg: string;
  amount: number;
  due: string;
  month: string;
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
      const monthStr = res.bill?.month
        ? new Date(res.bill.month).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { month: "long", year: "numeric" })
        : "—";
      if (!res.bill) {
        toast.info(lang === "bn" ? "কোনো বকেয়া বিল নেই" : "No outstanding bill");
        setInvoice({
          billId: null, number: null,
          customerName: res.customer.name,
          customerCode: res.customer.code,
          pkg: res.customer.package ?? "—",
          amount: 0, due: "—", month: "—",
        });
      } else {
        setInvoice({
          billId: res.bill.id,
          number: res.bill.number,
          customerName: res.customer.name,
          customerCode: res.customer.code,
          pkg: res.customer.package ?? "—",
          amount: res.bill.due,
          month: monthStr,
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
    setCustomerId(""); setInvoice(null); setSuccess(null);
    setMsisdn(""); setTxnId(""); setMethod("bkash");
  };

  const amtFmt = (n: number) => n.toLocaleString(lang === "bn" ? "bn-BD" : "en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-fuchsia-600/10 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:56px_56px]" />
      </div>

      {/* Top bar */}
      <header className="relative z-40 border-b border-slate-800/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> {t("pay.back")}
          </Link>
          <div className="flex items-center gap-2">
            <LangToggle />
            <ThemeToggle />
            <div className="ml-1 flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/30">
                <Wifi className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold hidden sm:inline text-white">Net Bill Pro</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 md:py-16 flex justify-center">
        <div className="w-full max-w-xl bg-slate-900/50 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Card header */}
          <div className="p-6 md:p-8 pb-4 border-b border-slate-800/60">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Pay Your Bill</h1>
                <p className="text-slate-400 text-sm mt-1">আপনার বিল পরিশোধ করুন</p>
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full whitespace-nowrap">
                <span className="text-indigo-300 text-[10px] font-semibold tracking-wider uppercase inline-flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Secure Payment
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            {/* Success state */}
            {success && (
              <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-6 animate-fade-in-up">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500/15">
                    <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{lang === "bn" ? "পেমেন্ট সফল" : "Payment Successful"}</div>
                    <div className="text-xs text-slate-400">{lang === "bn" ? "রিসিট নম্বর" : "Receipt No."}: <b className="text-slate-200">{success.receipt}</b></div>
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between border-t border-emerald-500/20 pt-4">
                  <span className="text-sm text-slate-400">{lang === "bn" ? "পরিশোধিত" : "Paid"}</span>
                  <span className="text-2xl font-extrabold text-emerald-400">৳ {amtFmt(success.amount)}</span>
                </div>
                <Button onClick={resetAll} variant="outline" className="mt-4 w-full border-slate-700 bg-slate-800/40 text-slate-100 hover:bg-slate-800 hover:text-white">
                  {lang === "bn" ? "নতুন পেমেন্ট" : "New Payment"}
                </Button>
              </div>
            )}

            {/* Step 1: Customer lookup */}
            {!success && (
              <div className="space-y-4">
                <div>
                  <span className="text-slate-200 text-sm font-medium block">Customer ID</span>
                  <span className="block text-slate-500 text-xs">কাস্টমার আইডি</span>
                </div>
                <form onSubmit={handleLookup} className="relative">
                  <Input
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    placeholder="e.g. NBP-102938"
                    className="w-full bg-slate-800/50 border-slate-700 text-white h-14 rounded-xl px-5 pr-28 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:border-indigo-500 placeholder:text-slate-600"
                  />
                  <Button
                    type="submit"
                    disabled={loading}
                    className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 rounded-lg text-sm font-semibold h-auto"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                  </Button>
                </form>
              </div>
            )}

            {/* Step 2: Bill Summary */}
            {!success && invoice && (
              <div className="bg-slate-800/30 rounded-2xl border border-slate-800 p-6 space-y-4 animate-fade-in-up">
                <h3 className="text-slate-300 text-xs font-bold uppercase tracking-widest">Bill Summary / বিলের বিবরণ</h3>
                <div className="space-y-3 text-sm">
                  <Row label={lang === "bn" ? "নাম / Customer" : "Customer / নাম"} value={invoice.customerName} />
                  <Row label={lang === "bn" ? "কোড / Code" : "Code / কোড"} value={invoice.customerCode} />
                  <Row label={lang === "bn" ? "প্যাকেজ / Package" : "Package / প্যাকেজ"} value={invoice.pkg} />
                  <Row label="Month / মাস" value={invoice.month} />
                  <Row label={lang === "bn" ? "শেষ তারিখ / Due" : "Due Date / শেষ তারিখ"} value={invoice.due} />
                  <div className="pt-3 border-t border-slate-700/50 flex justify-between items-center">
                    <span className="text-indigo-300 font-semibold">Total Payable</span>
                    <span className="text-white font-bold text-2xl">৳ {amtFmt(invoice.amount)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Payment methods */}
            {!success && (
              <div className={`space-y-4 ${invoice?.billId ? "" : "opacity-50 pointer-events-none select-none"}`}>
                <div>
                  <span className="text-slate-200 text-sm font-medium block">Select Payment Method</span>
                  <span className="block text-slate-500 text-xs">পেমেন্ট পদ্ধতি নির্বাচন করুন</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {methodDefs.map((m) => {
                    const active = method === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMethod(m.id)}
                        className={`relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                          active
                            ? "border-indigo-500/60 bg-slate-800 -translate-y-0.5"
                            : "border-slate-800 bg-slate-800/20 hover:bg-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full ${m.bg} ${m.shadow} flex items-center justify-center mb-2`}>
                          <span className="text-white font-bold text-[10px] leading-none">{m.label.slice(0, 5)}</span>
                        </div>
                        <span className="text-slate-200 text-xs font-medium">{t(m.key)}</span>
                        {active && (
                          <CheckCircle2 className="absolute top-2 right-2 h-3.5 w-3.5 text-indigo-400" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <form onSubmit={handlePay} className="space-y-4 pt-2">
                  {(method === "bkash" || method === "nagad" || method === "rocket") && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-slate-300">
                          {t(`pay.method.${method}` as const)} — {t("pay.wallet")}
                        </Label>
                        <Input
                          value={msisdn}
                          onChange={(e) => setMsisdn(e.target.value)}
                          inputMode="numeric"
                          maxLength={11}
                          placeholder="01XXXXXXXXX"
                          className="h-12 bg-slate-800/50 border-slate-700 text-white tracking-wider focus-visible:ring-indigo-500/40 focus-visible:border-indigo-500 placeholder:text-slate-600"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-slate-300">
                          {lang === "bn" ? "ট্রানজেকশন আইডি (TrxID)" : "Transaction ID (TrxID)"}
                        </Label>
                        <Input
                          value={txnId}
                          onChange={(e) => setTxnId(e.target.value)}
                          placeholder={lang === "bn" ? "যেমন 8N7A1B2C3D" : "e.g. 8N7A1B2C3D"}
                          className="h-12 bg-slate-800/50 border-slate-700 text-white uppercase tracking-wider focus-visible:ring-indigo-500/40 focus-visible:border-indigo-500 placeholder:text-slate-600"
                        />
                      </div>
                    </>
                  )}

                  {method === "card" && (
                    <p className="rounded-xl bg-slate-800/40 border border-slate-800 p-3 text-xs text-slate-400">
                      {t("pay.cardNote")}
                    </p>
                  )}

                  {method === "bank" && (
                    <>
                      <div className="rounded-xl bg-slate-800/40 border border-slate-800 p-4 text-sm space-y-1 text-slate-300">
                        <div><b className="text-slate-100">Bank:</b> Dutch-Bangla Bank Ltd.</div>
                        <div><b className="text-slate-100">A/C Name:</b> Net Bill Pro</div>
                        <div><b className="text-slate-100">A/C No:</b> 1234-5678-9012</div>
                        <div><b className="text-slate-100">Branch:</b> Dhanmondi</div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-slate-300">
                          {lang === "bn" ? "ব্যাংক রেফারেন্স" : "Bank Reference"}
                        </Label>
                        <Input
                          value={txnId}
                          onChange={(e) => setTxnId(e.target.value)}
                          placeholder={lang === "bn" ? "রেফারেন্স নম্বর" : "Reference number"}
                          className="h-12 bg-slate-800/50 border-slate-700 text-white focus-visible:ring-indigo-500/40 focus-visible:border-indigo-500 placeholder:text-slate-600"
                        />
                      </div>
                    </>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    disabled={paying || !invoice?.billId}
                    className="w-full h-14 text-base bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 font-bold"
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

          {/* Footer */}
          <div className="p-5 bg-slate-950/60 border-t border-slate-800">
            <div className="flex items-center gap-3 text-slate-500 text-xs">
              <Lock className="h-4 w-4" />
              <span>Your payment is protected with 256-bit SSL encryption.</span>
            </div>
          </div>
        </div>
      </main>

      {/* Help strip */}
      <section className="container mx-auto px-4 pb-12 flex justify-center">
        <div className="w-full max-w-xl grid gap-3 sm:grid-cols-2">
          <a href="tel:01339562416" className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 hover:bg-slate-800/60 transition-colors">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-600/15 text-indigo-300">
              <Phone className="h-4 w-4" />
            </span>
            <div>
              <div className="text-xs text-slate-400">{t("contact.hotline")}</div>
              <div className="font-semibold text-slate-100">01339562416</div>
            </div>
          </a>
          <a href="https://wa.me/8801339562416" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 hover:bg-slate-800/60 transition-colors">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-500/15 text-emerald-300">
              <MessageCircle className="h-4 w-4" />
            </span>
            <div>
              <div className="text-xs text-slate-400">WhatsApp</div>
              <div className="font-semibold text-slate-100">01339562416</div>
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center gap-3">
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-medium text-right">{value}</span>
    </div>
  );
}
