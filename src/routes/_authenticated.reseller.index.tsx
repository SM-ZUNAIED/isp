import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Users, UserCheck, UserX, UserPlus, Ban, Gift, CalendarX, Clock, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/hooks/use-i18n";
import { resellerDashboard } from "@/lib/reseller.functions";

export const Route = createFileRoute("/_authenticated/reseller/")({
  component: ResellerHome,
});

function ResellerHome() {
  const { lang } = useI18n();
  const L = (b: { bn: string; en: string }) => (lang === "en" ? b.en : b.bn);
  const fn = useServerFn(resellerDashboard);
  const q = useQuery({ queryKey: ["reseller-dashboard"], queryFn: () => fn() });

  if (q.isLoading) return <div className="grid place-items-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (q.error) return <p className="text-destructive">{(q.error as Error).message}</p>;

  const d = q.data!;
  const cards = [
    { icon: Users, label: { bn: "মোট কাস্টমার", en: "Total Clients" }, value: d.cards.total },
    { icon: UserCheck, label: { bn: "সক্রিয়", en: "Active Clients" }, value: d.cards.active },
    { icon: UserX, label: { bn: "নিষ্ক্রিয়", en: "Deactive Clients" }, value: d.cards.deactive },
    { icon: UserPlus, label: { bn: "নতুন (এ মাসে)", en: "New Clients" }, value: d.cards.newThisMonth },
    { icon: Ban, label: { bn: "ডিসেবলড", en: "Disabled Clients" }, value: d.cards.disabled },
    { icon: Gift, label: { bn: "ফ্রি", en: "Free Clients" }, value: d.cards.free },
    { icon: CalendarX, label: { bn: "মেয়াদোত্তীর্ণ", en: "Expire Clients" }, value: d.cards.expired },
    { icon: Clock, label: { bn: "পেন্ডিং", en: "Pending Clients" }, value: d.cards.pending },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{d.reseller.name}</h1>
        <p className="text-sm text-muted-foreground">{L({ bn: "আপনার কাস্টমার ও বিলিং সারসংক্ষেপ", en: "Your customer and billing overview" })}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label.en}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10"><c.icon className="h-5 w-5 text-primary" /></div>
              <div>
                <div className="text-2xl font-bold">{c.value}</div>
                <div className="text-xs text-muted-foreground">{L(c.label)}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: { bn: "মোট বিল", en: "Amount" }, value: d.billing.amount },
          { label: { bn: "কালেকশন", en: "Collection" }, value: d.billing.collection },
          { label: { bn: "বকেয়া", en: "Due" }, value: d.billing.due },
          { label: { bn: "এ মাসের কালেকশন", en: "This Month Collection" }, value: d.collectionThisMonth },
        ].map((b) => (
          <Card key={b.label.en}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Wallet className="h-4 w-4" />{L(b.label)}</div>
              <div className="mt-1 text-xl font-bold">৳{Number(b.value).toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
