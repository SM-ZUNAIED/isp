import { createFileRoute, Link, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Package,
  Receipt,
  Wallet,
  Router as RouterIcon,
  Radio,
  Ticket,
  Bell,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  UserCog,
  ShieldAlert,
  MapPin,
  BarChart3,
  UserCircle2,
  Users2,
  ChevronDown, Home,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ThemeToggle, LangToggle } from "@/components/theme-lang-toggles";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useI18n } from "@/hooks/use-i18n";
import { getSettings } from "@/lib/support.functions";
import { useLogoUrl } from "@/hooks/use-logo";
import { supabase } from "@/integrations/supabase/client";

const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId);
    return (data ?? []).map((r) => r.role as "admin" | "staff" | "customer");
  });

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

type NavKey =
  | "admin.nav.dashboard" | "admin.nav.customers" | "admin.nav.staff" | "admin.nav.packages" | "admin.nav.zones"
  | "admin.nav.address" | "admin.nav.addressReport" | "admin.nav.bills" | "admin.nav.payments"
  | "admin.nav.mikrotik" | "admin.nav.olt" | "admin.nav.accounts" | "admin.nav.tickets"
  | "admin.nav.notices" | "admin.nav.users" | "admin.nav.settings";

type NavLink =
  | { kind: "link"; to: string; icon: typeof LayoutDashboard; exact?: boolean; disabled?: boolean; adminOnly?: boolean; labelKey: NavKey }
  | { kind: "link"; to: string; icon: typeof LayoutDashboard; exact?: boolean; disabled?: boolean; adminOnly?: boolean; label: { bn: string; en: string } };

type NavItem =
  | NavLink
  | { kind: "section"; label: { bn: string; en: string } }
  | { kind: "group"; id: string; icon: typeof LayoutDashboard; label: { bn: string; en: string }; children: NavLink[] };

const NAV: Array<NavItem> = [
  { kind: "section", label: { bn: "কোর", en: "Core" } },
  { kind: "link", to: "/admin", labelKey: "admin.nav.dashboard", icon: LayoutDashboard, exact: true },
  { kind: "link", to: "/admin/customers", labelKey: "admin.nav.customers", icon: Users },
  { kind: "link", to: "/admin/packages", labelKey: "admin.nav.packages", icon: Package },
  { kind: "link", to: "/admin/zones", labelKey: "admin.nav.zones", icon: Radio },
  { kind: "link", to: "/admin/address", labelKey: "admin.nav.address", icon: MapPin, adminOnly: true },
  { kind: "link", to: "/admin/reports/address", labelKey: "admin.nav.addressReport", icon: BarChart3 },
  { kind: "link", to: "/admin/bills", labelKey: "admin.nav.bills", icon: Receipt },
  { kind: "link", to: "/admin/payments", labelKey: "admin.nav.payments", icon: Wallet },
  { kind: "link", to: "/admin/mikrotik", labelKey: "admin.nav.mikrotik", icon: RouterIcon },
  { kind: "link", to: "/admin/olt", labelKey: "admin.nav.olt", icon: Radio },
  { kind: "link", to: "/admin/tickets", labelKey: "admin.nav.tickets", icon: Ticket },
  { kind: "link", to: "/admin/notices", labelKey: "admin.nav.notices", icon: Bell },

  { kind: "section", label: { bn: "অ্যাডমিন", en: "Admin" } },
  { kind: "link", to: "/admin/staff", labelKey: "admin.nav.staff", icon: Users2, adminOnly: true },
  { kind: "link", to: "/admin/accounts", labelKey: "admin.nav.accounts", icon: Wallet },
  { kind: "link", to: "/admin/users", labelKey: "admin.nav.users", icon: UserCog, adminOnly: true },
  { kind: "link", to: "/admin/settings", labelKey: "admin.nav.settings", icon: SettingsIcon, adminOnly: true },
];


function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const fetchSettingsFn = useServerFn(getSettings);
  const settingsQ = useQuery({ queryKey: ["settings"], queryFn: () => fetchSettingsFn(), staleTime: 5 * 60 * 1000 });
  const brandName = settingsQ.data?.isp_name?.trim() || "Net Bill Pro";
  const fetchRoles = useServerFn(getMyRoles);
  const rolesQ = useQuery({
    queryKey: ["my-roles", user?.id],
    queryFn: () => fetchRoles(),
    enabled: !!user?.id,
    retry: 1,
    staleTime: 0,
  });
  const roles = rolesQ.data ?? [];
  const isAdmin = roles.includes("admin");
  const isStaff = roles.includes("staff");
  const hasAccess = isAdmin || isStaff;

  if (rolesQ.isLoading || rolesQ.isFetching && !rolesQ.data) {
    return <div className="grid min-h-screen place-items-center"><div className="text-muted-foreground text-sm">{t("admin.loading")}</div></div>;
  }

  if (!hasAccess) {
    const errMsg = rolesQ.error ? (rolesQ.error as Error).message : null;
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">{t("admin.noAccess.title")}</h1>
          <p className="text-muted-foreground">{t("admin.noAccess.desc")}</p>
          {user?.email && (
            <p className="text-xs text-muted-foreground">
              Signed in as <span className="font-medium">{user.email}</span>
            </p>
          )}
          {errMsg && (
            <p className="text-xs text-destructive break-words">{errMsg}</p>
          )}
          <div className="flex gap-2 justify-center flex-wrap">
            <Button variant="outline" onClick={() => rolesQ.refetch()}>Retry</Button>
            <Button
              variant="outline"
              onClick={async () => {
                await signOut();
                navigate({ to: "/auth", replace: true });
              }}
            >
              Sign out & login again
            </Button>
            <Link to="/"><Button className="bg-gradient-primary text-white">{t("admin.noAccess.home")}</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r bg-card">
        <SidebarContent isAdmin={isAdmin} />
      </aside>

      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b bg-card px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <BrandLogo size={9} />
          <span>{brandName}</span>
        </Link>
        <div className="flex items-center gap-2">
          <TopBarActions />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SidebarContent isAdmin={isAdmin} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="lg:pl-64">
        <div className="hidden lg:flex sticky top-0 z-30 h-16 items-center justify-end gap-2 border-b bg-card/80 backdrop-blur px-6">
          <TopBarActions />
        </div>
        <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function TopBarActions() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-2">
      <LangToggle />
      <ThemeToggle />

    </div>
  );
}

