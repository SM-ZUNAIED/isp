import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getLandingData } from "@/lib/landing.functions";
import {
  Wifi, Zap, Shield, Users, Award, Phone, MapPin, Mail, MessageCircle,
  ChevronRight, CheckCircle2, Star, Signal, Router, Headphones, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { ThemeToggle, LangToggle } from "@/components/theme-lang-toggles";

const landingQuery = queryOptions({
  queryKey: ["landing"],
  queryFn: () => getLandingData(),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(landingQuery),
  head: () => ({
    meta: [
      { title: "Net Bill Pro — বাংলাদেশের সেরা ISP সফটওয়্যার" },
      { name: "description", content: "দ্রুত, নিরাপদ ও নির্ভরযোগ্য ফাইবার ইন্টারনেট সেবা। MikroTik, OLT, ONU সম্পূর্ণ অটোমেশন।" },
      { property: "og:title", content: "Net Bill Pro — ISP সফটওয়্যার" },
      { property: "og:description", content: "সম্পূর্ণ বাংলা ISP বিলিং ও নেটওয়ার্ক অটোমেশন।" },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center p-4 text-center">
      <div>
        <h1 className="text-2xl font-bold">কিছু সমস্যা হয়েছে</h1>
        <p className="mt-2 text-muted-foreground">{error.message}</p>
      </div>
    </div>
  ),
  notFoundComponent: () => <div className="p-8">পেজ পাওয়া যায়নি</div>,
  component: LandingPage,
});

function LandingPage() {
  const { data } = useSuspenseQuery(landingQuery);
  const { settings, packages, notices } = data;
  const { t } = useI18n();

  const ispName = settings?.isp_name ?? "Net Bill Pro";
  const hotline = settings?.hotline ?? "01339562416";
  const whatsapp = settings?.whatsapp ?? "01339562416";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-glow">
              <Wifi className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">{ispName}</span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#packages" className="text-sm font-medium hover:text-primary transition-colors">{t("nav.packages")}</a>
            <a href="#coverage" className="text-sm font-medium hover:text-primary transition-colors">{t("nav.coverage")}</a>
            <a href="#about" className="text-sm font-medium hover:text-primary transition-colors">{t("nav.about")}</a>
            <a href="#faq" className="text-sm font-medium hover:text-primary transition-colors">{t("nav.faq")}</a>
            <a href="#contact" className="text-sm font-medium hover:text-primary transition-colors">{t("nav.contact")}</a>
          </nav>
          <div className="flex items-center gap-2">
            <LangToggle />
            <ThemeToggle />
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link to="/auth">{t("nav.login")}</Link>
            </Button>
            <Button asChild size="sm" className="bg-gradient-primary shadow-glow">
              <Link to="/pay-bill">{t("nav.payBill")}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 md:py-32">
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:32px_32px]" />
        <div className="container relative mx-auto px-4 text-center text-primary-foreground">
          <div className="mx-auto max-w-4xl animate-fade-in-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm">
              <Star className="h-4 w-4 fill-current text-warning" />
              <span>বাংলাদেশের ১ নম্বর ISP সফটওয়্যার</span>
            </div>
            <h1 className="mb-6 text-4xl font-extrabold leading-tight md:text-6xl lg:text-7xl">
              {settings?.hero_title ?? "দ্রুতগতির ফাইবার ইন্টারনেট"}
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg opacity-90 md:text-xl">
              {settings?.hero_subtitle ?? "আপনার ঘরে ঘরে পৌঁছে দিচ্ছি বিশ্বমানের ইন্টারনেট সেবা। অসীম ব্যান্ডউইথ, ২৪/৭ সাপোর্ট।"}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-background text-foreground hover:bg-background/90 shadow-elevated">
                এখনই কানেকশন নিন <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                প্যাকেজ দেখুন
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "গ্রাহক", value: "১০,০০০+", icon: Users },
              { label: "কাভারেজ এলাকা", value: "৫০+", icon: MapPin },
              { label: "আপটাইম", value: "৯৯.৯%", icon: TrendingUp },
              { label: "সাপোর্ট", value: "২৪/৭", icon: Headphones },
            ].map((s) => (
              <div key={s.label} className="glass rounded-2xl p-6 text-center">
                <s.icon className="mx-auto mb-2 h-6 w-6" />
                <div className="text-2xl font-bold md:text-3xl">{s.value}</div>
                <div className="text-sm opacity-80">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">কেন আমরা সেরা?</h2>
            <p className="mt-4 text-muted-foreground">প্রযুক্তি, গতি ও সেবায় আমরা সবার চেয়ে এগিয়ে</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: Zap, title: "সুপার ফাস্ট স্পিড", desc: "আধুনিক ফাইবার অপটিক নেটওয়ার্কে গিগাবিট গতির ইন্টারনেট।", color: "bg-gradient-primary" },
              { icon: Shield, title: "নিরাপদ কানেকশন", desc: "এন্টারপ্রাইজ-গ্রেড সিকিউরিটি এবং DDoS প্রোটেকশন।", color: "bg-gradient-accent" },
              { icon: Signal, title: "স্থিতিশীল সংযোগ", desc: "রিডানডেন্ট আপলিংক ও ২৪/৭ মনিটরিং।", color: "bg-gradient-hero" },
              { icon: Router, title: "মিকরোটিক অটোমেশন", desc: "সম্পূর্ণ অটোমেটিক PPPoE, Radius ও ব্যান্ডউইথ ব্যবস্থাপনা।", color: "bg-gradient-primary" },
              { icon: Headphones, title: "২৪/৭ কাস্টমার কেয়ার", desc: "যেকোনো সমস্যায় তাৎক্ষণিক সাপোর্ট।", color: "bg-gradient-accent" },
              { icon: Award, title: "সেরা মূল্য", desc: "বাজারের সেরা প্যাকেজ এবং অসীম ডেটা।", color: "bg-gradient-hero" },
            ].map((f) => (
              <div key={f.title} className="group rounded-3xl border bg-card p-6 shadow-soft transition-all hover:shadow-elevated hover:-translate-y-1">
                <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${f.color} shadow-glow`}>
                  <f.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="mb-2 text-xl font-bold">{f.title}</h3>
                <p className="text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">আমাদের ইন্টারনেট প্যাকেজ</h2>
            <p className="mt-4 text-muted-foreground">আপনার প্রয়োজন অনুযায়ী প্যাকেজ বেছে নিন</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative rounded-3xl border bg-card p-6 shadow-soft transition-all hover:shadow-elevated hover:-translate-y-2 ${
                  pkg.is_popular ? "border-primary shadow-glow ring-2 ring-primary/20" : ""
                }`}
              >
                {pkg.is_popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-accent px-4 py-1 text-xs font-bold text-accent-foreground shadow-soft">
                    জনপ্রিয়
                  </div>
                )}
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: pkg.color ?? "var(--gradient-primary)" }}>
                  <Wifi className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold">{pkg.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">৳{Math.round(Number(pkg.monthly_price))}</span>
                  <span className="text-muted-foreground">/মাস</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> ডাউনলোড: {pkg.download_speed} Mbps</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> আপলোড: {pkg.upload_speed} Mbps</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> অসীম ব্যান্ডউইথ</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> ২৪/৭ সাপোর্ট</li>
                </ul>
                <Button className={`mt-6 w-full ${pkg.is_popular ? "bg-gradient-primary shadow-glow" : ""}`} variant={pkg.is_popular ? "default" : "outline"}>
                  অর্ডার করুন
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage */}
      <section id="coverage" className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">আমাদের কাভারেজ এলাকা</h2>
            <p className="mt-4 text-muted-foreground">সারা বাংলাদেশে ছড়িয়ে আছে আমাদের নেটওয়ার্ক</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {["ঢাকা", "চট্টগ্রাম", "রাজশাহী", "খুলনা", "সিলেট", "বরিশাল", "রংপুর", "ময়মনসিংহ"].map((city) => (
              <div key={city} className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-soft transition-all hover:shadow-elevated">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-semibold">{city}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-muted/30 py-20">
        <div className="container mx-auto grid gap-12 px-4 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">আমাদের সম্পর্কে</h2>
            <p className="mt-4 text-muted-foreground">
              {settings?.about_text ?? `${ispName} বাংলাদেশের একটি অগ্রণী ISP কোম্পানি। আমরা গত কয়েক বছর ধরে দেশের বিভিন্ন প্রান্তে দ্রুতগতির ইন্টারনেট সেবা প্রদান করে আসছি।`}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border bg-card p-4">
                <div className="text-3xl font-bold text-primary">১০+</div>
                <div className="text-sm text-muted-foreground">বছরের অভিজ্ঞতা</div>
              </div>
              <div className="rounded-2xl border bg-card p-4">
                <div className="text-3xl font-bold text-secondary">১০০+</div>
                <div className="text-sm text-muted-foreground">টেকনিক্যাল টিম</div>
              </div>
            </div>
          </div>
          <div className="relative aspect-square rounded-3xl bg-gradient-hero p-8 shadow-elevated">
            <div className="glass absolute inset-4 rounded-2xl grid place-items-center">
              <Wifi className="h-32 w-32 text-white/80 animate-float" />
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">গ্রাহকদের মতামত</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { name: "মোঃ রফিকুল ইসলাম", loc: "ঢাকা", text: "দুর্দান্ত সেবা! কোনো ডাউনটাইম নেই। ২৪ ঘণ্টা সাপোর্ট সবসময় পাওয়া যায়।" },
              { name: "সাবরিনা আক্তার", loc: "চট্টগ্রাম", text: "স্পিড অসাধারণ। বাসায় সবাই একসাথে ব্যবহার করেও কোনো সমস্যা হয় না।" },
              { name: "মোঃ কামাল হোসেন", loc: "সিলেট", text: "বিলিং সিস্টেম খুব সহজ। বিকাশ থেকে সরাসরি পেমেন্ট করা যায়।" },
            ].map((r) => (
              <div key={r.name} className="rounded-3xl border bg-gradient-card p-6 shadow-soft">
                <div className="flex gap-1 text-warning">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="mt-4 text-muted-foreground">"{r.text}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-primary text-primary-foreground font-bold">
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.loc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-muted/30 py-20">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">প্রশ্ন ও উত্তর</h2>
          </div>
          <div className="mt-12 space-y-4">
            {[
              { q: "কানেকশন নিতে কত সময় লাগে?", a: "সাধারণত ২৪-৪৮ ঘণ্টার মধ্যে ইনস্টলেশন সম্পন্ন হয়।" },
              { q: "কীভাবে বিল পরিশোধ করব?", a: "বিকাশ, নগদ, রকেট বা ব্যাংক ট্রান্সফারের মাধ্যমে সহজেই বিল দিতে পারবেন।" },
              { q: "সাপোর্ট কীভাবে পাব?", a: "হটলাইন, WhatsApp, অথবা কাস্টমার পোর্টালে টিকিট সাবমিট করে সাপোর্ট নিতে পারবেন।" },
              { q: "প্যাকেজ পরিবর্তন করতে পারব?", a: "হ্যাঁ, যেকোনো সময় প্যাকেজ আপগ্রেড বা ডাউনগ্রেড করা যাবে।" },
            ].map((item) => (
              <details key={item.q} className="group rounded-2xl border bg-card p-5 shadow-soft">
                <summary className="flex cursor-pointer items-center justify-between font-semibold">
                  {item.q}
                  <ChevronRight className="h-5 w-5 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-hero p-8 text-primary-foreground shadow-elevated md:p-12">
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <h2 className="text-3xl font-bold md:text-4xl">যোগাযোগ করুন</h2>
                <p className="mt-4 opacity-90">আজই কানেকশন নিতে আমাদের সাথে যোগাযোগ করুন</p>
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3"><Phone className="h-5 w-5" /> {hotline}</div>
                  <div className="flex items-center gap-3"><MessageCircle className="h-5 w-5" /> WhatsApp: {whatsapp}</div>
                  {settings?.email && <div className="flex items-center gap-3"><Mail className="h-5 w-5" /> {settings.email}</div>}
                  {settings?.address && <div className="flex items-center gap-3"><MapPin className="h-5 w-5" /> {settings.address}</div>}
                </div>
              </div>
              <div className="glass rounded-2xl p-6">
                <h3 className="text-xl font-bold">দ্রুত অনুসন্ধান</h3>
                <form className="mt-4 space-y-3">
                  <input placeholder="আপনার নাম" className="w-full rounded-xl border-0 bg-white/20 px-4 py-3 text-white placeholder:text-white/60 outline-none focus:bg-white/30" />
                  <input placeholder="মোবাইল নম্বর" className="w-full rounded-xl border-0 bg-white/20 px-4 py-3 text-white placeholder:text-white/60 outline-none focus:bg-white/30" />
                  <input placeholder="ঠিকানা" className="w-full rounded-xl border-0 bg-white/20 px-4 py-3 text-white placeholder:text-white/60 outline-none focus:bg-white/30" />
                  <Button type="button" className="w-full bg-background text-foreground hover:bg-background/90">অনুসন্ধান করুন</Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notices ticker */}
      {notices.length > 0 && (
        <section className="border-y bg-warning/10 py-4">
          <div className="container mx-auto flex items-center gap-4 px-4">
            <span className="rounded-full bg-warning px-3 py-1 text-xs font-bold text-warning-foreground">নোটিশ</span>
            <div className="flex-1 overflow-hidden">
              <div className="whitespace-nowrap">{notices.map(n => n.title).join(" • ")}</div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="container mx-auto grid gap-8 px-4 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary">
                <Wifi className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">{ispName}</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">বাংলাদেশের সেরা ISP সেবাদাতা প্রতিষ্ঠান।</p>
          </div>
          <div>
            <h4 className="font-bold">দ্রুত লিংক</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><a href="#packages" className="hover:text-primary">প্যাকেজ</a></li>
              <li><a href="#coverage" className="hover:text-primary">কাভারেজ</a></li>
              <li><a href="#faq" className="hover:text-primary">প্রশ্ন-উত্তর</a></li>
              <li><Link to="/auth" className="hover:text-primary">কাস্টমার লগইন</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold">যোগাযোগ</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>হটলাইন: {hotline}</li>
              <li>WhatsApp: {whatsapp}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold">ডেভেলপার</h4>
            <p className="mt-4 text-sm text-muted-foreground">
              Made by <a href="https://www.technonex.net/" target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">TechnoNex</a>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Hotline: 01339562416</p>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {ispName}. সর্বস্বত্ব সংরক্ষিত।
        </div>
      </footer>

      {/* Floating buttons */}
      <a
        href={`https://wa.me/88${whatsapp.replace(/^0/, "")}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-success text-success-foreground shadow-glow animate-pulse-glow"
        aria-label="WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
      <Link
        to="/pay-bill"
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full bg-gradient-accent px-5 py-3 font-bold text-accent-foreground shadow-glow"
      >
        <Zap className="h-5 w-5" /> বিল পরিশোধ
      </Link>
    </div>
  );
}
