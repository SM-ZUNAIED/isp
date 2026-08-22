import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, ChevronDown, LogOut, Moon, Search, Sun, UserCircle2, UserPlus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { useTheme } from "@/hooks/use-theme";
import { resellerCustomers, resellerDashboard } from "@/lib/reseller.functions";

type Bn = { bn: string; en: string };

export function ResellerHeader({
  menu,
  displayName,
  balance,
}: {
  menu: React.ReactNode;
  displayName: string;
  balance: number;
}) {
  const { lang, toggle: toggleLang } = useI18n();
  const L = (b: Bn) => (lang === "en" ? b.en : b.bn);
  const { theme, toggle: toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [openSearch, setOpenSearch] = useState(false);

  const statsFn = useServerFn(resellerDashboard);
  const stats = useQuery({ queryKey: ["reseller-header-stats"], queryFn: () => statsFn(), staleTime: 30_000 });

  const searchFn = useServerFn(resellerCustomers);
  const results = useQuery({
    queryKey: ["reseller-header-search", q],
    queryFn: () => searchFn({ data: { q, limit: 8 } }),
    enabled: q.trim().length >= 2,
  });

  const cards = stats.data?.cards;
  const online = cards?.active ?? 0;
  const offline = Math.max(0, (cards?.total ?? 0) - online);
  const alerts = (cards?.pending ?? 0) + (cards?.expired ?? 0);
  const rows = (results.data ?? []) as Array<Record<string, unknown>>;

  const Pill = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("hidden items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm md:flex", className)}>
      {children}
    </div>
  );

  return (
    <header className="flex items-center gap-2 border-b bg-card/60 px-3 py-2.5 backdrop-blur">
      {menu}

      <Popover open={openSearch && q.trim().length >= 2} onOpenChange={setOpenSearch}>
        <PopoverTrigger asChild>
          <div className="relative w-40 sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => { setQ(e.target.value); setOpenSearch(true); }}
              onFocus={() => setOpenSearch(true)}
              onKeyDown={(e) => { if (e.key === "Enter") { setOpenSearch(false); navigate({ to: "/reseller/customer-search" }); } }}
              placeholder={L({ bn: "ইউজার খুঁজুন...", en: "Search user..." })}
              className="h-9 rounded-full border-transparent bg-muted pl-9"
            />
          </div>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-1" onOpenAutoFocus={(e) => e.preventDefault()}>
          {rows.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              {results.isFetching ? L({ bn: "খোঁজা হচ্ছে...", en: "Searching..." }) : L({ bn: "কিছু পাওয়া যায়নি", en: "No results" })}
            </p>
          ) : (
            rows.map((c) => (
              <Link
                key={String(c.id)}
                to="/reseller/customers"
                onClick={() => setOpenSearch(false)}
                className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
              >
                <div className="font-medium">{String(c.full_name ?? "")}</div>
                <div className="font-mono text-xs text-muted-foreground">{String(c.customer_code ?? "")}</div>
              </Link>
            ))
          )}
        </PopoverContent>
      </Popover>

      <div className="ml-auto flex items-center gap-2">
        <Button asChild size="sm" variant="outline" className="h-9 rounded-lg">
          <Link to="/reseller/customers/add">
            <UserPlus className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">{L({ bn: "কাস্টমার যোগ", en: "Add Customer" })}</span>
          </Link>
        </Button>

        <Pill>
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{L({ bn: "ব্যালেন্স", en: "Balance" })}:</span>
          <span className="font-semibold tabular-nums">{Number(balance ?? 0).toFixed(2)}</span>
        </Pill>

        <Pill>
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">{L({ bn: "অনলাইন", en: "Online" })}:</span>
          <span className="font-semibold text-emerald-600 tabular-nums">{online}</span>
        </Pill>

        <Pill>
          <span className="h-2 w-2 rounded-full bg-destructive" />
          <span className="text-muted-foreground">{L({ bn: "অফলাইন", en: "Offline" })}:</span>
          <span className="font-semibold text-destructive tabular-nums">{offline}</span>
        </Pill>

        <Button variant="outline" size="icon" className="relative h-9 w-9 rounded-lg" aria-label={L({ bn: "নোটিফিকেশন", en: "Notifications" })}>
          <Bell className="h-4 w-4" />
          {alerts > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {alerts}
            </span>
          )}
        </Button>

        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2 rounded-lg">
              <UserCircle2 className="h-4 w-4" />
              <span className="max-w-24 truncate">{displayName}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{displayName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/reseller/profile"><UserCircle2 className="mr-2 h-4 w-4" />{L({ bn: "প্রোফাইল", en: "Profile" })}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleLang}>
              <span className="mr-2 w-4 text-center text-xs font-bold">{lang === "bn" ? "EN" : "বাং"}</span>
              {L({ bn: "English", en: "বাংলা" })}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}>
              <LogOut className="mr-2 h-4 w-4" />{L({ bn: "লগআউট", en: "Logout" })}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
