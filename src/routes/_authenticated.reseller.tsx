import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, createContext, useContext } from "react";
import {
  LayoutDashboard, MessageSquare, History, Router as RouterIcon, UserCog, MapPin, Package,
  Search, Users, LifeBuoy, Wallet, BarChart3, ShieldCheck, UserCircle2, LogOut, Menu, Loader2, ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { ThemeToggle, LangToggle } from "@/components/theme-lang-toggles";
import { getMyResellerContext } from "@/lib/reseller.functions";
import { RESELLER_MODULE_LABELS, type ResellerModuleKey, type ResellerPerm } from "@/lib/reseller-keys";

export const Route = createFileRoute("/_authenticated/reseller")({
  component: ResellerLayout,
});

type Ctx = {
  reseller: { id: string; name: string; business_name: string | null; current_balance: number } | null;
  can: (k: ResellerModuleKey, a?: "view" | "create" | "edit" | "delete") => boolean;
};

const ResellerCtx = createContext<Ctx>({ reseller: null, can: () => false });
export function useResellerCtx() {
  return useContext(ResellerCtx);
}

const NAV: Array<{ to: string; key: ResellerModuleKey; icon: typeof LayoutDashboard; exact?: boolean }> = [
  { to: "/reseller", key: "dashboard", icon: LayoutDashboard, exact: true },
  { to: "/reseller/sms", key: "sms", icon: MessageSquare },
  { to: "/reseller/accounts-history", key: "accounts_history", icon: History },
  { to: "/reseller/mikrotik", key: "mikrotik", icon: RouterIcon },
  { to: "/reseller/manager", key: "manager", icon: UserCog },
  { to: "/reseller/pop", key: "pop", icon: MapPin },
  { to: "/reseller/packages", key: "package", icon: Package },
  { to: "/reseller/customer-search", key: "customer_search", icon: Search },
  { to: "/reseller/customers", key: "customers", icon: Users },
  { to: "/reseller/support", key: "support", icon: LifeBuoy },
  { to: "/reseller/accounts", key: "accounts", icon: Wallet },
  { to: "/reseller/reports", key: "reports", icon: BarChart3 },
  { to: "/reseller/admin", key: "admin", icon: ShieldCheck },
];

function ResellerLayout() {
  const [open, setOpen] = useState(false);
  const { lang } = useI18n();
  const L = (b: { bn: string; en: string }) => (lang === "en" ? b.en : b.bn);
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const ctxFn = useServerFn(getMyResellerContext);
  const q = useQuery({ queryKey: ["reseller-context"], queryFn: () => ctxFn(), staleTime: 30_000 });

  if (q.isLoading) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const reseller = q.data?.reseller ?? null;
  const perms = (q.data?.permissions ?? []) as ResellerPerm[];

  if (!reseller || reseller.status !== "active") {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">{L({ bn: "অ্যাক্সেস নেই", en: "No access" })}</h1>
          <p className="text-muted-foreground">
            {L({ bn: "আপনার রিসেলার অ্যাকাউন্ট সক্রিয় নয় বা নেই।", en: "Your reseller account is missing or not active." })}
          </p>
          <Button variant="outline" onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}>
            <LogOut className="mr-2 h-4 w-4" />{L({ bn: "লগআউট", en: "Logout" })}
          </Button>
        </div>
      </div>
    );
  }

  const can: Ctx["can"] = (k, a = "view") => {
    const p = perms.find((x) => x.permission_key === k);
    if (!p || !p.can_view) return false;
    if (a === "view") return true;
    if (a === "create") return p.can_create;
    if (a === "edit") return p.can_edit;
    return p.can_delete;
  };

  const items = NAV.filter((n) => can(n.key));
  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const SidebarBody = (
    <nav className="space-y-1 p-3">
      {items.map((n) => (
        <Link
          key={n.to}
          to={n.to}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
            isActive(n.to, n.exact) ? "bg-primary text-primary-foreground" : "hover:bg-muted",
          )}
        >
          <n.icon className="h-4 w-4" />
          {L(RESELLER_MODULE_LABELS[n.key])}
        </Link>
      ))}
      <Link
        to="/reseller/profile"
        onClick={() => setOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
          isActive("/reseller/profile") ? "bg-primary text-primary-foreground" : "hover:bg-muted",
        )}
      >
        <UserCircle2 className="h-4 w-4" />
        {L({ bn: "প্রোফাইল", en: "Profile" })}
      </Link>
    </nav>
  );

  return (
    <ResellerCtx.Provider value={{ reseller, can }}>
      <div className="flex min-h-screen bg-background">
        <aside className="hidden w-64 shrink-0 border-r lg:block">
          <div className="border-b p-4">
            <div className="font-bold">{reseller.business_name || reseller.name}</div>
            <div className="text-xs text-muted-foreground">{L({ bn: "রিসেলার প্যানেল", en: "Reseller Panel" })}</div>
          </div>
          {SidebarBody}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b px-4 py-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost" className="lg:hidden"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">{SidebarBody}</SheetContent>
            </Sheet>
            <div className="font-semibold">{L({ bn: "রিসেলার ড্যাশবোর্ড", en: "Reseller Dashboard" })}</div>
            <Badge variant="secondary" className="ml-auto">
              {L({ bn: "ব্যালেন্স", en: "Balance" })}: ৳{Number(reseller.current_balance ?? 0).toLocaleString()}
            </Badge>
            <LangToggle />
            <ThemeToggle />
            <Button size="icon" variant="ghost" onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </header>
          <main className="min-w-0 flex-1 p-4 md:p-6"><Outlet /></main>
        </div>
      </div>
    </ResellerCtx.Provider>
  );
}