function SidebarContent({ isAdmin, onNavigate }: { isAdmin: boolean; onNavigate?: () => void }) {
  const { user, signOut } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const fetchSettingsFn = useServerFn(getSettings);
  const settingsQ = useQuery({ queryKey: ["settings"], queryFn: () => fetchSettingsFn(), staleTime: 5 * 60 * 1000 });
  const brandName = settingsQ.data?.isp_name?.trim() || "Net Bill Pro";
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-5">
        <div className="flex items-center gap-2">
          <BrandLogo size={10} />
          <div className="flex-1 min-w-0">
            <div className="font-bold leading-tight truncate">{brandName}</div>
            <div className="text-xs text-muted-foreground truncate">{t("admin.brand.sub")}</div>
          </div>
          <Link
            to="/"
            title="Home"
            aria-label="Home"
            className="grid h-8 w-8 place-items-center rounded-lg border bg-background text-muted-foreground hover:bg-gradient-primary hover:text-white hover:border-transparent transition shadow-soft"
          >
            <Home className="h-4 w-4" />
          </Link>
        </div>
      </div>


      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.filter((n) => n.kind === "section" || n.kind === "group" || !n.adminOnly || isAdmin).map((item, i) => {
          if (item.kind === "section") {
            return (
              <div key={`s-${i}`} className="pt-3 pb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {lang === "en" ? item.label.en : item.label.bn}
              </div>
            );
          }
          if (item.kind === "group") {
            const GIcon = item.icon;
            const isOpen = !!openGroups[item.id];
            const groupLabel = lang === "en" ? item.label.en : item.label.bn;
            const anyChildActive = item.children.some((c) =>
              c.exact ? location.pathname === c.to : location.pathname.startsWith(c.to),
            );
            return (
              <div key={`g-${item.id}`} className="space-y-1">
                <button
                  onClick={() => setOpenGroups((s) => ({ ...s, [item.id]: !s[item.id] }))}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    anyChildActive && !isOpen
                      ? "bg-gradient-primary text-white shadow-soft"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <GIcon className="h-4 w-4" />
                  <span className="flex-1 text-left">{groupLabel}</span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="ml-3 border-l pl-2 space-y-1">
                    {item.children.map((child, ci) => {
                      const cActive = child.exact
                        ? location.pathname === child.to
                        : location.pathname.startsWith(child.to);
                      const CIcon = child.icon;
                      const clabel = "labelKey" in child ? t(child.labelKey) : (lang === "en" ? child.label.en : child.label.bn);
                      return (
                        <button
                          key={ci}
                          onClick={() => {
                            navigate({ to: child.to as "/admin" });
                            onNavigate?.();
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                            cActive
                              ? "bg-gradient-primary text-white shadow-soft"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          <CIcon className="h-4 w-4" />
                          <span className="flex-1 text-left">{clabel}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          const active = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to) && !item.exact;
          const Icon = item.icon;
          const label = "labelKey" in item ? t(item.labelKey) : (lang === "en" ? item.label.en : item.label.bn);
          return (
            <button
              key={i}
              onClick={() => {
                if (item.disabled) return;
                navigate({ to: item.to as "/admin" });
                onNavigate?.();
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-gradient-primary text-white shadow-soft"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 text-left">{label}</span>
              {item.disabled && <span className="text-[10px] rounded bg-muted px-1.5 py-0.5">{t("admin.soon")}</span>}
            </button>
          );
        })}
      </nav>



      <div className="border-t p-3">
        <div className="mb-2 px-2 text-xs text-muted-foreground truncate">{user?.email}</div>
        <Button
          className="w-full justify-start bg-destructive text-destructive-foreground hover:brightness-110 shadow-soft"
          onClick={async () => {
            await signOut();
            navigate({ to: "/", replace: true });
          }}
        >
          <LogOut className="mr-2 h-4 w-4" /> {t("admin.logout")}
        </Button>
      </div>
    </div>
  );
}

function BrandLogo({ size = 10 }: { size?: number }) {
  const fetchSettings = useServerFn(getSettings);
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetchSettings(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  useEffect(() => {
    const ch = supabase
      .channel(`settings-sync-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "settings" },
        () => {
          qc.invalidateQueries({ queryKey: ["settings"] });
          qc.invalidateQueries({ queryKey: ["logo"] });
          qc.invalidateQueries({ queryKey: ["landing"] });
          qc.invalidateQueries({ queryKey: ["site-meta"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);
  const { data: url } = useLogoUrl(q.data?.logo_url ?? null);
  const cls = `grid place-items-center rounded-xl font-bold overflow-hidden h-${size} w-${size} ${url ? "" : "bg-gradient-primary text-white"}`;
  return (
    <div className={cls} style={{ height: `${size * 0.25}rem`, width: `${size * 0.25}rem` }}>
      {url ? <img src={url} alt="logo" className="h-full w-full object-contain" /> : "NB"}
    </div>
  );
}
