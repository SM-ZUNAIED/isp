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
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

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

const NAV: Array<{ to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean; disabled?: boolean; adminOnly?: boolean }> = [
  { to: "/admin", label: "ড্যাশবোর্ড", icon: LayoutDashboard, exact: true },
  { to: "/admin/customers", label: "কাস্টমার", icon: Users },
  { to: "/admin/packages", label: "প্যাকেজ", icon: Package },
  { to: "/admin/zones", label: "জোন / এলাকা", icon: Radio },
  { to: "/admin/address", label: "ঠিকানা (BD)", icon: MapPin, adminOnly: true },
  { to: "/admin/bills", label: "বিল", icon: Receipt },
  { to: "/admin/payments", label: "পেমেন্ট লগ", icon: Wallet },
  { to: "/admin/mikrotik", label: "MikroTik", icon: RouterIcon },
  { to: "/admin/olt", label: "OLT / ONU", icon: Radio },
  { to: "/admin/accounts", label: "একাউন্টস", icon: Wallet },
  { to: "/admin/tickets", label: "সাপোর্ট টিকেট", icon: Ticket },
  { to: "/admin/notices", label: "নোটিশ", icon: Bell },
  { to: "/admin/users", label: "ইউজার ও রোল", icon: UserCog, adminOnly: true },
  { to: "/admin/settings", label: "সেটিংস", icon: SettingsIcon, adminOnly: true },
];

function AdminLayout() {
  const [open, setOpen] = useState(false);
  const fetchRoles = useServerFn(getMyRoles);
  const rolesQ = useQuery({ queryKey: ["my-roles"], queryFn: () => fetchRoles() });
  const roles = rolesQ.data ?? [];
  const isAdmin = roles.includes("admin");
  const isStaff = roles.includes("staff");
  const hasAccess = isAdmin || isStaff;

  if (rolesQ.isLoading) {
    return <div className="grid min-h-screen place-items-center"><div className="text-muted-foreground text-sm">লোড হচ্ছে...</div></div>;
  }

  if (!hasAccess) {
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">অ্যাক্সেস নেই</h1>
          <p className="text-muted-foreground">এই প্যানেলে প্রবেশের জন্য Admin বা Staff role প্রয়োজন।</p>
          <div className="flex gap-2 justify-center">
            <Link to="/customer"><Button variant="outline">কাস্টমার প্যানেলে যান</Button></Link>
            <Link to="/"><Button className="bg-gradient-primary text-white">হোম</Button></Link>
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
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-white">NB</div>
          <span>Net Bill Pro</span>
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SidebarContent isAdmin={isAdmin} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function SidebarContent({ isAdmin, onNavigate }: { isAdmin: boolean; onNavigate?: () => void }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-white font-bold">NB</div>
          <div>
            <div className="font-bold leading-tight">Net Bill Pro</div>
            <div className="text-xs text-muted-foreground">ISP অ্যাডমিন প্যানেল</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.filter((n) => !n.adminOnly || isAdmin).map((item, i) => {
          const active = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to) && !item.exact;
          const Icon = item.icon;
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
              <span className="flex-1 text-left">{item.label}</span>
              {item.disabled && <span className="text-[10px] rounded bg-muted px-1.5 py-0.5">শীঘ্রই</span>}
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
          <LogOut className="mr-2 h-4 w-4" /> লগআউট
        </Button>
      </div>
    </div>
  );
}
