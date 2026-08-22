// Client-safe constants shared by admin access UI and the reseller portal.

export type ResellerModuleKey =
  | "dashboard"
  | "sms"
  | "accounts_history"
  | "mikrotik"
  | "manager"
  | "pop"
  | "package"
  | "customer_search"
  | "customers"
  | "support"
  | "accounts"
  | "reports"
  | "admin";

export const RESELLER_MODULES: ResellerModuleKey[] = [
  "dashboard",
  "sms",
  "accounts_history",
  "mikrotik",
  "manager",
  "pop",
  "package",
  "customer_search",
  "customers",
  "support",
  "accounts",
  "reports",
  "admin",
];

export const RESELLER_MODULE_LABELS: Record<ResellerModuleKey, { bn: string; en: string }> = {
  dashboard: { bn: "ড্যাশবোর্ড", en: "Dashboard" },
  sms: { bn: "এসএমএস", en: "SMS" },
  accounts_history: { bn: "অ্যাকাউন্টস হিস্ট্রি", en: "Accounts History" },
  mikrotik: { bn: "মাইক্রোটিক", en: "Mikrotik" },
  manager: { bn: "ম্যানেজার", en: "Manager" },
  pop: { bn: "পপ (POP)", en: "POP" },
  package: { bn: "প্যাকেজ", en: "Package" },
  customer_search: { bn: "কাস্টমার সার্চ", en: "Customer Search" },
  customers: { bn: "কাস্টমার", en: "Customers" },
  support: { bn: "সাপোর্ট", en: "Support" },
  accounts: { bn: "অ্যাকাউন্টস", en: "Accounts" },
  reports: { bn: "রিপোর্ট", en: "Reports" },
  admin: { bn: "অ্যাডমিন (রিসেলার)", en: "Admin (Reseller)" },
};

export const RESELLER_MODULE_GROUPS: Array<{
  id: string;
  label: { bn: string; en: string };
  keys: ResellerModuleKey[];
}> = [
  { id: "customer", label: { bn: "কাস্টমার ম্যানেজমেন্ট", en: "Customer Management" }, keys: ["customer_search", "customers"] },
  { id: "financial", label: { bn: "ফিনান্সিয়াল", en: "Financial" }, keys: ["accounts", "accounts_history", "reports"] },
  { id: "network", label: { bn: "নেটওয়ার্ক", en: "Network" }, keys: ["mikrotik", "manager", "pop", "package"] },
  { id: "communication", label: { bn: "কমিউনিকেশন", en: "Communication" }, keys: ["sms", "support"] },
];

/** Modules that only ever support read access. */
export const VIEW_ONLY_MODULES: ResellerModuleKey[] = [
  "dashboard",
  "accounts_history",
  "customer_search",
  "reports",
];

export const DEFAULT_RESELLER_MODULES: ResellerModuleKey[] = ["dashboard", "customers", "customer_search"];

export type ResellerPerm = {
  permission_key: ResellerModuleKey;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
};
