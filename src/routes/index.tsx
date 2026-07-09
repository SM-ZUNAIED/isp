import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { getLandingData } from "@/lib/landing.functions";
import { submitInquiry } from "@/lib/inquiry.functions";
import {
  Wifi, Zap, Shield, Users, Award, Phone, MapPin, Mail, MessageCircle,
  ChevronRight, CheckCircle2, Star, Signal, Router, Headphones, TrendingUp, Loader2, LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle, LangToggle } from "@/components/theme-lang-toggles";
import { toast } from "sonner";

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

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function LandingPage() {
  const { data } = useSuspenseQuery(landingQuery);
  const { settings, packages, notices } = data;
  const { t } = useI18n();
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/", replace: true });
    toast.success("লগআউট সফল");
  };

  const ispName = settings?.isp_name ?? "Net Bill Pro";
  const hotline = settings?.hotline ?? "01339562416";
  const whatsapp = settings?.whatsapp ?? "01339562416";

  const submitInquiryFn = useServerFn(submitInquiry);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const [selectedPkg, setSelectedPkg] = useState<{ id: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleOrder = (pkg: { id: string; name: string }) => {
    setSelectedPkg({ id: pkg.id, name: pkg.name });
    toast.success(`${pkg.name} — ${t("contact.subtitle")}`);
    setTimeout(() => {
      scrollToId("contact");
      messageRef.current?.focus();
    }, 100);
  };

  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = nameRef.current?.value.trim() ?? "";
    const phone = phoneRef.current?.value.trim() ?? "";
    const address = addressRef.current?.value.trim() ?? "";
    const message = messageRef.current?.value.trim() ?? "";
    if (name.length < 2) return toast.error("নাম দিন / Enter your name");
    if (!/^01[3-9][0-9]{8}$/.test(phone)) return toast.error("সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)");
    setSubmitting(true);
    try {
      await submitInquiryFn({
        data: {
          name, phone,
          address: address || null,
          package_id: selectedPkg?.id ?? null,
          package_name: selectedPkg?.name ?? null,
          message: message || null,
        },
      });
      toast.success("আপনার তথ্য গ্রহণ করা হয়েছে! আমরা শীঘ্রই যোগাযোগ করব।");
      if (nameRef.current) nameRef.current.value = "";
      if (phoneRef.current) phoneRef.current.value = "";
      if (addressRef.current) addressRef.current.value = "";
      if (messageRef.current) messageRef.current.value = "";
      setSelectedPkg(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
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
          <div className="flex items-center gap-2
            {session ? (
              <Button onClick={handleLogout} size="sm" className="bg-destructive text-destructive-foreground hover:brightness-110 shadow-glow">
                <LogOut className="mr-2 h-4 w-4" />লগআউট
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth">{t("nav.login")}</Link>
              </Button>
            )}
            <Button asChild size="sm" className="bg-gradient-primary shadow-glow">
              <Link to="/pay-bill">{t("nav.payBill")}</Link>
            </Button>
            <LangToggle />
            <ThemeToggle />
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
              <span>{t("hero.badge")}</span>
            </div>
            <h1 className="mb-6 text-4xl font-extrabold leading-tight md:text-6xl lg:text-7xl">
              {settings?.hero_title ?? t("hero.title")}
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg opacity-90 md:text-xl">
              {settings?.hero_subtitle ?? t("hero.subtitle")}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" onClick={() => scrollToId("contact")} className="bg-background text-foreground hover:bg-background/90 shadow-elevated">
                {t("hero.cta1")} <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => scrollToId("packages")} className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                {t("hero.cta2")}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: t("stats.customers"), value: t("stats.customersValue"), icon: Users },
              { label: t("stats.coverage"), value: t("stats.coverageValue"), icon: MapPin },
              { label: t("stats.uptime"), value: t("stats.uptimeValue"), icon: TrendingUp },
              { label: t("stats.support"), value: t("stats.supportValue"), icon: Headphones },
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
            <h2 className="text-3xl font-bold md:text-4xl">{t("features.title")}</h2>
            <p className="mt-4 text-muted-foreground">{t("features.subtitle")}</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: Zap, title: t("features.speed.title"), desc: t("features.speed.desc"), color: "bg-gradient-primary" },
              { icon: Shield, title: t("features.secure.title"), desc: t("features.secure.desc"), color: "bg-gradient-accent" },
              { icon: Signal, title: t("features.stable.title"), desc: t("features.stable.desc"), color: "bg-gradient-hero" },
              { icon: Router, title: t("features.mikrotik.title"), desc: t("features.mikrotik.desc"), color: "bg-gradient-primary" },
              { icon: Headphones, title: t("features.care.title"), desc: t("features.care.desc"), color: "bg-gradient-accent" },
              { icon: Award, title: t("features.price.title"), desc: t("features.price.desc"), color: "bg-gradient-hero" },
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
            <h2 className="text-3xl font-bold md:text-4xl">{t("packages.title")}</h2>
            <p className="mt-4 text-muted-foreground">{t("packages.subtitle")}</p>
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
                    {t("packages.popular")}
                  </div>
                )}
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: pkg.color ?? "var(--gradient-primary)" }}>
                  <Wifi className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold">{pkg.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">৳{Math.round(Number(pkg.monthly_price))}</span>
                  <span className="text-muted-foreground">{t("packages.perMonth")}</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> {t("packages.download")}: {pkg.download_speed} Mbps</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> {t("packages.upload")}: {pkg.upload_speed} Mbps</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> {t("packages.unlimited")}</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> {t("packages.support247")}</li>
                </ul>
                <Button onClick={() => handleOrder({ id: pkg.id, name: pkg.name })} className={`mt-6 w-full ${pkg.is_popular ? "bg-gradient-primary shadow-glow" : ""}`} variant={pkg.is_popular ? "default" : "outline"}>
                  {t("packages.order")}
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
            <h2 className="text-3xl font-bold md:text-4xl">{t("coverage.title")}</h2>
            <p className="mt-4 text-muted-foreground">{t("coverage.subtitle")}</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {(["city.dhaka","city.chittagong","city.rajshahi","city.khulna","city.sylhet","city.barisal","city.rangpur","city.mymensingh"] as const).map((key) => (
              <div key={key} className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-soft transition-all hover:shadow-elevated">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-semibold">{t(key)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-muted/30 py-20">
        <div className="container mx-auto grid gap-12 px-4 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">{t("about.title")}</h2>
            <p className="mt-4 text-muted-foreground">
              {settings?.about_text ?? `${ispName} — ${t("about.default")}`}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border bg-card p-4">
                <div className="text-3xl font-bold text-primary">{t("about.yearsValue")}</div>
                <div className="text-sm text-muted-foreground">{t("about.years")}</div>
              </div>
              <div className="rounded-2xl border bg-card p-4">
                <div className="text-3xl font-bold text-secondary">{t("about.teamValue")}</div>
                <div className="text-sm text-muted-foreground">{t("about.team")}</div>
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
            <h2 className="text-3xl font-bold md:text-4xl">{t("reviews.title")}</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {([1, 2, 3] as const).map((i) => {
              const name = t(`reviews.${i}.name` as const);
              const loc = t(`reviews.${i}.loc` as const);
              const text = t(`reviews.${i}.text` as const);
              return (
                <div key={i} className="rounded-3xl border bg-gradient-card p-6 shadow-soft">
                  <div className="flex gap-1 text-warning">
                    {Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-4 w-4 fill-current" />)}
                  </div>
                  <p className="mt-4 text-muted-foreground">"{text}"</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-primary text-primary-foreground font-bold">
                      {name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold">{name}</div>
                      <div className="text-xs text-muted-foreground">{loc}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-muted/30 py-20">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">{t("faq.title")}</h2>
          </div>
          <div className="mt-12 space-y-4">
            {([1, 2, 3, 4] as const).map((i) => (
              <details key={i} className="group rounded-2xl border bg-card p-5 shadow-soft">
                <summary className="flex cursor-pointer items-center justify-between font-semibold">
                  {t(`faq.${i}.q` as const)}
                  <ChevronRight className="h-5 w-5 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-muted-foreground">{t(`faq.${i}.a` as const)}</p>
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
                <h2 className="text-3xl font-bold md:text-4xl">{t("contact.title")}</h2>
                <p className="mt-4 opacity-90">{t("contact.subtitle")}</p>
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3"><Phone className="h-5 w-5" /> {hotline}</div>
                  <div className="flex items-center gap-3"><MessageCircle className="h-5 w-5" /> WhatsApp: {whatsapp}</div>
                  {settings?.email && <div className="flex items-center gap-3"><Mail className="h-5 w-5" /> {settings.email}</div>}
                  {settings?.address && <div className="flex items-center gap-3"><MapPin className="h-5 w-5" /> {settings.address}</div>}
                </div>
              </div>
              <div className="glass rounded-2xl p-6">
                <h3 className="text-xl font-bold">{t("contact.quickInquiry")}</h3>
                {selectedPkg && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {selectedPkg.name}
                    <button type="button" onClick={() => setSelectedPkg(null)} className="ml-1 opacity-70 hover:opacity-100">×</button>
                  </div>
                )}
                <form onSubmit={handleInquiry} className="mt-4 space-y-3">
                  <input ref={nameRef} required maxLength={100} placeholder={t("contact.name")} className="w-full rounded-xl border-0 bg-white/20 px-4 py-3 text-white placeholder:text-white/60 outline-none focus:bg-white/30" />
                  <input ref={phoneRef} required maxLength={11} inputMode="tel" pattern="01[3-9][0-9]{8}" placeholder={t("contact.phone")} className="w-full rounded-xl border-0 bg-white/20 px-4 py-3 text-white placeholder:text-white/60 outline-none focus:bg-white/30" />
                  <input ref={addressRef} maxLength={300} placeholder={t("contact.address")} className="w-full rounded-xl border-0 bg-white/20 px-4 py-3 text-white placeholder:text-white/60 outline-none focus:bg-white/30" />
                  <textarea ref={messageRef} maxLength={1000} rows={3} placeholder="Message (optional)" className="w-full rounded-xl border-0 bg-white/20 px-4 py-3 text-white placeholder:text-white/60 outline-none focus:bg-white/30 resize-none" />
                  <Button type="submit" disabled={submitting} className="w-full bg-background text-foreground hover:bg-background/90">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("contact.submit")}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notices ticker */}
      {notices.length > 0 && (
        <section className="border-y bg-warning/10 py-4 overflow-hidden">
          <div className="container mx-auto flex items-center gap-4 px-4">
            <span className="shrink-0 rounded-full bg-warning px-3 py-1 text-xs font-bold text-warning-foreground">{t("notice")}</span>
            <div className="flex-1 overflow-hidden">
              <div className="whitespace-nowrap animate-marquee inline-block">
                {notices.map(n => n.title).join("  •  ")}  •  {notices.map(n => n.title).join("  •  ")}
              </div>
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
            <p className="mt-4 text-sm text-muted-foreground">{t("footer.tagline")}</p>
          </div>
          <div>
            <h4 className="font-bold">{t("footer.quickLinks")}</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><a href="#packages" className="hover:text-primary">{t("nav.packages")}</a></li>
              <li><a href="#coverage" className="hover:text-primary">{t("nav.coverage")}</a></li>
              <li><a href="#faq" className="hover:text-primary">{t("nav.faq")}</a></li>
              <li><Link to="/auth" className="hover:text-primary">{t("nav.login")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold">{t("footer.contact")}</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>{t("contact.hotline")}: {hotline}</li>
              <li>WhatsApp: {whatsapp}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold">{t("footer.developer")}</h4>
            <p className="mt-4 text-sm text-muted-foreground">
              {t("footer.madeBy")} <a href="https://www.technonex.net/" target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">TechnoNex</a>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{t("contact.hotline")}: 01339562416</p>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {ispName}. {t("footer.rights")}
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
        <Zap className="h-5 w-5" /> {t("nav.payBill")}
      </Link>
    </div>
  );
}
