import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { getLandingData } from "@/lib/landing.functions";
import { submitInquiry } from "@/lib/inquiry.functions";
import {
  Wifi, Zap, Shield, Users, Award, Phone, MapPin, Mail, MessageCircle,
  ChevronRight, CheckCircle2, Star, Signal, Router, Headphones, TrendingUp, Loader2, UserCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useLogoUrl } from "@/hooks/use-logo";
import { ThemeToggle, LangToggle } from "@/components/theme-lang-toggles";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LogOut, LayoutDashboard, ShieldCheck } from "lucide-react";
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
  const { t, lang } = useI18n();
  const pickLang = <B extends string, E extends string>(bn: B | undefined | null, en: E | undefined | null) =>
    (lang === "bn" ? (bn || en || "") : (en || bn || ""));
  const lc = (settings?.landing_content ?? {}) as {
    hero_badge_bn?: string; hero_badge_en?: string;
    hero_title_en?: string; hero_subtitle_en?: string; about_text_en?: string;
    features?: Array<{ icon: string; title_bn?: string; title_en?: string; desc_bn?: string; desc_en?: string }>;
    about_stats?: Array<{ value: string; label_bn?: string; label_en?: string }>;
    reviews?: Array<{ name: string; loc_bn?: string; loc_en?: string; text_bn?: string; text_en?: string }>;
    faqs?: Array<{ q_bn?: string; q_en?: string; a_bn?: string; a_en?: string }>;
  };
  const ICON_MAP: Record<string, typeof Zap> = {
    zap: Zap, shield: Shield, signal: Signal, router: Router, headphones: Headphones,
    award: Award, wifi: Wifi, star: Star, phone: Phone, users: Users,
  };
  const { session, signOut } = useAuth();
  const rolesQ = useQuery({
    queryKey: ["my-roles", session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles").select("role").eq("user_id", session!.user.id);
      return (data ?? []).map((r) => r.role as "admin" | "staff" | "customer");
    },
  });
  const isPrivileged = (rolesQ.data ?? []).some((r) => r === "admin" || r === "staff");

  const ispName = settings?.isp_name ?? "Net Bill Pro";
  const hotline = settings?.hotline ?? "01339562416";
  const whatsapp = settings?.whatsapp ?? "01339562416";
  const { data: logoUrl } = useLogoUrl(settings?.logo_url ?? null);

  const submitInquiryFn = useServerFn(submitInquiry);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const [selectedPkg, setSelectedPkg] = useState<{ id: string; name: string; price?: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({ name: "", phone: "", area: "", road: "", house: "", message: "" });
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  const handleOrder = (pkg: { id: string; name: string; price?: number }) => {
    setSelectedPkg(pkg);
    setOrderOpen(true);
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = orderForm.name.trim();
    const phone = orderForm.phone.trim();
    if (name.length < 2) return toast.error(lang === "bn" ? "নাম দিন" : "Enter your name");
    if (!/^01[3-9][0-9]{8}$/.test(phone)) return toast.error(lang === "bn" ? "সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)" : "Enter a valid mobile (01XXXXXXXXX)");
    const area = orderForm.area.trim();
    const road = orderForm.road.trim();
    const house = orderForm.house.trim();
    const addressParts = [
      house ? (lang === "bn" ? `বাসা: ${house}` : `House: ${house}`) : "",
      road ? (lang === "bn" ? `রোড: ${road}` : `Road: ${road}`) : "",
      area ? (lang === "bn" ? `এলাকা: ${area}` : `Area: ${area}`) : "",
    ].filter(Boolean);
    const address = addressParts.join(", ");
    setOrderSubmitting(true);
    try {
      await submitInquiryFn({
        data: {
          name, phone,
          address: address || null,
          package_id: selectedPkg?.id ?? null,
          package_name: selectedPkg?.name ?? null,
          message: orderForm.message.trim() || (selectedPkg ? `Order request for ${selectedPkg.name}` : null),
        },
      });
      toast.success(lang === "bn" ? "অর্ডার গ্রহণ করা হয়েছে! আমরা শীঘ্রই যোগাযোগ করব।" : "Order received! We'll contact you shortly.");
      setOrderOpen(false);
      setOrderForm({ name: "", phone: "", area: "", road: "", house: "", message: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setOrderSubmitting(false);
    }
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
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-glow overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt={ispName} className="h-full w-full object-contain" />
              ) : (
                <Wifi className="h-5 w-5 text-primary-foreground" />
              )}
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
            {!isPrivileged && (
              <Button asChild size="sm" className="bg-gradient-primary shadow-glow">
                <Link to="/pay-bill">{t("nav.payBill")}</Link>
              </Button>
            )}
            <LangToggle />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="আমার অ্যাকাউন্ট"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow hover:brightness-110 transition focus:outline-none"
              >
                <UserCircle2 className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {session ? (
                  <>
                    {isPrivileged && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="cursor-pointer">
                            <ShieldCheck className="h-4 w-4 mr-2" /> এডমিন প্যানেল
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {!isPrivileged && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/customer" className="cursor-pointer">
                            <LayoutDashboard className="h-4 w-4 mr-2" /> আমার পোর্টাল
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={async () => {
                        await signOut();
                        toast.success("লগ আউট হয়েছে");
                      }}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="h-4 w-4 mr-2" /> লগ আউট
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link to="/auth" className="cursor-pointer">
                      <UserCircle2 className="h-4 w-4 mr-2" /> {t("nav.login")}
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
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
              <span>{lang === "bn" ? (lc.hero_badge_bn || t("hero.badge")) : (lc.hero_badge_en || t("hero.badge"))}</span>
            </div>
            <h1 className="mb-6 text-4xl font-extrabold leading-tight md:text-6xl lg:text-7xl">
              {lang === "bn" ? (settings?.hero_title ?? t("hero.title")) : (lc.hero_title_en || t("hero.title"))}
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg opacity-90 md:text-xl">
              {lang === "bn" ? (settings?.hero_subtitle ?? t("hero.subtitle")) : (lc.hero_subtitle_en || t("hero.subtitle"))}
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
            {(lc.features && lc.features.length > 0
              ? lc.features.map((it, idx) => ({
                  icon: ICON_MAP[it.icon] ?? Zap,
                  title: pickLang(it.title_bn, it.title_en),
                  desc: pickLang(it.desc_bn, it.desc_en),
                  color: ["bg-gradient-primary","bg-gradient-accent","bg-gradient-hero"][idx % 3],
                }))
              : [
                  { icon: Zap, title: t("features.speed.title"), desc: t("features.speed.desc"), color: "bg-gradient-primary" },
                  { icon: Shield, title: t("features.secure.title"), desc: t("features.secure.desc"), color: "bg-gradient-accent" },
                  { icon: Signal, title: t("features.stable.title"), desc: t("features.stable.desc"), color: "bg-gradient-hero" },
                  { icon: Router, title: t("features.mikrotik.title"), desc: t("features.mikrotik.desc"), color: "bg-gradient-primary" },
                  { icon: Headphones, title: t("features.care.title"), desc: t("features.care.desc"), color: "bg-gradient-accent" },
                  { icon: Award, title: t("features.price.title"), desc: t("features.price.desc"), color: "bg-gradient-hero" },
                ]
            ).map((f, i) => (
              <div key={f.title + i} className="group rounded-3xl border bg-card p-6 shadow-soft transition-all hover:shadow-elevated hover:-translate-y-1">
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
                <Button onClick={() => handleOrder({ id: pkg.id, name: pkg.name, price: Number(pkg.monthly_price) })} className={`mt-6 w-full ${pkg.is_popular ? "bg-gradient-primary shadow-glow" : ""}`} variant={pkg.is_popular ? "default" : "outline"}>
                  {t("packages.order")}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Order Dialog */}
      <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {lang === "bn" ? "নতুন সংযোগ অর্ডার" : "Order New Connection"}
              {selectedPkg && <span className="ml-2 text-primary">— {selectedPkg.name}</span>}
            </DialogTitle>
            <DialogDescription>
              {selectedPkg?.price
                ? (lang === "bn"
                    ? `৳${Math.round(selectedPkg.price)}/মাস — নিচের তথ্য দিন, আমরা যোগাযোগ করব।`
                    : `৳${Math.round(selectedPkg.price)}/mo — Fill in your details and we'll reach out.`)
                : (lang === "bn"
                    ? "নিচের তথ্য দিন, আমরা শীঘ্রই যোগাযোগ করব।"
                    : "Fill in your details and we'll contact you shortly.")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleOrderSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="order-name">{lang === "bn" ? "নাম *" : "Name *"}</Label>
              <Input id="order-name" required value={orderForm.name}
                onChange={(e) => setOrderForm({ ...orderForm, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="order-phone">{lang === "bn" ? "মোবাইল নম্বর *" : "Mobile Number *"}</Label>
              <Input id="order-phone" required placeholder="01XXXXXXXXX" value={orderForm.phone}
                onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="order-area">{lang === "bn" ? "এলাকা" : "Area"}</Label>
                <Input id="order-area" value={orderForm.area}
                  onChange={(e) => setOrderForm({ ...orderForm, area: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="order-road">{lang === "bn" ? "রোড" : "Road"}</Label>
                <Input id="order-road" value={orderForm.road}
                  onChange={(e) => setOrderForm({ ...orderForm, road: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="order-house">{lang === "bn" ? "বাসা নম্বর" : "House No."}</Label>
                <Input id="order-house" value={orderForm.house}
                  onChange={(e) => setOrderForm({ ...orderForm, house: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="order-message">{lang === "bn" ? "মন্তব্য" : "Message"}</Label>
              <Textarea id="order-message" rows={3} value={orderForm.message}
                onChange={(e) => setOrderForm({ ...orderForm, message: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOrderOpen(false)}>
                {lang === "bn" ? "বাতিল" : "Cancel"}
              </Button>
              <Button type="submit" disabled={orderSubmitting} className="bg-gradient-primary shadow-glow">
                {orderSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {lang === "bn" ? "অর্ডার সাবমিট" : "Submit Order"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
              {lang === "bn"
                ? (settings?.about_text ?? `${ispName} — ${t("about.default")}`)
                : (lc.about_text_en || `${ispName} — ${t("about.default")}`)}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {(lc.about_stats && lc.about_stats.length > 0
                ? lc.about_stats.map((s) => ({ value: s.value, label: pickLang(s.label_bn, s.label_en) }))
                : [
                    { value: t("about.yearsValue"), label: t("about.years") },
                    { value: t("about.teamValue"), label: t("about.team") },
                  ]
              ).map((s, i) => (
                <div key={i} className="rounded-2xl border bg-card p-4">
                  <div className={`text-3xl font-bold ${i % 2 === 0 ? "text-primary" : "text-secondary"}`}>{s.value}</div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                </div>
              ))}
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
            {(lc.reviews && lc.reviews.length > 0
              ? lc.reviews.map((r) => ({ name: r.name, loc: pickLang(r.loc_bn, r.loc_en), text: pickLang(r.text_bn, r.text_en) }))
              : ([1, 2, 3] as const).map((i) => ({
                  name: t(`reviews.${i}.name` as const),
                  loc: t(`reviews.${i}.loc` as const),
                  text: t(`reviews.${i}.text` as const),
                }))
            ).map((r, i) => (
              <div key={i} className="rounded-3xl border bg-gradient-card p-6 shadow-soft">
                <div className="flex gap-1 text-warning">
                  {Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="mt-4 text-muted-foreground">"{r.text}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-primary text-primary-foreground font-bold">
                    {(r.name || "?").charAt(0)}
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
            <h2 className="text-3xl font-bold md:text-4xl">{t("faq.title")}</h2>
          </div>
          <div className="mt-12 space-y-4">
            {(lc.faqs && lc.faqs.length > 0
              ? lc.faqs.map((it) => ({ q: pickLang(it.q_bn, it.q_en), a: pickLang(it.a_bn, it.a_en) }))
              : ([1, 2, 3, 4] as const).map((i) => ({
                  q: t(`faq.${i}.q` as const),
                  a: t(`faq.${i}.a` as const),
                }))
            ).map((it, i) => (
              <details key={i} className="group rounded-2xl border bg-card p-5 shadow-soft">
                <summary className="flex cursor-pointer items-center justify-between font-semibold">
                  {it.q}
                  <ChevronRight className="h-5 w-5 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-muted-foreground">{it.a}</p>
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
                <form onSubmit={handleInquiry} className="mt-4 space-y-3">
                  <input ref={nameRef} required maxLength={100} placeholder={t("contact.name")} className="w-full rounded-xl border-0 bg-white/20 px-4 py-3 text-white placeholder:text-white/60 outline-none focus:bg-white/30" />
                  <input ref={phoneRef} required maxLength={11} inputMode="tel" pattern="01[3-9][0-9]{8}" placeholder={t("contact.phone")} className="w-full rounded-xl border-0 bg-white/20 px-4 py-3 text-white placeholder:text-white/60 outline-none focus:bg-white/30" />
                  <input ref={addressRef} maxLength={300} placeholder={t("contact.address")} className="w-full rounded-xl border-0 bg-white/20 px-4 py-3 text-white placeholder:text-white/60 outline-none focus:bg-white/30" />
                  <select
                    value={selectedPkg?.id ?? ""}
                    onChange={(e) => {
                      const p = packages.find((x) => x.id === e.target.value);
                      setSelectedPkg(p ? { id: p.id, name: p.name, price: Number(p.monthly_price) } : null);
                    }}
                    className="w-full rounded-xl border-0 bg-white/20 px-4 py-3 text-white outline-none focus:bg-white/30 [&>option]:bg-background [&>option]:text-foreground"
                  >
                    <option value="">{lang === "bn" ? "প্যাকেজ নির্বাচন করুন (ঐচ্ছিক)" : "Select a package (optional)"}</option>
                    {packages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ৳{Math.round(Number(p.monthly_price))}/{lang === "bn" ? "মাস" : "mo"}
                      </option>
                    ))}
                  </select>
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
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt={ispName} className="h-full w-full object-contain" />
                ) : (
                  <Wifi className="h-5 w-5 text-primary-foreground" />
                )}
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
              {settings?.email && <li>Email: {settings.email}</li>}
              {settings?.address && <li>{settings.address}</li>}
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
