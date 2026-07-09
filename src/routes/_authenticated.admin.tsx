import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
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
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const NAV: Array<{ to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean; disabled?: boolean }> = [
  { to: "/admin", label: "ড্যাশবোর্ড", icon: LayoutDashboard, exact: true },
  { to: "/admin/customers", label: "কাস্টমার", icon: Users },
  { to: "/admin/packages", label: "প্যাকেজ", icon: Package },
  { to: "/admin/zones", label: "জোন / এলাকা", icon: Radio },
  { to: "/admin/bills", label: "বিল", icon: Receipt },
  { to: "/admin/payments", label: "পেমেন্ট লগ", icon: Wallet },
  { to: "/admin", label: "MikroTik", icon: RouterIcon, disabled: true },
  { to: "/admin", label: "সাপোর্ট টিকেট", icon: Ticket, disabled: true },
  { to: "/admin", label: "নোটিশ", icon: Bell, disabled: true },
  { to: "/admin", label: "সেটিংস", icon: SettingsIcon, disabled: true },
];

function AdminLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r bg-card">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b bg-card px-4 py-3">
        <Link to="/admin" className="flex items-center gap-2 font-bold">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-white">NB</div>
          <span>Net Bill Pro</span>
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SidebarContent onNavigate={() => setOpen(false)} />
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

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
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
        {NAV.map((item, i) => {
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
          variant="outline"
          className="w-full justify-start"
          onClick={async () => {
            await signOut();
            navigate({ to: "/auth" });
          }}
        >
          <LogOut className="mr-2 h-4 w-4" /> লগআউট
        </Button>
      </div>
    </div>
  );
}
