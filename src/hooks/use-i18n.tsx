import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "bn" | "en";

const dict = {
  bn: {
    "nav.packages": "প্যাকেজ",
    "nav.coverage": "কাভারেজ",
    "nav.about": "আমাদের সম্পর্কে",
    "nav.faq": "প্রশ্ন-উত্তর",
    "nav.contact": "যোগাযোগ",
    "nav.login": "কাস্টমার লগইন",
    "nav.payBill": "বিল পরিশোধ",

    "hero.badge": "বাংলাদেশের ১ নম্বর ISP সফটওয়্যার",
    "hero.title": "দ্রুতগতির ফাইবার ইন্টারনেট",
    "hero.subtitle": "আপনার ঘরে ঘরে পৌঁছে দিচ্ছি বিশ্বমানের ইন্টারনেট সেবা। অসীম ব্যান্ডউইথ, ২৪/৭ সাপোর্ট।",
    "hero.cta1": "এখনই কানেকশন নিন",
    "hero.cta2": "প্যাকেজ দেখুন",

    "stats.customers": "গ্রাহক",
    "stats.coverage": "কাভারেজ এলাকা",
    "stats.uptime": "আপটাইম",
    "stats.support": "সাপোর্ট",

    "features.title": "কেন আমরা সেরা?",
    "features.subtitle": "প্রযুক্তি, গতি ও সেবায় আমরা সবার চেয়ে এগিয়ে",

    "packages.title": "আমাদের ইন্টারনেট প্যাকেজ",
    "packages.subtitle": "আপনার প্রয়োজন অনুযায়ী প্যাকেজ বেছে নিন",
    "packages.popular": "জনপ্রিয়",
    "packages.download": "ডাউনলোড",
    "packages.upload": "আপলোড",
    "packages.unlimited": "অসীম ব্যান্ডউইথ",
    "packages.support247": "২৪/৭ সাপোর্ট",
    "packages.order": "অর্ডার করুন",
    "packages.perMonth": "/মাস",

    "coverage.title": "আমাদের কাভারেজ এলাকা",
    "coverage.subtitle": "সারা বাংলাদেশে ছড়িয়ে আছে আমাদের নেটওয়ার্ক",

    "about.title": "আমাদের সম্পর্কে",
    "about.years": "বছরের অভিজ্ঞতা",
    "about.team": "টেকনিক্যাল টিম",

    "reviews.title": "গ্রাহকদের মতামত",

    "faq.title": "প্রশ্ন ও উত্তর",

    "contact.title": "যোগাযোগ করুন",
    "contact.subtitle": "আজই কানেকশন নিতে আমাদের সাথে যোগাযোগ করুন",
    "contact.quickInquiry": "দ্রুত অনুসন্ধান",
    "contact.name": "আপনার নাম",
    "contact.phone": "মোবাইল নম্বর",
    "contact.address": "ঠিকানা",
    "contact.submit": "অনুসন্ধান করুন",

    "notice": "নোটিশ",
    "footer.tagline": "বাংলাদেশের সেরা ISP সেবাদাতা প্রতিষ্ঠান।",
    "footer.quickLinks": "দ্রুত লিংক",
    "footer.contact": "যোগাযোগ",
    "footer.developer": "ডেভেলপার",
    "footer.rights": "সর্বস্বত্ব সংরক্ষিত।",
  },
  en: {
    "nav.packages": "Packages",
    "nav.coverage": "Coverage",
    "nav.about": "About Us",
    "nav.faq": "FAQ",
    "nav.contact": "Contact",
    "nav.login": "Customer Login",
    "nav.payBill": "Pay Bill",

    "hero.badge": "Bangladesh's #1 ISP Software",
    "hero.title": "High-Speed Fiber Internet",
    "hero.subtitle": "Delivering world-class internet to every home. Unlimited bandwidth, 24/7 support.",
    "hero.cta1": "Get Connection Now",
    "hero.cta2": "View Packages",

    "stats.customers": "Customers",
    "stats.coverage": "Coverage Areas",
    "stats.uptime": "Uptime",
    "stats.support": "Support",

    "features.title": "Why Choose Us?",
    "features.subtitle": "We lead in technology, speed and service",

    "packages.title": "Our Internet Packages",
    "packages.subtitle": "Choose the package that fits your needs",
    "packages.popular": "Popular",
    "packages.download": "Download",
    "packages.upload": "Upload",
    "packages.unlimited": "Unlimited Bandwidth",
    "packages.support247": "24/7 Support",
    "packages.order": "Order Now",
    "packages.perMonth": "/mo",

    "coverage.title": "Our Coverage Areas",
    "coverage.subtitle": "Our network spans across Bangladesh",

    "about.title": "About Us",
    "about.years": "Years Experience",
    "about.team": "Technical Team",

    "reviews.title": "Customer Reviews",

    "faq.title": "Questions & Answers",

    "contact.title": "Get In Touch",
    "contact.subtitle": "Contact us today to get connected",
    "contact.quickInquiry": "Quick Inquiry",
    "contact.name": "Your Name",
    "contact.phone": "Mobile Number",
    "contact.address": "Address",
    "contact.submit": "Send Inquiry",

    "notice": "Notice",
    "footer.tagline": "Bangladesh's leading ISP provider.",
    "footer.quickLinks": "Quick Links",
    "footer.contact": "Contact",
    "footer.developer": "Developer",
    "footer.rights": "All rights reserved.",
  },
} as const;

type Key = keyof (typeof dict)["bn"];

type Ctx = { lang: Lang; setLang: (l: Lang) => void; toggle: () => void; t: (k: Key) => string };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("bn");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("lang")) as Lang | null;
    if (stored === "bn" || stored === "en") setLangState(stored);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
    try { localStorage.setItem("lang", lang); } catch {}
  }, [lang]);

  const t = (k: Key) => dict[lang][k] ?? k;
  return (
    <I18nContext.Provider value={{ lang, setLang: setLangState, toggle: () => setLangState((l) => (l === "bn" ? "en" : "bn")), t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
