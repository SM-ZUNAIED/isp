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
    "stats.customersValue": "১০,০০০+",
    "stats.coverageValue": "৫০+",
    "stats.uptimeValue": "৯৯.৯%",
    "stats.supportValue": "২৪/৭",

    "features.title": "কেন আমরা সেরা?",
    "features.subtitle": "প্রযুক্তি, গতি ও সেবায় আমরা সবার চেয়ে এগিয়ে",
    "features.speed.title": "সুপার ফাস্ট স্পিড",
    "features.speed.desc": "আধুনিক ফাইবার অপটিক নেটওয়ার্কে গিগাবিট গতির ইন্টারনেট।",
    "features.secure.title": "নিরাপদ কানেকশন",
    "features.secure.desc": "এন্টারপ্রাইজ-গ্রেড সিকিউরিটি এবং DDoS প্রোটেকশন।",
    "features.stable.title": "স্থিতিশীল সংযোগ",
    "features.stable.desc": "রিডানডেন্ট আপলিংক ও ২৪/৭ মনিটরিং।",
    "features.mikrotik.title": "মিকরোটিক অটোমেশন",
    "features.mikrotik.desc": "সম্পূর্ণ অটোমেটিক PPPoE, Radius ও ব্যান্ডউইথ ব্যবস্থাপনা।",
    "features.care.title": "২৪/৭ কাস্টমার কেয়ার",
    "features.care.desc": "যেকোনো সমস্যায় তাৎক্ষণিক সাপোর্ট।",
    "features.price.title": "সেরা মূল্য",
    "features.price.desc": "বাজারের সেরা প্যাকেজ এবং অসীম ডেটা।",

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
    "city.dhaka": "ঢাকা",
    "city.chittagong": "চট্টগ্রাম",
    "city.rajshahi": "রাজশাহী",
    "city.khulna": "খুলনা",
    "city.sylhet": "সিলেট",
    "city.barisal": "বরিশাল",
    "city.rangpur": "রংপুর",
    "city.mymensingh": "ময়মনসিংহ",

    "about.title": "আমাদের সম্পর্কে",
    "about.default": "বাংলাদেশের একটি অগ্রণী ISP কোম্পানি। আমরা গত কয়েক বছর ধরে দেশের বিভিন্ন প্রান্তে দ্রুতগতির ইন্টারনেট সেবা প্রদান করে আসছি।",
    "about.years": "বছরের অভিজ্ঞতা",
    "about.team": "টেকনিক্যাল টিম",
    "about.yearsValue": "১০+",
    "about.teamValue": "১০০+",

    "reviews.title": "গ্রাহকদের মতামত",
    "reviews.1.name": "মোঃ রফিকুল ইসলাম",
    "reviews.1.loc": "ঢাকা",
    "reviews.1.text": "দুর্দান্ত সেবা! কোনো ডাউনটাইম নেই। ২৪ ঘণ্টা সাপোর্ট সবসময় পাওয়া যায়।",
    "reviews.2.name": "সাবরিনা আক্তার",
    "reviews.2.loc": "চট্টগ্রাম",
    "reviews.2.text": "স্পিড অসাধারণ। বাসায় সবাই একসাথে ব্যবহার করেও কোনো সমস্যা হয় না।",
    "reviews.3.name": "মোঃ কামাল হোসেন",
    "reviews.3.loc": "সিলেট",
    "reviews.3.text": "বিলিং সিস্টেম খুব সহজ। বিকাশ থেকে সরাসরি পেমেন্ট করা যায়।",

    "faq.title": "প্রশ্ন ও উত্তর",
    "faq.1.q": "কানেকশন নিতে কত সময় লাগে?",
    "faq.1.a": "সাধারণত ২৪-৪৮ ঘণ্টার মধ্যে ইনস্টলেশন সম্পন্ন হয়।",
    "faq.2.q": "কীভাবে বিল পরিশোধ করব?",
    "faq.2.a": "বিকাশ, নগদ, রকেট বা ব্যাংক ট্রান্সফারের মাধ্যমে সহজেই বিল দিতে পারবেন।",
    "faq.3.q": "সাপোর্ট কীভাবে পাব?",
    "faq.3.a": "হটলাইন, WhatsApp, অথবা কাস্টমার পোর্টালে টিকিট সাবমিট করে সাপোর্ট নিতে পারবেন।",
    "faq.4.q": "প্যাকেজ পরিবর্তন করতে পারব?",
    "faq.4.a": "হ্যাঁ, যেকোনো সময় প্যাকেজ আপগ্রেড বা ডাউনগ্রেড করা যাবে।",

    "contact.title": "যোগাযোগ করুন",
    "contact.subtitle": "আজই কানেকশন নিতে আমাদের সাথে যোগাযোগ করুন",
    "contact.hotline": "হটলাইন",
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
    "footer.madeBy": "নির্মাতা",
    "footer.rights": "সর্বস্বত্ব সংরক্ষিত।",

    // Pay bill page
    "pay.title": "বিল পরিশোধ করুন",
    "pay.subtitle": "মাত্র কয়েক সেকেন্ডে আপনার মাসিক বিল পরিশোধ করুন",
    "pay.secure": "১০০% নিরাপদ পেমেন্ট",
    "pay.back": "হোমে ফিরুন",
    "pay.step1": "গ্রাহক তথ্য",
    "pay.step1.desc": "আপনার Customer ID অথবা মোবাইল নম্বর দিন",
    "pay.search": "খুঁজুন",
    "pay.placeholder": "যেমন NBP-1024 বা 01XXXXXXXXX",
    "pay.customerId": "কাস্টমার আইডি",
    "pay.due": "বকেয়া",
    "pay.name": "নাম",
    "pay.package": "প্যাকেজ",
    "pay.total": "মোট বিল",
    "pay.step2": "পেমেন্ট মাধ্যম",
    "pay.step2.desc": "যেভাবে পরিশোধ করবেন তা বেছে নিন",
    "pay.wallet": "ওয়ালেট নম্বর",
    "pay.cardNote": "আপনাকে সিকিউর পেমেন্ট গেটওয়েতে পাঠানো হবে।",
    "pay.now": "পরিশোধ করুন",
    "pay.trust.title": "নিরাপদ ও তাৎক্ষণিক",
    "pay.trust.desc": "সকল লেনদেন SSL এনক্রিপশনে সুরক্ষিত। পেমেন্ট নিশ্চিত হলে আপনার সংযোগ সাথে সাথেই সক্রিয় হবে।",
    "pay.trust.1": "তাৎক্ষণিক অ্যাক্টিভেশন",
    "pay.trust.2": "ডিজিটাল রিসিট ইমেইলে",
    "pay.trust.3": "২৪/৭ পেমেন্ট সাপোর্ট",
    "pay.help.title": "সহায়তা প্রয়োজন?",
    "pay.help.desc": "বিল সংক্রান্ত যেকোনো সমস্যায় আমাদের টিম আপনাকে সহায়তা করতে প্রস্তুত।",
    "pay.accept": "গৃহীত পেমেন্ট",
    "pay.method.bkash": "বিকাশ",
    "pay.method.nagad": "নগদ",
    "pay.method.rocket": "রকেট",
    "pay.method.card": "কার্ড",
    "pay.method.bank": "ব্যাংক ট্রান্সফার",
    "pay.err.id": "গ্রাহক আইডি দিন",
    "pay.err.mobile": "সঠিক মোবাইল নম্বর দিন",
    "pay.redirect": "পেমেন্ট গেটওয়ে খোলা হচ্ছে...",

    // Admin panel chrome
    "admin.brand.sub": "ISP অ্যাডমিন প্যানেল",
    "admin.loading": "লোড হচ্ছে...",
    "admin.noAccess.title": "অ্যাক্সেস নেই",
    "admin.noAccess.desc": "এই প্যানেলে প্রবেশের জন্য Admin বা Staff role প্রয়োজন।",
    "admin.noAccess.customer": "কাস্টমার প্যানেলে যান",
    "admin.noAccess.home": "হোম",
    "admin.myAccount": "আমার অ্যাকাউন্ট",
    "admin.myPortal": "আমার পোর্টাল",
    "admin.logout": "লগ আউট",
    "admin.loggedOut": "লগ আউট হয়েছে",
    "admin.login": "লগইন",
    "admin.soon": "শীঘ্রই",
    "admin.payBill": "বিল পরিশোধ",

    // Admin nav
    "admin.nav.dashboard": "ড্যাশবোর্ড",
    "admin.nav.customers": "কাস্টমার",
    "admin.nav.packages": "প্যাকেজ",
    "admin.nav.zones": "জোন / এলাকা",
    "admin.nav.address": "ঠিকানা (BD)",
    "admin.nav.addressReport": "এলাকা রিপোর্ট",
    "admin.nav.bills": "বিল",
    "admin.nav.payments": "পেমেন্ট লগ",
    "admin.nav.mikrotik": "MikroTik",
    "admin.nav.olt": "OLT / ONU",
    "admin.nav.accounts": "একাউন্টস",
    "admin.nav.tickets": "সাপোর্ট টিকেট",
    "admin.nav.notices": "নোটিশ",
    "admin.nav.users": "ইউজার ও রোল",
    "admin.nav.settings": "সেটিংস",

    // Admin dashboard
    "admin.dash.title": "ড্যাশবোর্ড",
    "admin.dash.subtitle": "আপনার ISP ব্যবসার সারসংক্ষেপ",
    "admin.dash.loadError": "লোড করতে সমস্যা হয়েছে",
    "admin.dash.noAdmin.title": "আপনার এখনো Admin অনুমতি নেই",
    "admin.dash.noAdmin.desc": "আপনি যদি এই ISP এর মালিক হন এবং কোনো Admin এখনো সেট করা না থাকে, নিচের বাটনে ক্লিক করে নিজেকে Owner (Admin) হিসেবে দাবি করুন।",
    "admin.dash.customerPortal": "কাস্টমার পোর্টাল",
    "admin.dash.claim": "Owner হিসেবে দাবি করুন",
    "admin.dash.claim.success": "আপনি এখন Owner (Admin)",
    "admin.dash.claim.exists": "ইতিমধ্যে একজন Admin আছেন",
    "admin.dash.claim.failed": "ব্যর্থ",
    "admin.dash.stat.totalCustomers": "মোট কাস্টমার",
    "admin.dash.stat.activeCustomers": "সক্রিয় কাস্টমার",
    "admin.dash.stat.monthlyRevenue": "এই মাসের কালেকশন",
    "admin.dash.stat.pendingBills": "বকেয়া বিল",
    "admin.dash.stat.openTickets": "খোলা টিকেট",
    "admin.dash.stat.onlineDevices": "অনলাইন MikroTik",
    "admin.dash.quick.title": "দ্রুত পরিচিতি",
    "admin.dash.quick.1": "• কাস্টমার, প্যাকেজ, বিল, MikroTik, OLT/ONU মডিউল পরবর্তী ফেজে যুক্ত হবে।",
    "admin.dash.quick.2": "• সব ডেটা আপনার নিজস্ব Supabase ডাটাবেসে সুরক্ষিত (RLS enabled)।",
    "admin.dash.quick.3": "• সাপোর্ট: TechnoNex — 01339562416",
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
    "stats.customersValue": "10,000+",
    "stats.coverageValue": "50+",
    "stats.uptimeValue": "99.9%",
    "stats.supportValue": "24/7",

    "features.title": "Why Choose Us?",
    "features.subtitle": "We lead in technology, speed and service",
    "features.speed.title": "Super Fast Speed",
    "features.speed.desc": "Gigabit-speed internet over modern fiber-optic networks.",
    "features.secure.title": "Secure Connection",
    "features.secure.desc": "Enterprise-grade security with DDoS protection.",
    "features.stable.title": "Stable Uplink",
    "features.stable.desc": "Redundant uplinks with 24/7 monitoring.",
    "features.mikrotik.title": "MikroTik Automation",
    "features.mikrotik.desc": "Fully automated PPPoE, Radius and bandwidth management.",
    "features.care.title": "24/7 Customer Care",
    "features.care.desc": "Instant support for any issue, any time.",
    "features.price.title": "Best Pricing",
    "features.price.desc": "Best packages in the market with unlimited data.",

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
    "city.dhaka": "Dhaka",
    "city.chittagong": "Chittagong",
    "city.rajshahi": "Rajshahi",
    "city.khulna": "Khulna",
    "city.sylhet": "Sylhet",
    "city.barisal": "Barisal",
    "city.rangpur": "Rangpur",
    "city.mymensingh": "Mymensingh",

    "about.title": "About Us",
    "about.default": "A leading ISP in Bangladesh. For several years we've been delivering high-speed internet across the country.",
    "about.years": "Years Experience",
    "about.team": "Technical Team",
    "about.yearsValue": "10+",
    "about.teamValue": "100+",

    "reviews.title": "Customer Reviews",
    "reviews.1.name": "Md. Rafiqul Islam",
    "reviews.1.loc": "Dhaka",
    "reviews.1.text": "Excellent service! Zero downtime. 24-hour support is always available.",
    "reviews.2.name": "Sabrina Akhter",
    "reviews.2.loc": "Chittagong",
    "reviews.2.text": "Amazing speed. No issue even when the whole family uses it together.",
    "reviews.3.name": "Md. Kamal Hossain",
    "reviews.3.loc": "Sylhet",
    "reviews.3.text": "The billing system is very easy. Payment directly from bKash works.",

    "faq.title": "Questions & Answers",
    "faq.1.q": "How long does installation take?",
    "faq.1.a": "Installation is typically completed within 24-48 hours.",
    "faq.2.q": "How do I pay my bill?",
    "faq.2.a": "You can pay via bKash, Nagad, Rocket or bank transfer easily.",
    "faq.3.q": "How do I get support?",
    "faq.3.a": "Reach us via hotline, WhatsApp, or by submitting a ticket in the customer portal.",
    "faq.4.q": "Can I change my package?",
    "faq.4.a": "Yes, you can upgrade or downgrade your package any time.",

    "contact.title": "Get In Touch",
    "contact.subtitle": "Contact us today to get connected",
    "contact.hotline": "Hotline",
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
    "footer.madeBy": "Made by",
    "footer.rights": "All rights reserved.",

    // Pay bill page
    "pay.title": "Pay Your Bill",
    "pay.subtitle": "Settle your monthly bill in seconds",
    "pay.secure": "100% Secure Payment",
    "pay.back": "Back to Home",
    "pay.step1": "Customer Lookup",
    "pay.step1.desc": "Enter your Customer ID or mobile number",
    "pay.search": "Search",
    "pay.placeholder": "e.g. NBP-1024 or 01XXXXXXXXX",
    "pay.customerId": "Customer ID",
    "pay.due": "Due",
    "pay.name": "Name",
    "pay.package": "Package",
    "pay.total": "Total Amount",
    "pay.step2": "Payment Method",
    "pay.step2.desc": "Choose how you'd like to pay",
    "pay.wallet": "Wallet Number",
    "pay.cardNote": "You'll be redirected to a secure gateway.",
    "pay.now": "Pay Now",
    "pay.trust.title": "Safe & Instant",
    "pay.trust.desc": "All transactions are protected with SSL encryption. Your connection activates as soon as payment is confirmed.",
    "pay.trust.1": "Instant activation",
    "pay.trust.2": "Digital receipt via email",
    "pay.trust.3": "24/7 payment support",
    "pay.help.title": "Need Help?",
    "pay.help.desc": "Our team is ready to assist with any billing questions.",
    "pay.accept": "We Accept",
    "pay.method.bkash": "bKash",
    "pay.method.nagad": "Nagad",
    "pay.method.rocket": "Rocket",
    "pay.method.card": "Debit / Credit Card",
    "pay.method.bank": "Bank Transfer",
    "pay.err.id": "Enter Customer ID",
    "pay.err.mobile": "Enter a valid mobile number",
    "pay.redirect": "Redirecting to gateway...",

    // Admin panel chrome
    "admin.brand.sub": "ISP Admin Panel",
    "admin.loading": "Loading...",
    "admin.noAccess.title": "No Access",
    "admin.noAccess.desc": "Admin or Staff role is required to access this panel.",
    "admin.noAccess.customer": "Go to Customer Panel",
    "admin.noAccess.home": "Home",
    "admin.myAccount": "My Account",
    "admin.myPortal": "My Portal",
    "admin.logout": "Log Out",
    "admin.loggedOut": "Logged out",
    "admin.login": "Log In",
    "admin.soon": "Soon",
    "admin.payBill": "Pay Bill",

    // Admin nav
    "admin.nav.dashboard": "Dashboard",
    "admin.nav.customers": "Customers",
    "admin.nav.packages": "Packages",
    "admin.nav.zones": "Zones / Areas",
    "admin.nav.address": "Address (BD)",
    "admin.nav.addressReport": "Area Report",
    "admin.nav.bills": "Bills",
    "admin.nav.payments": "Payment Log",
    "admin.nav.mikrotik": "MikroTik",
    "admin.nav.olt": "OLT / ONU",
    "admin.nav.accounts": "Accounts",
    "admin.nav.tickets": "Support Tickets",
    "admin.nav.notices": "Notices",
    "admin.nav.users": "Users & Roles",
    "admin.nav.settings": "Settings",

    // Admin dashboard
    "admin.dash.title": "Dashboard",
    "admin.dash.subtitle": "Overview of your ISP business",
    "admin.dash.loadError": "Failed to load",
    "admin.dash.noAdmin.title": "You don't have Admin permission yet",
    "admin.dash.noAdmin.desc": "If you are the owner of this ISP and no Admin has been set up yet, click the button below to claim yourself as the Owner (Admin).",
    "admin.dash.customerPortal": "Customer Portal",
    "admin.dash.claim": "Claim as Owner",
    "admin.dash.claim.success": "You are now the Owner (Admin)",
    "admin.dash.claim.exists": "An Admin already exists",
    "admin.dash.claim.failed": "Failed",
    "admin.dash.stat.totalCustomers": "Total Customers",
    "admin.dash.stat.activeCustomers": "Active Customers",
    "admin.dash.stat.monthlyRevenue": "This Month's Revenue",
    "admin.dash.stat.pendingBills": "Pending Bills",
    "admin.dash.stat.openTickets": "Open Tickets",
    "admin.dash.stat.onlineDevices": "Online MikroTik",
    "admin.dash.quick.title": "Quick Info",
    "admin.dash.quick.1": "• Customers, packages, bills, MikroTik and OLT/ONU modules will be added in the next phase.",
    "admin.dash.quick.2": "• All data is secured in your own Supabase database (RLS enabled).",
    "admin.dash.quick.3": "• Support: TechnoNex — 01339562416",
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

    const onStorage = (e: StorageEvent) => {
      if (e.key === "lang" && (e.newValue === "bn" || e.newValue === "en")) {
        setLangState(e.newValue);
      }
    };
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<Lang>).detail;
      if (detail === "bn" || detail === "en") setLangState(detail);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("lang-change", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("lang-change", onCustom as EventListener);
    };
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
    try { localStorage.setItem("lang", lang); } catch {}
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { window.dispatchEvent(new CustomEvent("lang-change", { detail: l })); } catch {}
  };
  const toggle = () => setLang(lang === "bn" ? "en" : "bn");

  const t = (k: Key) => (dict[lang] as Record<string, string>)[k] ?? k;
  return (
    <I18nContext.Provider value={{ lang, setLang, toggle, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

/**
 * Inline translator for ad-hoc strings that don't need to live in the dictionary.
 * Usage:  const tx = useTx(); tx("বাংলা", "English")
 */
export function useTx() {
  const { lang } = useI18n();
  return (bn: string, en: string) => (lang === "bn" ? bn : en);
}

/** Language-aware number and currency formatters. */
export function useFmt() {
  const { lang } = useI18n();
  const nf = new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-US");
  return {
    lang,
    n: (v: number) => nf.format(v),
    bdt: (v: number) => (lang === "bn" ? `৳ ${nf.format(Math.round(v))}` : `BDT ${nf.format(Math.round(v))}`),
  };
}

