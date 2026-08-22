import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/hooks/use-i18n";
import { useResellerCtx } from "./_authenticated.reseller";
import { getMyResellerContext } from "@/lib/reseller.functions";
import { RESELLER_MODULE_LABELS, RESELLER_MODULES, type ResellerPerm } from "@/lib/reseller-keys";

export const Route = createFileRoute("/_authenticated/reseller/admin")({
  component: ResellerAdmin,
});

function ResellerAdmin() {
  const { lang } = useI18n();
  const L = (b: { bn: string; en: string }) => (lang === "en" ? b.en : b.bn);
  const { reseller } = useResellerCtx();
  const fn = useServerFn(getMyResellerContext);
  const q = useQuery({ queryKey: ["reseller-context"], queryFn: () => fn() });

  if (q.isLoading) return <div className="grid place-items-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  const perms = (q.data?.permissions ?? []) as ResellerPerm[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{L({ bn: "অ্যাডমিন", en: "Admin" })}</h1>
        <p className="text-sm text-muted-foreground">
          {L({ bn: "শুধুমাত্র রিসেলার-লেভেল তথ্য। সিস্টেম সেটিংস পরিবর্তনযোগ্য নয়।", en: "Reseller-level information only. System settings are not editable." })}
        </p>
      </div>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-600" />
          <span>
            {L({
              bn: "পারমিশন কেবল মূল অ্যাডমিন পরিবর্তন করতে পারেন। অন্য রিসেলারের ডেটা বা গ্লোবাল সেটিংসে প্রবেশাধিকার নেই।",
              en: "Only the main admin can change permissions. No access to other resellers' data or global settings.",
            })}
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{L({ bn: "অ্যাকাউন্ট", en: "Account" })}</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <div><span className="text-muted-foreground">{L({ bn: "নাম", en: "Name" })}: </span>{reseller?.name}</div>
          <div><span className="text-muted-foreground">{L({ bn: "ব্যবসা", en: "Business" })}: </span>{reseller?.business_name ?? "—"}</div>
          <div><span className="text-muted-foreground">{L({ bn: "ব্যালেন্স", en: "Balance" })}: </span>৳{Number(reseller?.current_balance ?? 0).toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{L({ bn: "আমার অ্যাক্সেস", en: "My Access" })}</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {RESELLER_MODULES.map((k) => {
            const p = perms.find((x) => x.permission_key === k);
            return (
              <Badge key={k} variant={p?.can_view ? "default" : "secondary"}>
                {L(RESELLER_MODULE_LABELS[k])}
                {p?.can_view ? ` · ${[p.can_create && "C", p.can_edit && "E", p.can_delete && "D"].filter(Boolean).join("") || "V"}` : ""}
              </Badge>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
